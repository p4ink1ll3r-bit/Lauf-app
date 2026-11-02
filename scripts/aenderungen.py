"""Änderungserkennung für die Veranstalterseiten (ohne KI, nur Standardbibliothek).

Das Programm ruft jede Seite aus data/races.json auf, zieht daraus nur die für uns wichtigen Angaben
(Daten, Uhrzeiten, Euro-Beträge, Jahreszahlen, Stichwörter wie "Meldeschluss" oder "abgesagt") und vergleicht sie mit dem
letzten Lauf. Reiner Seitenschmuck (Besucherzähler, Werbung, Neuigkeiten) löst dadurch keinen Alarm aus.

Aufruf:
    python scripts/aenderungen.py            alle Seiten prüfen, Bericht nach docs/AENDERUNGEN.md
    python scripts/aenderungen.py --limit 20 nur die ersten 20 Seiten (zum Testen)
Der Stand der letzten Prüfung liegt in data/quellen-status.json. Der erste Lauf legt nur diesen Ausgangsstand an.
Es wird nie robots.txt umgangen: Seiten, die Programme ausschließen, werden übersprungen.
"""
import hashlib
import html as htmllib
import json
import re
import sys
import threading
import time
import urllib.error
import urllib.request
import urllib.robotparser
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
RACES = ROOT / "data" / "races.json"
STATUS = ROOT / "data" / "quellen-status.json"
REPORT = ROOT / "docs" / "AENDERUNGEN.md"
UA = "Pacehunt-Datenpflege/0.1 (+Laufkalender; Kontakt über die App)"
PAUSE = 1.5       # Sekunden Mindestabstand pro Webserver
MAX_BYTES = 3_000_000

DATUM = re.compile(r"\b\d{1,2}\.\s?\d{1,2}\.(?:\s?\d{4})?|\b\d{1,2}\.\s(?:Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)(?:\s\d{4})?")
UHR = re.compile(r"\b\d{1,2}[:.]\d{2}\s?Uhr\b|\b\d{1,2}:\d{2}\b")
EURO = re.compile(r"\b\d{1,4}(?:[.,]\d{1,2})?\s?(?:€|Euro|EUR)\b|€\s?\d{1,4}(?:[.,]\d{1,2})?")
JAHR = re.compile(r"\b20(?:2[5-9])\b")
STICH = ["meldeschluss", "anmeldeschluss", "ausgebucht", "abgesagt", "fällt aus", "verschoben", "nachmeldung", "teilnehmerlimit",
         "anmeldung geöffnet", "anmeldung ab", "anmeldung startet", "wartelist", "startplätze", "ausverkauft"]

KALENDER = {"hdsports.org", "running.life", "gotrail.run", "haid.app", "runnersworld.de", "marathons.com", "trainerday.com",
            "festivalsindeutschland.de", "finishers.com", "ladv.de"}

_hosts = {}
_robots = {}
_lock = threading.Lock()


def text_of(raw_html):
    h = re.sub(r"(?is)<(script|style|noscript|svg)\b.*?</\1>", " ", raw_html)
    h = re.sub(r"(?s)<[^>]+>", " ", h)
    h = htmllib.unescape(h).replace("\xa0", " ")
    return re.sub(r"\s+", " ", h)


def tokens_of(text):
    t = set()
    for rx, pre in ((DATUM, "D "), (UHR, "U "), (EURO, "E "), (JAHR, "J ")):
        for m in rx.findall(text):
            t.add(pre + re.sub(r"\s+", "", m.lower()))
    low = text.lower()
    for s in STICH:
        if s in low:
            t.add("S " + s)
    return sorted(t)


MONATE = {m: i + 1 for i, m in enumerate(["januar", "februar", "märz", "april", "mai", "juni", "juli", "august",
                                           "september", "oktober", "november", "dezember"])}


def ist_tagesdatum(token, tage):
    """True, wenn der Datums-Token nur das heutige (oder gestrige/morgige) Kalenderdatum ist.
    Viele Seiten zeigen das aktuelle Datum an (Tagesliturgie, Nachrichten, Fußzeile) - das ist kein Hinweis auf eine Änderung."""
    m = re.match(r"D (\d{1,2})\.(\d{1,2}|[a-zäö]+)\.?(\d{4})?$", token)
    if not m:
        return False
    monat = int(m.group(2)) if m.group(2).isdigit() else MONATE.get(m.group(2))
    if not monat:
        return False
    jahr = int(m.group(3)) if m.group(3) else None
    return any(t.day == int(m.group(1)) and t.month == monat and (jahr is None or jahr == t.year) for t in tage)


def wait_for_host(host):
    with _lock:
        nxt = _hosts.get(host, 0)
        now = time.monotonic()
        wait = max(0, nxt - now)
        _hosts[host] = max(now, nxt) + PAUSE
    if wait:
        time.sleep(wait)


def erlaubt(url):
    p = urlparse(url)
    base = f"{p.scheme}://{p.netloc}"
    with _lock:
        rp = _robots.get(base)
    if rp is None:
        rp = urllib.robotparser.RobotFileParser()
        try:
            req = urllib.request.Request(base + "/robots.txt", headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=15) as r:
                rp.parse(r.read().decode("utf-8", errors="replace").splitlines())
        except urllib.error.HTTPError as e:
            # RFC 9309: 4xx = "keine robots.txt", dann gibt es keine Einschränkung; 5xx = Server kaputt, lieber nichts abrufen
            if e.code >= 500:
                rp.disallow_all = True
            else:
                rp.allow_all = True
        except Exception:
            rp.allow_all = True
        with _lock:
            _robots[base] = rp
    return rp.can_fetch(UA, url)


def check(url):
    """Eine Seite abrufen -> {status, tokens|hash, ...}"""
    out = {"geprueft": datetime.now(timezone.utc).isoformat(timespec="seconds")}
    try:
        if not erlaubt(url):
            return {**out, "status": "robots"}
        wait_for_host(urlparse(url).netloc)
        req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "de"})
        with urllib.request.urlopen(req, timeout=30) as r:
            ctype = r.headers.get("Content-Type", "")
            body = r.read(MAX_BYTES)
        if "pdf" in ctype.lower() or url.lower().split("?")[0].endswith(".pdf"):
            return {**out, "status": "ok", "art": "pdf", "hash": hashlib.sha256(body).hexdigest()[:16], "tokens": []}
        text = text_of(body.decode("utf-8", errors="replace"))
        return {**out, "status": "ok", "art": "html", "tokens": tokens_of(text), "zeichen": len(text)}
    except urllib.error.HTTPError as e:
        return {**out, "status": f"http {e.code}"}
    except Exception as e:
        return {**out, "status": "fehler", "meldung": str(e)[:120]}


def main(argv):
    sys.stdout.reconfigure(encoding="utf-8")
    limit = int(argv[argv.index("--limit") + 1]) if "--limit" in argv else None
    races = json.loads(RACES.read_text(encoding="utf-8"))["races"]
    alt = json.loads(STATUS.read_text(encoding="utf-8")) if STATUS.exists() else {}

    quellen = {}                      # URL -> Läufe, die darauf verweisen
    for r in races:
        u = (r.get("url") or "").strip()
        if u.startswith("http"):
            quellen.setdefault(u, []).append(r)
    urls = list(quellen)[:limit]
    print(f"{len(urls)} Seiten werden geprüft …")

    with ThreadPoolExecutor(max_workers=6) as ex:
        ergebnisse = dict(zip(urls, ex.map(check, urls)))

    heute = datetime.now().date()
    tage = [heute + timedelta(days=d) for d in (-1, 0, 1)]     # Seiten mit Tagesdatum lösen keinen Alarm aus
    neu = {}
    zeilen = {"geändert": [], "neu": [], "Fehler": [], "unverändert": 0, "robots": []}
    for u in urls:
        e, a = ergebnisse[u], alt.get(u)
        jahre = {str(r["date"])[:4] for r in quellen[u] if r.get("date")}
        kalender = urlparse(u).netloc.removeprefix("www.") in KALENDER      # Kalenderseiten zeigen oft nur Prognosen
        e["nennt_jahr"] = (not kalender) and any(t.startswith("D ") and t.endswith(j) for t in (e.get("tokens") or []) for j in jahre)
        if e["status"] != "ok":
            zeilen["robots" if e["status"] == "robots" else "Fehler"].append((u, e["status"] + (" " + e.get("meldung", "")).rstrip()))
            neu[u] = {**(a or {}), **{k: e[k] for k in ("geprueft", "status")}}   # alten Stand behalten
            continue
        if a and a.get("status") == "ok":
            if e.get("art") == "pdf":
                gleich = a.get("hash") == e["hash"]
                plus, minus = [], []
            else:
                plus = [t for t in sorted(set(e["tokens"]) - set(a.get("tokens") or [])) if not ist_tagesdatum(t, tage)]
                minus = [t for t in sorted(set(a.get("tokens") or []) - set(e["tokens"])) if not ist_tagesdatum(t, tage)]
                gleich = not plus and not minus
            if gleich:
                zeilen["unverändert"] += 1
                e["seit"] = a.get("seit")
            else:
                e["seit"] = e["geprueft"][:10]
                zeilen["geändert"].append((u, plus, minus, e["nennt_jahr"]))
        else:
            e["seit"] = None
            zeilen["neu"].append(u)
        neu[u] = e

    STATUS.write_text(json.dumps({**alt, **neu}, ensure_ascii=False, indent=0) + "\n", encoding="utf-8")

    z = [f"# Änderungen auf Veranstalterseiten", "",
         f"Stand: {datetime.now().strftime('%d.%m.%Y %H:%M')} · {len(urls)} Seiten geprüft · "
         f"{len(zeilen['geändert'])} geändert · {zeilen['unverändert']} unverändert · {len(zeilen['neu'])} neu im Bestand · "
         f"{len(zeilen['Fehler'])} nicht abrufbar · {len(zeilen['robots'])} per robots.txt gesperrt", ""]
    if zeilen["geändert"]:
        z += ["## Geändert", ""]
        for u, plus, minus, jahr in zeilen["geändert"]:
            namen = ", ".join(r["id"] for r in quellen[u])
            z += [f"- **{namen}** – {u}" + ("  (nennt jetzt das Jahr des Laufs)" if jahr else ""),
                  f"  - neu: {', '.join(p[2:] for p in plus[:15]) or '–'}", f"  - weg: {', '.join(m[2:] for m in minus[:15]) or '–'}"]
        z.append("")
    if zeilen["Fehler"]:
        z += ["## Nicht abrufbar", ""] + [f"- {u} – {why}" for u, why in zeilen["Fehler"]] + [""]
    if zeilen["robots"]:
        z += ["## Per robots.txt gesperrt (nicht abgerufen)", ""] + [f"- {u}" for u, _ in zeilen["robots"]] + [""]
    bereit = [(r["id"], u) for u in urls for r in quellen[u] if not r.get("confirmed") and ergebnisse[u].get("nennt_jahr") and ergebnisse[u]["status"] == "ok"]
    if bereit:
        z += ["## Termin noch geschätzt, Seite nennt aber schon das Jahr", ""] + [f"- {i} – {u}" for i, u in bereit] + [""]
    REPORT.write_text("\n".join(z) + "\n", encoding="utf-8")
    print(z[2])


if __name__ == "__main__":
    main(sys.argv[1:])
