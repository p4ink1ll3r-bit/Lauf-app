"""Anmelde- und Zeitnahme-Portale auslesen (ohne KI, nur Standardbibliothek).

Unterstützt: RaceResult (my.raceresult.com) und SAS-Eventportal (sas-online.net).
Jedes Portal liefert Strecken, Preise und Fristen in festem Aufbau, daher genügt je ein kleines Auslese-Stück.
NICHT unterstützt: Zeitgemäß (zeitgemaess.info) - deren robots.txt verbietet den automatischen Abruf von event.php.
Vor jedem Abruf wird die robots.txt der Seite geprüft; was sie verbietet, wird nicht abgerufen.

Aufruf:
    python scripts/portale.py            Vorschau für alle Läufe mit Portal-Link (ändert nichts)
    python scripts/portale.py --apply    leere Felder in data/races.json füllen
    python scripts/portale.py <URL>      eine einzelne Seite ansehen
Es werden nur LEERE Felder gefüllt. Gehört die Portal-Seite zu einem anderen Datum (z. B. Vorjahr), wird sie ignoriert.
"""
import html as htmllib
import json
import re
import sys
import urllib.error
import urllib.request
import urllib.robotparser
from datetime import date
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
RACES = ROOT / "data" / "races.json"
UA = {"User-Agent": "Pacehunt-Datenpflege/0.1"}
MONATE = {m: i + 1 for i, m in enumerate(["januar", "februar", "märz", "april", "mai", "juni", "juli", "august",
                                           "september", "oktober", "november", "dezember"])}

RR_RE = re.compile(r"raceresult\.com/(\d{4,7})")
SAS_RE = re.compile(r"sas-online\.net/eventportal_bs/(\d+)")


_robots = {}


def erlaubt(url):
    """robots.txt der Seite beachten (4xx = keine Datei = erlaubt, 5xx = nichts abrufen)."""
    p = urlparse(url)
    base = f"{p.scheme}://{p.netloc}"
    if base not in _robots:
        rp = urllib.robotparser.RobotFileParser()
        try:
            with urllib.request.urlopen(urllib.request.Request(base + "/robots.txt", headers=UA), timeout=15) as r:
                rp.parse(r.read().decode("utf-8", errors="replace").splitlines())
        except urllib.error.HTTPError as e:
            rp.disallow_all = e.code >= 500
            rp.allow_all = e.code < 500
        except Exception:
            rp.allow_all = True
        _robots[base] = rp
    return _robots[base].can_fetch(UA["User-Agent"], url)


def get(url):
    if not erlaubt(url):
        raise PermissionError(f"robots.txt verbietet den Abruf: {url}")
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as res:
        return res.read().decode("utf-8", errors="replace")

def flat(html):
    """HTML -> Text, Tags werden zu '|' (so bleiben Zeilen und Felder getrennt)."""
    h = re.sub(r"(?is)<(script|style)\b.*?</\1>", "", html)
    h = re.sub(r"(?s)<[^>]+>", "|", h)
    h = htmllib.unescape(h).replace("\xa0", " ")
    h = re.sub(r"[ \t\r\n]+", " ", h)
    return re.sub(r"\|(\s*\|)+", "|", h)


def iso(d, m, y):
    return f"{int(y):04d}-{int(m):02d}-{int(d):02d}"


def dmy(s):
    d, m, y = s.split(".")
    return iso(d, m, y)


def betrag(s):
    return float(s.replace(".", "").replace(",", "."))


def euro(x):
    return (f"{x:.2f}".rstrip("0").rstrip(".") if x != int(x) else str(int(x))).replace(".", ",") + " €"


# ---------------------------------------------------------------- RaceResult
def rr_day(s):
    return None if not s or s.startswith("0001") else s[:10]


def parse_raceresult(eid):
    cfg = json.loads(get(f"https://my.raceresult.com/{eid}/registration/config?lang=de&test=&sanitize=true"))
    opens, closes, contests, slots = [], [], [], []
    for reg in cfg.get("Registrations") or []:
        if reg.get("Type") not in ("single", None):
            continue
        if rr_day(reg.get("EnabledFrom")):
            opens.append(rr_day(reg["EnabledFrom"]))
        if rr_day(reg.get("EnabledTo")):
            closes.append(rr_day(reg["EnabledTo"]))
        for c in reg.get("Contests") or []:
            preise = [f.get("Fee") for f in c.get("EntryFees") or [] if f.get("Fee") is not None]
            stufen = [{"von": rr_day(f.get("RegStart")), "bis": rr_day(f.get("RegEnd")), "fee": f.get("Fee"),
                       "alter": (f.get("DateStart"), f.get("DateEnd"))} for f in c.get("EntryFees") or [] if f.get("Fee") is not None]
            contests.append({"name": c.get("Name"), "tag": rr_day(c.get("Start")), "start": (c.get("Start") or "")[11:16] or None,
                             "km": None, "preise": preise, "stufen": stufen})
            slots.append(c.get("SlotsLeft", -1))
    return {"datum": rr_day(cfg.get("EventDate")), "reg_open": min(opens) if opens else None,
            "reg_close": max(closes) if closes else None, "strecken": contests,
            "ausgebucht": bool(slots) and all(s == 0 for s in slots)}


# ---------------------------------------------------------------- SAS-Eventportal
SAS_CONTEST = re.compile(r"\|\s*([^|]+?)\s*\|\s*(?:Startzeit:\s*\|\s*(?:(\d\d\.\d\d\.\d{4}) - )?(\d\d:\d\d)\s*\|\s*)?"
                         r"Distanz:\s*\|\s*([\d.]+)\s*m\s*\|\s*Preis:\s*\|\s*([\d.,]+)\s*€")
SAS_DATUM = re.compile(r"\|\s*(\d\d\.\d\d\.\d{4})\s*\|\s*\d{5} ")  # Kopfzeile: Datum | PLZ Ort


def parse_sas(eid):
    t = flat(get(f"https://www.sas-online.net/eventportal_bs/{eid}/"))
    m = SAS_DATUM.search(t)
    kopf = dmy(m.group(1)) if m else None
    contests = []
    for name, tag, uhr, dist, preis in SAS_CONTEST.findall(t):
        contests.append({"name": name.strip(), "tag": dmy(tag) if tag else kopf, "start": uhr or None,
                         "km": int(dist.replace(".", "")) / 1000, "preise": [betrag(preis)]})
    datum = kopf or min((c["tag"] for c in contests if c["tag"]), default=None)
    return {"datum": datum, "reg_open": None, "reg_close": None, "strecken": contests, "ausgebucht": False}


# ---------------------------------------------------------------- Zuordnung und Vorschläge
def portal_of(race):
    for key in ("url", "source"):
        s = race.get(key) or ""
        for name, rx, fn in (("RaceResult", RR_RE, parse_raceresult), ("SAS", SAS_RE, parse_sas)):
            m = rx.search(s)
            if m:
                return name, m.group(1), fn
    return None


def tage(a, b):
    return (date.fromisoformat(b) - date.fromisoformat(a)).days


def ddmm(iso_tag):
    return f"{iso_tag[8:10]}.{iso_tag[5:7]}."


def preis_text(s):
    """Startgeld einer Strecke als Text. Eine Stufe: einfacher Preis. Zwei Stufen, die zweite nur wenige Tage vor dem Lauf:
    normaler Preis und Nachmeldung. Alles andere (Frühbucher, Altersgruppen, Rabatte) ist nicht eindeutig und bleibt leer."""
    if len(s["preise"]) == 1:
        return euro(s["preise"][0])
    st = sorted(s.get("stufen") or [], key=lambda x: x["von"] or "")
    if len(st) != 2 or any(x["fee"] < 0 for x in st) or len({x["alter"] for x in st}) > 1:
        return None
    a, b = st
    if not (a["bis"] and b["von"] and b["bis"] and a["bis"] <= b["von"] and tage(b["von"], b["bis"]) <= 7):
        return None
    return f"{euro(a['fee'])} (bis {ddmm(a['bis'])}) · Nachmeldung {euro(b['fee'])}"


def vorschlaege(race, info):
    """Leere Felder, die sich sicher füllen lassen. Sicherung: Portal-Datum muss zu unserem Lauf passen."""
    vs = {}
    if not info["datum"] or info["datum"] != race.get("date"):
        return vs
    tag, o, c = info["datum"], info["reg_open"], info["reg_close"]
    if not race.get("reg_open") and o and 0 <= tage(o, tag) <= 400 and not o.endswith("-01-01"):
        vs["reg_open"] = o
    if not race.get("reg_close") and c and 1 <= tage(c, tag) <= 120:
        vs["reg_close"] = c
    if not race.get("sold_out") and info["ausgebucht"]:
        vs["sold_out"] = "Laut Anmeldeseite ausgebucht"
    if c and c < date.today().isoformat():
        return vs  # Anmeldung schon vorbei, obwohl der Lauf später liegt: Preise/Zeiten wären vom Vorjahr
    am_tag = [s for s in info["strecken"] if s["tag"] == tag]
    if not race.get("start_time"):
        lang = [s for s in am_tag if s["start"] and s["km"] and s["km"] >= 5]  # Hauptstrecke: ab 5 km, frühester Start
        if lang:
            vs["start_time"] = min(s["start"] for s in lang)
    if not race.get("fee") and am_tag and all(s["preise"] for s in am_tag):
        texte = [preis_text(s) for s in am_tag]
        if all(texte):
            vs["fee"] = " · ".join(f"{s['name']} {t}" for s, t in zip(am_tag, texte))
    return vs


def show(info):
    print(f"  Datum {info['datum']} | Anmeldung {info['reg_open']} bis {info['reg_close']} | ausgebucht: {info['ausgebucht']}")
    for s in info["strecken"]:
        print(f"  - {s['tag']} {s['start'] or '--:--'} {s['name']}: {', '.join(euro(p) for p in s['preise'])}")


def main(argv):
    sys.stdout.reconfigure(encoding="utf-8")
    apply = "--apply" in argv
    urls = [a for a in argv if a.startswith("http")]
    if urls:
        for u in urls:
            p = portal_of({"url": u})
            print(f"== {u} -> {p[0] if p else 'unbekanntes Portal'}")
            if p:
                show(p[2](p[1]))
        return
    data = json.loads(RACES.read_text(encoding="utf-8"))
    geaendert = 0
    for race in data["races"]:
        p = portal_of(race)
        if not p:
            continue
        name, eid, fn = p
        try:
            info = fn(eid)
        except Exception as e:  # Seite weg oder umgebaut: nur melden, nichts ändern
            print(f"!! {race['id']} ({name} {eid}): {e}")
            continue
        vs = vorschlaege(race, info)
        print(f"== {race['id']} [{name} {eid}]: {len(info['strecken'])} Strecken" + (f" -> {vs}" if vs else " -> nichts Neues"))
        if info["datum"] and info["datum"] != race.get("date"):
            print(f"   ACHTUNG Datum weicht ab: Portal {info['datum']} / unsere Daten {race.get('date')}")
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
