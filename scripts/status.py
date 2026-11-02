"""Anmeldestatus der kommenden Läufe prüfen: ausgebucht, Warteliste, wieder frei (ohne KI, nur Standardbibliothek).

Was das Programm tut:
1. Zu jedem kommenden Lauf wird die Anmeldeseite gesucht: RaceResult (my.raceresult.com) oder Datasport/Anmeldungs-Service
   (Feld `anmeldung_url`, sonst `url`/`source`, sonst Suche auf der Veranstalterseite; das Ergebnis merkt sich data/status-portale.json).
2. Die Seite wird gelesen (freie Plätze je Strecke, Warteliste, "AUSGEBUCHT"). Daraus wird `sold_out` in data/races.json GESETZT
   oder GELÖSCHT, ein Portal, das zu einem anderen Datum gehört, wird ignoriert:
     voll   -> sold_out = true
     teils  -> sold_out = "Text"  (einzelne Strecken voll)
     frei   -> sold_out wird gelöscht (das Portal zeigt wieder freie Plätze)
     unklar -> nichts ändern, nur melden (z. B. "0 Plätze" ohne Warteliste: Einladungsläufe mit Kennwort)
   Läufe mit "status_manuell": true werden übersprungen. Automatisch gesetzte Vermerke tragen "sold_out_auto": true.
3. Andere Anmeldeseiten (Spoferan, SAS): nur Hinweise im Bericht. Zeitgemäß (robots.txt verbietet): nur aufgelistet.
4. Prüfliste: Quelle nennt inzwischen Startgeld, Startzeit oder Meldeschluss, die bei uns fehlen (laut data/quellen-status.json).
Bericht: docs/STATUS.md, Stand je Lauf: data/status-portale.json. Es wird nie robots.txt umgangen.

Aufruf (aus dem Hauptordner):
    python scripts/status.py             prüfen und schreiben
    python scripts/status.py --trocken   nur prüfen und berichten, races.json nicht ändern
"""
import json
import re
import sys
import time
from datetime import date, datetime, timedelta
from pathlib import Path
from urllib.parse import urlparse

import portale as P

ROOT = Path(__file__).resolve().parent.parent
RACES = ROOT / "data" / "races.json"
STATE = ROOT / "data" / "status-portale.json"
QUELLEN = ROOT / "data" / "quellen-status.json"
REPORT = ROOT / "docs" / "STATUS.md"
HEUTE = date.today().isoformat()
PAUSE = 1.0
SUCHE_PRO_LAUF = 80        # so viele Veranstalterseiten pro Nacht nach einem Anmeldelink absuchen
SUCHE_ALLE_TAGE = 14       # und dieselbe Seite frühestens nach so vielen Tagen erneut

DS_HOSTS = ("datasport.de", "anmeldungs-service.de")
HINWEIS_HOSTS = ("spoferan.com", "sas-online.net")
VOLL = re.compile(r"ausgebucht|ausverkauft|Teilnehmerlimit[^.|]{0,25}erreicht|Limit[^.|]{0,15}erreicht|keine Anmeldung mehr möglich|sold out", re.I)
MONATE = {m: i + 1 for i, m in enumerate(["januar", "februar", "märz", "april", "mai", "juni", "juli", "august",
                                           "september", "oktober", "november", "dezember"])}
RE_DS = re.compile(r"https?://(?:www\.)?(?:datasport\.de/anmeldeservice/|anmeldungs-service\.de/)[A-Za-z0-9_/.-]+", re.I)


# ---------------------------------------------------------------- RaceResult
def rr_zustand(eid, tag):
    """frei | teils | voll | unklar | geschlossen | anderes Datum"""
    cfg = json.loads(P.get(f"https://my.raceresult.com/{eid}/registration/config?lang=de&test=&sanitize=true"))
    if P.rr_day(cfg.get("EventDate")) != tag:
        return {"zustand": "anderes Datum", "portal_datum": P.rr_day(cfg.get("EventDate"))}
    regs = cfg.get("Registrations") or []
    singles = [r for r in regs if r.get("Type") in ("single", None) and "wartelist" not in (r.get("Name") or "").lower()]
    warteliste = any("wartelist" in (r.get("Name") or "").lower() for r in regs)
    if not singles:
        return {"zustand": "unklar", "grund": "keine Einzel-Anmeldung gefunden"}
    if all(P.rr_day(r.get("EnabledTo")) and P.rr_day(r.get("EnabledTo")) < HEUTE for r in singles):
        return {"zustand": "geschlossen", "warteliste": warteliste}
    contests = {}
    for r in singles:
        for c in r.get("Contests") or []:
            contests[c.get("Name")] = c.get("SlotsLeft", -1)
    voll_namen = sorted(n for n, s in contests.items() if s == 0)
    reg_voll = all(r.get("SlotsLeft") == 0 for r in singles)
    if contests and len(voll_namen) == len(contests):
        z = "voll"
    elif voll_namen:
        z = "teils"
    elif reg_voll:
        z = "voll" if warteliste else "unklar"
    else:
        z = "frei"
    out = {"zustand": z, "warteliste": warteliste, "strecken_voll": voll_namen}
    if z == "unklar":
        out["grund"] = "Anmeldung zeigt 0 freie Plätze, aber es gibt keine Warteliste"
    return out


# ---------------------------------------------------------------- Datasport / Anmeldungs-Service
def ds_datum(text):
    m = re.search(r"\bam\s+(\d{1,2})\.\s*([A-Za-zäöüÄÖÜ]+)\s+(\d{4})", text[:1500])
    if m and m.group(2).lower() in MONATE:
        return f"{int(m.group(3)):04d}-{MONATE[m.group(2).lower()]:02d}-{int(m.group(1)):02d}"
    return None


def ds_zustand(url, tag):
    t = P.flat(P.get(url))
    d = ds_datum(t)
    if d and d != tag:
        return {"zustand": "anderes Datum", "portal_datum": d}
    if not d and not re.search(r"Anmeldung|Startgeb", t):
        return {"zustand": "unklar", "grund": "Seite nicht erkannt"}
    namen = [re.sub(r"^.* - ", "", n.strip()) for n in re.findall(r"AUSGEBUCHT[^|]*\|\s*([^|]+?)\s*\|", t)]
    gesamt = re.search(r"Gesamtlimit.*?noch frei\s*\|\s*(\d+)", t)
    if gesamt and int(gesamt.group(1)) == 0:
        return {"zustand": "voll", "strecken_voll": namen}
    if namen:
        return {"zustand": "teils", "strecken_voll": namen}
    if VOLL.search(t):
        return {"zustand": "unklar", "grund": "Seite nennt Limit/ausgebucht, aber nicht eindeutig je Strecke"}
    return {"zustand": "frei"}


# ---------------------------------------------------------------- Anmeldelink finden
def finde_portal(url, tag):
    """Anmeldelink auf der Veranstalterseite suchen -> {"typ": "rr", "id": ...} | {"typ": "ds", "url": ...} | None"""
    try:
        html = P.get(url)
    except Exception:
        return None
    m = P.RR_RE.search(html)
    if m:
        return {"typ": "rr", "id": m.group(1)}
    m = RE_DS.search(html)
    if m:
        return {"typ": "ds", "url": m.group(0).rstrip("/.") + "/"}
    return None


def neuer_wert(z):
    if z["zustand"] == "voll":
        return True
    namen = ", ".join(z.get("strecken_voll") or [])
    return "Ausgebucht laut Anmeldeportal: " + namen + ". Die übrigen Strecken zeigen noch freie Plätze oder keine Begrenzung (nachts automatisch geprüft)."


def main(argv):
    sys.stdout.reconfigure(encoding="utf-8")
    trocken = "--trocken" in argv
    data = json.loads(RACES.read_text(encoding="utf-8"))
    alt = json.loads(STATE.read_text(encoding="utf-8")) if STATE.exists() else {}
    quellen = json.loads(QUELLEN.read_text(encoding="utf-8")) if QUELLEN.exists() else {}
    neu = {}
    ereignisse, unklar, hinweise, zeitgemaess, fehler = [], [], [], [], []
    geschrieben = gelesen = gesucht = 0

    kommend = sorted((r for r in data["races"] if str(r.get("date") or "") >= HEUTE), key=lambda x: x["date"])
    for r in kommend:
        rid, tag = r["id"], r["date"]
        vor = alt.get(rid) or {}
        urls = [u for u in (r.get("anmeldung_url"), r.get("url"), r.get("source")) if u and str(u).startswith("http")]
        st = {k: vor[k] for k in ("portal", "portal_gesucht") if k in vor}
        st["geprueft"] = HEUTE

        # 1. Anmeldeseite bestimmen
        portal = None
        pt = P.portal_of(r)
        if pt and pt[0] == "RaceResult":
            portal = {"typ": "rr", "id": pt[1]}
        if not portal:
            for u in urls:
                host = urlparse(u).netloc.removeprefix("www.")
                if any(host.endswith(h) for h in DS_HOSTS):
                    portal = {"typ": "ds", "url": u}
                    break
        entdeckt = False         # Link stammt aus der Suche auf der Veranstalterseite (kann noch der des Vorjahres sein)
        if not portal and vor.get("portal"):
            portal = vor["portal"]
            entdeckt = True
        if not portal and r.get("url") and gesucht < SUCHE_PRO_LAUF:
            zuletzt = vor.get("portal_gesucht")
            if not zuletzt or zuletzt < (date.today() - timedelta(days=SUCHE_ALLE_TAGE)).isoformat():
                gesucht += 1
                portal = finde_portal(r["url"], tag)
                st["portal_gesucht"] = HEUTE
                time.sleep(PAUSE)
                if portal:
                    st["portal"] = portal
                    entdeckt = True
        z = None
        if portal:
            try:
                z = rr_zustand(portal["id"], tag) if portal["typ"] == "rr" else ds_zustand(portal["url"], tag)
                gelesen += 1
                time.sleep(PAUSE)
            except Exception as e:
                fehler.append((rid, ("RaceResult" if portal["typ"] == "rr" else "Datasport") + " " + str(e)[:80]))
                neu[rid] = {**vor, "geprueft": HEUTE}
                continue

        if z:
            st["zustand"] = z["zustand"]
            if z.get("warteliste"):
                st["warteliste"] = True
            vorher = vor.get("zustand")
            if vorher and vorher != z["zustand"]:
                text = {"frei": "wieder Plätze frei", "voll": "jetzt ausgebucht", "teils": "jetzt teilweise ausgebucht",
                        "geschlossen": "Anmeldung jetzt geschlossen", "unklar": "Status unklar"}.get(z["zustand"], z["zustand"])
                ereignisse.append(f"**{r['name']}** ({tag}): {text} (vorher: {vorher})")
            if r.get("status_manuell"):
                pass
            elif z["zustand"] == "unklar":
                unklar.append(f"**{r['name']}** ({tag}): {z.get('grund')} – bitte von Hand prüfen")
            elif z["zustand"] == "anderes Datum" and entdeckt:
                pass             # alter Link auf der Veranstalterseite: warten, bis der neue Termin freigeschaltet ist
            elif z["zustand"] == "anderes Datum":
                unklar.append(f"**{r['name']}** ({tag}): Anmeldeseite gehört zu einem anderen Datum ({z.get('portal_datum')})")
            elif z["zustand"] in ("voll", "teils", "frei"):
                ist = r.get("sold_out")
                if z["zustand"] == "frei":
                    if ist:
                        if not trocken:
                            r.pop("sold_out", None)
                            r.pop("sold_out_auto", None)
                            r["checked"] = HEUTE
                        geschrieben += 1
                        ereignisse.append(f"**{r['name']}** ({tag}): ausgebucht-Vermerk entfernt, die Anmeldeseite zeigt freie Plätze")
                else:
                    soll = neuer_wert(z)
                    if ist != soll:
                        if not trocken:
                            r["sold_out"] = soll
                            r["sold_out_auto"] = True
                            r["checked"] = HEUTE
                        geschrieben += 1
                        ereignisse.append(f"**{r['name']}** ({tag}): als {'komplett' if soll is True else 'teilweise'} ausgebucht eingetragen")
                    elif not r.get("sold_out_auto") and not trocken:
                        r["sold_out_auto"] = True
        else:
            for u in urls:
                host = urlparse(u).netloc.removeprefix("www.")
                if "zeitgemaess.info" in host:
                    zeitgemaess.append(f"{r['name']} ({tag}) – {u}")
                    break
                if any(host.endswith(h) for h in HINWEIS_HOSTS):
                    try:
                        text = P.flat(P.get(u))
                        time.sleep(PAUSE)
                    except Exception as e:
                        fehler.append((rid, u[:60] + " " + str(e)[:60]))
                        continue
                    gelesen += 1
                    flag = bool(VOLL.search(text))
                    st["hinweis_voll"] = flag
                    v = vor.get("hinweis_voll")
                    if v is not None and v != flag:
                        ereignisse.append(f"**{r['name']}** ({tag}): Seite {'meldet jetzt ausgebucht' if flag else 'meldet nicht mehr ausgebucht'} – {u}")
                    if flag and not r.get("sold_out"):
                        hinweise.append(f"**{r['name']}** ({tag}): Seite nennt \"ausgebucht/Limit erreicht\", bei uns steht nichts – {u}")
                    break
        neu[rid] = st

    # Läufe mit Hand-Vermerk "ausgebucht" (keine lesbare Anmeldeseite): nennt noch irgendeine Quellseite "ausgebucht"/"Limit erreicht"?
    for r in kommend:
        if not r.get("sold_out") or r.get("sold_out_auto") or r.get("status_manuell"):
            continue
        alle = [u for u in dict.fromkeys([r.get("anmeldung_url"), r.get("url"), r.get("source")]) if u and str(u).startswith("http")]
        if any("zeitgemaess.info" in u for u in alle):
            continue             # steht in der Zeitgemäß-Liste, nur von Hand prüfbar
        quellen_urls = alle
        if not quellen_urls:
            continue
        nennt, gelesen_ok = False, 0
        for u in quellen_urls:
            try:
                if VOLL.search(P.flat(P.get(u))):
                    nennt = True
                gelesen_ok += 1
                time.sleep(PAUSE)
            except Exception:
                continue
            if nennt:
                break
        if gelesen_ok and not nennt:
            unklar.append(f"**{r['name']}** ({r['date']}): bei uns steht \"ausgebucht\", aber keine Quellseite nennt es mehr – "
                          f"bitte prüfen, ob wieder Plätze frei sind ({quellen_urls[0]})")

    # Prüfliste: Quelle nennt jetzt Angaben, die bei uns fehlen
    grenze = (date.today() + timedelta(days=183)).isoformat()
    liste = []
    for r in kommend:
        if r["date"] > grenze:
            continue
        na = set(r.get("na") or [])
        q = quellen.get(r.get("url") or "") or {}
        if q.get("status") != "ok":
            continue
        toks = q.get("tokens") or []
        fehlt = []
        if not r.get("fee") and "fee" not in na and any(t.startswith("E ") for t in toks):
            fehlt.append("Startgeld (Seite nennt Beträge)")
        if not r.get("start_time") and "start_time" not in na and any(t.startswith("U ") for t in toks):
            fehlt.append("Startzeit (Seite nennt Uhrzeiten)")
        if not r.get("reg_close") and "reg_close" not in na and any(t in ("S meldeschluss", "S anmeldeschluss") for t in toks):
            fehlt.append("Meldeschluss (Seite nennt das Wort)")
        if fehlt:
            liste.append(f"**{r['name']}** ({r['date']}): " + ", ".join(fehlt) + f" – {r.get('url')}")

    if not trocken:
        RACES.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        STATE.write_text(json.dumps({**alt, **neu}, ensure_ascii=False, indent=0) + "\n", encoding="utf-8")

    ausg = [r for r in kommend if r.get("sold_out")]
    z = ["# Anmeldestatus der kommenden Läufe", "",
         f"Stand: {datetime.now().strftime('%d.%m.%Y %H:%M')} · {len(kommend)} kommende Läufe · {gelesen} Anmeldeseiten gelesen · "
         f"{gesucht} Veranstalterseiten nach einem Anmeldelink durchsucht · {geschrieben} Eintrag/Einträge in races.json geändert"
         + (" (Trockenlauf, nichts geschrieben)" if trocken else ""), ""]
    z += ["## Heute geändert", ""] + ([f"- {e}" for e in ereignisse] or ["- Keine Änderung."]) + [""]
    if unklar:
        z += ["## Bitte von Hand prüfen", ""] + [f"- {u}" for u in unklar] + [""]
    if hinweise:
        z += ["## Hinweise von Anmeldeseiten (nichts automatisch geändert)", ""] + [f"- {h}" for h in hinweise] + [""]
    if liste:
        z += ["## Quelle nennt jetzt Angaben, die bei uns fehlen (nächste 6 Monate)", ""] + [f"- {x}" for x in liste] + [""]
    if zeitgemaess:
        z += ["## Zeitgemäß-Anmeldungen (robots.txt verbietet automatisches Lesen, nur von Hand prüfbar)", ""] + [f"- {x}" for x in zeitgemaess] + [""]
    if fehler:
        z += ["## Nicht lesbar", ""] + [f"- {i}: {w}" for i, w in fehler] + [""]
    z += ["## Aktuell als ausgebucht vermerkt", ""] + [
        f"- {r['date']} · {r['name']}" + (" (automatisch)" if r.get("sold_out_auto") else "") for r in sorted(ausg, key=lambda x: x["date"])] + [""]
    REPORT.write_text("\n".join(z) + "\n", encoding="utf-8")
    print(z[2])
    for e in ereignisse:
        print(" -", e)


if __name__ == "__main__":
    main(sys.argv[1:])
