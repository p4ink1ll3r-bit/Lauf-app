"""Sucht auf den bekannten Seiten (url/source) der kommenden Läufe nach Links zu RaceResult- oder SAS-Portalen.
Nutzt dieselbe robots-Prüfung und denselben Abruf wie scripts/portale.py. Nur Lesen, ändert nichts."""
import importlib.util
import json
import re
import sys
import time
from datetime import date
from pathlib import Path

spec = importlib.util.spec_from_file_location("portale", r"C:\LAUFAPP\scripts\portale.py")
pt = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pt)
sys.stdout.reconfigure(encoding="utf-8")

races = json.loads(Path(r"C:\LAUFAPP\data\races.json").read_text(encoding="utf-8"))["races"]
von, bis = "2026-11-02", "2027-04-30"
felder = ("fee", "reg_close")
ziele = []
for r in races:
    if not (von <= r["date"] <= bis):
        continue
    fehlt = [f for f in felder if not r.get(f) and not (r.get("prev") or {}).get(f)]
    if not fehlt:
        continue
    bekannt = pt.portal_of(r)
    if bekannt:
        continue                       # Portal schon bekannt und abgefragt
    ziele.append((r, fehlt))

print(len(ziele), "Läufe ohne bekanntes Portal und mit Lücken bei Startgeld/Meldeschluss")
for r, fehlt in ziele:
    gefunden = {}
    for u in {r.get("url"), r.get("source")}:
        if not u or not u.startswith("http") or u.lower().split("?")[0].endswith(".pdf"):
            continue
        try:
            if not pt.erlaubt(u):
                continue
            html = pt.get(u)
        except Exception:
            continue
        time.sleep(1.0)
        for m in pt.RR_RE.findall(html):
            gefunden[f"https://my.raceresult.com/{m}/info"] = "RaceResult"
        for m in pt.SAS_RE.findall(html):
            gefunden[f"https://www.sas-online.net/eventportal_bs/{m}/"] = "SAS"
    if gefunden:
        print(f"{r['date']} | {r['id']} | fehlt {','.join(fehlt)}")
        for k, v in gefunden.items():
            print("    ", v, k)
