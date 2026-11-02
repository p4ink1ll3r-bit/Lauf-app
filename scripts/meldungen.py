"""Sichert die Meldungen aus der App (Supabase, Tabelle reports) und hält das Projekt wach.

Läuft jede Nacht in GitHub (workflows/meldungen.yml):
- Mit SUPABASE_SECRET_KEY: liest alle Meldungen und schreibt sie nach meldungen-sicherung/meldungen.json.
  Die Datei bleibt bewusst NICHT im öffentlichen Repo (Meldungen können persönliche Angaben enthalten),
  sondern geht als privates Workflow-Artefakt (90 Tage) hoch.
- Ohne Secret-Key: nur ein Lesezugriff mit dem öffentlichen Schlüssel, damit das kostenlose Projekt
  nach einer Woche Stille nicht pausiert. Das Lesen liefert dann eine leere Liste, das ist gewollt.
"""
import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone

URL = os.environ.get("SUPABASE_URL", "https://gbaoxnsytnzcuxbkdrwc.supabase.co").rstrip("/")
PUBLISHABLE = os.environ.get("SUPABASE_PUBLISHABLE_KEY", "")
SECRET = os.environ.get("SUPABASE_SECRET_KEY", "")
ORDNER = "meldungen-sicherung"


def holen(pfad, key, von=0, bis=999):
    req = urllib.request.Request(
        URL + pfad,
        headers={"apikey": key, "Range": f"{von}-{bis}", "Range-Unit": "items"},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))


def zusammenfassung(text):
    pfad = os.environ.get("GITHUB_STEP_SUMMARY")
    print(text)
    if pfad:
        with open(pfad, "a", encoding="utf-8") as f:
            f.write(text + "\n")


def main():
    if not SECRET:
        if not PUBLISHABLE:
            print("::error::Weder SUPABASE_SECRET_KEY noch SUPABASE_PUBLISHABLE_KEY gesetzt.")
            return 1
        holen("/rest/v1/reports?select=id&limit=1", PUBLISHABLE, 0, 0)
        zusammenfassung("Supabase ist wach. Keine Sicherung gemacht, weil das Secret `SUPABASE_SECRET_KEY` in GitHub fehlt.")
        print("::warning::SUPABASE_SECRET_KEY fehlt, es wurde nur das Projekt geweckt.")
        return 0

    alle, von = [], 0
    while True:
        teil = holen("/rest/v1/reports?select=*&order=id.asc", SECRET, von, von + 999)
        alle += teil
        if len(teil) < 1000:
            break
        von += 1000

    os.makedirs(ORDNER, exist_ok=True)
    with open(os.path.join(ORDNER, "meldungen.json"), "w", encoding="utf-8") as f:
        json.dump(alle, f, ensure_ascii=False, indent=1)

    grenze = (datetime.now(timezone.utc) - timedelta(hours=26)).isoformat()
    neu = [m for m in alle if (m.get("created_at") or "") >= grenze]
    zeilen = [f"**{len(alle)} Meldungen** gesichert, davon **{len(neu)}** neu seit gestern."]
    for m in neu[:20]:
        was = m.get("race_name") or m.get("name") or "?"
        zeilen.append(f"- {m.get('type')}: {was} ({m.get('kind') or 'Lauf fehlt'})")
    zusammenfassung("\n".join(zeilen))
    ausgabe = os.environ.get("GITHUB_OUTPUT")
    if ausgabe:
        with open(ausgabe, "a", encoding="utf-8") as f:
            f.write(f"neu={len(neu)}\n")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except urllib.error.HTTPError as e:
        print(f"::error::Supabase antwortet mit {e.code}: {e.read().decode('utf-8', 'replace')[:200]}")
        sys.exit(1)
