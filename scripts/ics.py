"""Kalenderdateien (.ics) für den Apple Kalender / iPhone erzeugen (nur Standardbibliothek).

Je kommendem Lauf entsteht app/ics/<id>.ics mit bis zu drei Terminen samt Erinnerungen:
  Anmeldestart  (am Morgen des Tages, nur wenn er noch kommt)
  Meldeschluss  (7, 3 und 1 Tag vorher um 09:00, nur wenn er noch kommt)
  Lauftag       (7 Tage und 1 Tag vorher; mit Startzeit, sonst ganztägig)
Die App verlinkt darauf (Knopf "Apple Kalender"). Eine echte Datei mit Dateityp text/calendar öffnet auf dem iPhone den
Dialog "Zum Kalender hinzufügen"; eine Adresse mit Daten im Link (data:) zeigt dort nur einen schwarzen Bildschirm.
Der Ordner wird beim Veröffentlichen erzeugt (.github/workflows/deploy.yml) und nicht ins Repository eingecheckt.

Aufruf (aus dem Hauptordner):  python scripts/ics.py
"""
import json
import re
import shutil
import sys
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RACES = ROOT / "data" / "races.json"
OUT = ROOT / "app" / "ics"


def lab(k):
    k = str(k)
    return "Halbmarathon" if k == "HM" else "Marathon" if k == "M" else (k + " km") if re.fullmatch(r"[\d,]+", k) else k


def esc(s):
    return (str(s or "").replace("\\", "\\\\").replace(";", "\\;").replace(",", "\\,").replace("\r\n", "\n").replace("\n", "\\n"))


def fold(line, limit=70):
    """Zeilen auf höchstens 70 Byte kürzen (Fortsetzung mit Leerzeichen), Umlaute zählen 2 Byte"""
    out, cur, n = [], "", 0
    for ch in line:
        b = len(ch.encode("utf-8"))
        if n + b > limit:
            out.append(cur)
            cur, n = " ", 1
        cur += ch
        n += b
    out.append(cur)
    return "\r\n".join(out)


def ymd(d):
    return d.strftime("%Y%m%d")


def fmt(iso):
    y, m, d = iso.split("-")
    return f"{d}.{m}.{y}"


def alarm(trigger, text):
    return ["BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + esc(text), "TRIGGER:" + trigger, "END:VALARM"]


def event(uid, stamp, summary, desc, loc, url, start, alarms):
    return (["BEGIN:VEVENT", "UID:" + uid, "DTSTAMP:" + stamp] + start + ["SUMMARY:" + esc(summary), "DESCRIPTION:" + esc(desc)]
            + (["LOCATION:" + esc(loc)] if loc else []) + (["URL:" + url] if url else []) + ["TRANSP:TRANSPARENT"] + alarms + ["END:VEVENT"])


def build(r, heute):
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    d = date.fromisoformat(r["date"])
    end = date.fromisoformat(r["end"]) if r.get("end") else None
    name, url = r["name"], r.get("url") or ""
    title = name if r.get("confirmed") else name + " (Termin nicht bestätigt)"
    loc = r.get("start_place") or r.get("place") or ""
    st = r.get("start_time") or ""
    details = ", ".join(lab(k) for k in (r.get("distances") or [])) + (f" · Start {st} Uhr" if st else "") + f" · Infos: {url} (aus Race Hunt)"

    def ganztag(a, b=None):
        return ["DTSTART;VALUE=DATE:" + ymd(a), "DTEND;VALUE=DATE:" + ymd((b or a) + timedelta(days=1))]

    ev = []
    ro = date.fromisoformat(r["reg_open"]) if r.get("reg_open") else None
    rc = date.fromisoformat(r["reg_close"]) if r.get("reg_close") else None
    if ro and ro >= heute:
        ev += event(r["id"] + "-start@pacehunt", stamp, "Anmeldung startet: " + name,
                    f"Heute startet die Anmeldung für {name} am {fmt(r['date'])}. {url}", "", url, ganztag(ro),
                    alarm("PT8H", "Heute startet die Anmeldung: " + name))
    if rc and rc >= heute:
        ev += event(r["id"] + "-frist@pacehunt", stamp, "Meldeschluss: " + name,
                    f"Letzter Tag zur Anmeldung für {name} am {fmt(r['date'])}. {url}", "", url, ganztag(rc),
                    alarm("-P6DT15H", "In 7 Tagen ist Meldeschluss: " + name) + alarm("-P2DT15H", "In 3 Tagen ist Meldeschluss: " + name)
                    + alarm("-PT15H", "Morgen ist Meldeschluss: " + name))
    if re.fullmatch(r"\d\d:\d\d", st):
        h = min(23, int(st[:2]) + 4)
        start = ["DTSTART:" + ymd(d) + "T" + st.replace(":", "") + "00", "DTEND:" + ymd(d) + "T" + f"{h:02d}" + st[3:] + "00"]
    else:
        start = ganztag(d, end)
    ev += event(r["id"] + "-lauf@pacehunt", stamp, title, details, loc, url, start,
                alarm("-P7D", f"In einer Woche: {name} – Packliste und Wetter ansehen")
                + alarm("-P1D", f"Morgen: {name}" + (f" – Start {st} Uhr" if st else "") + ". Startunterlagen, Anfahrt und Wetter in der App prüfen"))
    zeilen = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Race Hunt//Lauf-App//DE", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"] + ev + ["END:VCALENDAR"]
    return "\r\n".join(fold(z) for z in zeilen) + "\r\n"


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    heute = date.today()
    races = json.loads(RACES.read_text(encoding="utf-8"))["races"]
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)
    n = 0
    for r in races:
        if date.fromisoformat(r["date"]) < heute:
            continue
        (OUT / (r["id"] + ".ics")).write_bytes(build(r, heute).encode("utf-8"))
        n += 1
    print(f"{n} Kalenderdateien in {OUT}")


if __name__ == "__main__":
    main()
