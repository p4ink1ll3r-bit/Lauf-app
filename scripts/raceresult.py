"""RaceResult-Anmeldeseiten auslesen (ohne KI, nur Standardbibliothek).

Jede Veranstaltung auf my.raceresult.com liefert ihre Anmeldedaten als JSON unter
    https://my.raceresult.com/<ID>/registration/config
Darin stehen Strecken, Startzeiten, Startgeld je Altersgruppe, Beginn/Ende der Anmeldung und freie Plätze.

Aufruf (zeigt nur Vorschläge, ändert nichts):
    python scripts/raceresult.py             alle Läufe mit RaceResult-Link prüfen
    python scripts/raceresult.py 375206      eine einzelne Veranstaltung ansehen
    python scripts/raceresult.py --apply     leere Felder in data/races.json füllen
Es werden nur LEERE Felder gefüllt, vorhandene Angaben bleiben unangetastet.
"""
import json
import re
import sys
import urllib.request
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RACES = ROOT / "data" / "races.json"
CONFIG_URL = "https://my.raceresult.com/{id}/registration/config?lang=de&test=&sanitize=true"
ID_RE = re.compile(r"raceresult\.com/(\d{4,7})")


def fetch_config(event_id):
    req = urllib.request.Request(CONFIG_URL.format(id=event_id), headers={"User-Agent": "Pacehunt-Datenpflege/0.1"})
    with urllib.request.urlopen(req, timeout=30) as res:
        return json.loads(res.read().decode("utf-8"))


def day(iso):
    """'2026-12-01T23:59:59+01:00' -> '2026-12-01'; leere Platzhalter (Jahr 0001) -> None."""
    if not iso or iso.startswith("0001"):
        return None
    return iso[:10]


def parse(cfg):
    """Macht aus der RaceResult-Antwort eine flache, gut lesbare Zusammenfassung."""
    contests, opens, closes, slots = [], [], [], []
    for reg in cfg.get("Registrations") or []:
        if reg.get("Type") not in ("single", None):
            continue  # Sammel-/Staffelanmeldungen nicht doppelt zählen
        if day(reg.get("EnabledFrom")):
            opens.append(day(reg["EnabledFrom"]))
        if day(reg.get("EnabledTo")):
            closes.append(day(reg["EnabledTo"]))
        for c in reg.get("Contests") or []:
            fees = []
            for f in c.get("EntryFees") or []:
                fees.append({"von": day(f.get("RegStart")), "bis": day(f.get("RegEnd")), "preis": f.get("Fee"),
                             "jahrgang": f"{(f.get('DateStart') or '')[:4]}-{(f.get('DateEnd') or '')[:4]}"})
            contests.append({"name": c.get("Name"), "start": (c.get("Start") or "")[11:16] or None,
                             "preise": fees, "frei": c.get("SlotsLeft", -1)})
            slots.append(c.get("SlotsLeft", -1))
    return {
        "datum": day(cfg.get("EventDate")),
        "reg_open": min(opens) if opens else None,
        "reg_close": max(closes) if closes else None,
        "strecken": contests,
        "ausgebucht": bool(slots) and all(s == 0 for s in slots),
    }


def event_id_of(race):
    for key in ("url", "source"):
        m = ID_RE.search(race.get(key) or "")
        if m:
            return m.group(1)
    return None


def tage_zwischen(a, b):
    return (date.fromisoformat(b) - date.fromisoformat(a)).days


def vorschlaege(race, info):
    """Welche leeren Felder lassen sich aus der Anmeldeseite füllen?

    Sicherungen: Die RaceResult-Veranstaltung muss zum selben Datum gehören wie unser Lauf (sonst ist es
    eine andere Ausgabe, etwa das Vorjahr), und Fristen müssen plausibel vor dem Lauftag liegen."""
    vs = {}
    if not info["datum"] or info["datum"] != race.get("date"):
        return vs
    tag = info["datum"]
    o, c = info["reg_open"], info["reg_close"]
    if not race.get("reg_open") and o and 0 <= tage_zwischen(o, tag) <= 400 and not o.endswith("-01-01"):
        vs["reg_open"] = o
    if not race.get("reg_close") and c and 1 <= tage_zwischen(c, tag) <= 120:  # am Lauftag selbst = Platzhalter
        vs["reg_close"] = c
    if not race.get("sold_out") and info["ausgebucht"]:
        vs["sold_out"] = "Laut Anmeldeseite ausgebucht"
    return vs


def show(info):
    print(f"  Datum {info['datum']} | Anmeldung {info['reg_open']} bis {info['reg_close']} | ausgebucht: {info['ausgebucht']}")
    for c in info["strecken"]:
        preise = ", ".join(f"{p['preis']} €" + (f" ({p['von']}–{p['bis']})" if p["von"] else "") for p in c["preise"])
        frei = "" if c["frei"] in (-1, None) else f" | frei: {c['frei']}"
        print(f"  - {c['start'] or '--:--'} {c['name']}: {preise}{frei}")


def main(argv):
    sys.stdout.reconfigure(encoding="utf-8")
    apply = "--apply" in argv
    ids = [a for a in argv if a.isdigit()]
    if ids:
        for i in ids:
            print(f"== {i}")
            show(parse(fetch_config(i)))
        return

    data = json.loads(RACES.read_text(encoding="utf-8"))
    geaendert = 0
    for race in data["races"]:
        eid = event_id_of(race)
        if not eid:
            continue
        try:
            info = parse(fetch_config(eid))
        except Exception as e:  # Seite weg, umgebaut oder keine Anmeldung: nur melden
            print(f"!! {race['id']} ({eid}): {e}")
            continue
        vs = vorschlaege(race, info)
        print(f"== {race['id']} (Event {eid}): {len(info['strecken'])} Strecken" + (f" -> Vorschlag: {vs}" if vs else " -> nichts Neues"))
        if info["datum"] and info["datum"] != race.get("date"):
            print(f"   ACHTUNG Datum weicht ab: RaceResult {info['datum']} / unsere Daten {race.get('date')}")
        if apply and vs:
            race.update(vs)
            race["checked"] = date.today().isoformat()
            geaendert += 1
    if apply:
        RACES.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        print(f"{geaendert} Läufe ergänzt.")
    else:
        print("Nur Vorschau. Mit --apply werden leere Felder gefüllt.")


if __name__ == "__main__":
    main(sys.argv[1:])
