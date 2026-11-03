"""Zweite Prüfung auf dem eigenen PC für Seiten, die GitHub (Rechenzentrum) nicht lesen darf (HTTP 403, Zeitüberschreitung).

Viele Vereinsseiten sperren die Adressen von Rechenzentren pauschal, lassen aber normale Heimanschlüsse durch.
Dieses Programm nimmt genau die Seiten, die der Nachtlauf bei GitHub nicht lesen konnte, ruft sie von diesem PC aus ab
(gleiche ehrliche Kennung, robots.txt wird weiter beachtet, 1,5 s Abstand pro Server) und schreibt:
  - den Seitenstand zurück nach data/quellen-status.json (damit spätere Vergleiche funktionieren)
  - den Bericht docs/AENDERUNGEN_PC.md (eigene Datei, damit der Nachtlauf sie nicht überschreibt)
Seiten, die auch von hier 403 liefern, stehen im Bericht unter "Nur im Browser lesbar" und werden von Hand geprüft.

Aufruf: python scripts/pc_pruefung.py
"""
import json
import sys
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta
from pathlib import Path

from aenderungen import RACES, STATUS, ROOT, check, ist_tagesdatum, KALENDER
from urllib.parse import urlparse

REPORT = ROOT / "docs" / "AENDERUNGEN_PC.md"


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    races = json.loads(RACES.read_text(encoding="utf-8"))["races"]
    alt = json.loads(STATUS.read_text(encoding="utf-8")) if STATUS.exists() else {}

    quellen = {}
    for r in races:
        u = (r.get("url") or "").strip()
        if u.startswith("http"):
            quellen.setdefault(u, []).append(r)

    # nur Seiten, die der Nachtlauf nicht lesen konnte (nicht ok, nicht per robots.txt gesperrt)
    urls = [u for u in quellen if u in alt and alt[u].get("status") not in ("ok", "robots", None)]
    print(f"{len(urls)} Seiten werden vom PC aus geprüft …")
    with ThreadPoolExecutor(max_workers=4) as ex:
        ergebnisse = dict(zip(urls, ex.map(check, urls)))

    heute = datetime.now().date()
    tage = [heute + timedelta(days=d) for d in (-1, 0, 1)]
    gelesen, geaendert, erstmals, weiter_gesperrt, robots = [], [], [], [], []
    for u in urls:
        e, a = ergebnisse[u], alt[u]
        if e["status"] == "robots":
            robots.append(u)
            continue
        if e["status"] != "ok":
            weiter_gesperrt.append((u, e["status"] + (" " + e.get("meldung", "")).rstrip()))
            continue
        gelesen.append(u)
        if a.get("tokens"):
            plus = [t for t in sorted(set(e["tokens"]) - set(a["tokens"])) if not ist_tagesdatum(t, tage)]
            minus = [t for t in sorted(set(a["tokens"]) - set(e["tokens"])) if not ist_tagesdatum(t, tage)]
            if plus or minus:
                e["seit"] = e["geprueft"][:10]
                geaendert.append((u, plus, minus))
            else:
                e["seit"] = a.get("seit")
        else:
            e["seit"] = None
            erstmals.append(u)
        alt[u] = e      # Stand mit Inhalten zurückschreiben

    STATUS.write_text(json.dumps(alt, ensure_ascii=False, indent=0) + "\n", encoding="utf-8")

    def namen(u):
        return ", ".join(r["id"] for r in quellen[u])

    z = ["# Zweite Prüfung vom PC (Seiten, die GitHub nicht lesen darf)", "",
         f"Stand: {datetime.now().strftime('%d.%m.%Y %H:%M')} · {len(urls)} Seiten · {len(gelesen)} vom PC lesbar · "
         f"{len(weiter_gesperrt)} auch hier gesperrt/fehlerhaft", ""]
    if geaendert:
        z += ["## Geändert seit dem letzten Stand", ""]
        for u, plus, minus in geaendert:
            z += [f"- **{namen(u)}** – {u}", f"  - neu: {', '.join(p[2:] for p in plus[:15]) or '–'}",
                  f"  - weg: {', '.join(m[2:] for m in minus[:15]) or '–'}"]
        z.append("")
    if erstmals:
        z += ["## Erstmals gelesen (Ausgangsstand angelegt, noch kein Vergleich)", ""] + [f"- {namen(u)} – {u}" for u in erstmals] + [""]
    if weiter_gesperrt:
        z += ["## Nur im Browser lesbar (auch vom PC gesperrt)", ""] + [f"- {namen(u)} – {u} – {why}" for u, why in weiter_gesperrt] + [""]
    if robots:
        z += ["## Per robots.txt gesperrt", ""] + [f"- {u}" for u in robots] + [""]
    REPORT.write_text("\n".join(z) + "\n", encoding="utf-8")
    print(z[2])


if __name__ == "__main__":
    main()
