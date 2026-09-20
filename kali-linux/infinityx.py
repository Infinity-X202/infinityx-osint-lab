#!/usr/bin/env python3
"""INFINITY X — Kali / WSL OSINT Lab. Full CNIC + mobile. Numbered menus. Back with 0."""
from __future__ import annotations

import csv
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

R = "\033[1;31m"
B = "\033[1;34m"
C = "\033[1;36m"
G = "\033[1;32m"
Y = "\033[1;33m"
W = "\033[1;37m"
D = "\033[2;37m"
M = "\033[1;35m"
X = "\033[0m"
DIMR = "\033[0;31m"

HERE = Path(__file__).resolve().parent
HOME_CFG = Path.home() / ".infinityx"
PAGE = 12
DEFAULT_API = os.environ.get("INFINITYX_API", "https://infinityosint.netlify.app/api/search")
DATA_CANDIDATES = [
    HERE / "data" / "pakistan-database.json",
    HERE.parent / "public" / "pakistan-database.json",
    Path("/usr/share/infinityx/data/pakistan-database.json"),
    Path.home() / ".local/share/infinityx/data/pakistan-database.json",
    HOME_CFG / "pakistan-database.json",
]


def clear() -> None:
    os.system("clear" if os.name != "nt" else "cls")


def digits(s: str) -> str:
    return re.sub(r"\D", "", s or "")


def now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%SZ")


def is_back(s: str) -> bool:
    return s.strip().lower() in {"0", "b", "back", "q"}


def ask(prompt: str) -> str | None:
    try:
        raw = input(f"  {G}{prompt}{X} ").strip()
    except (EOFError, KeyboardInterrupt):
        print()
        return None
    if is_back(raw):
        return None
    return raw


def load_settings() -> dict:
    HOME_CFG.mkdir(parents=True, exist_ok=True)
    p = HOME_CFG / "settings.json"
    default = {"api_enabled": True, "api_url": DEFAULT_API, "api_key": "", "investigator": "Analyst IX-01"}
    if p.exists():
        try:
            default.update(json.loads(p.read_text(encoding="utf-8")))
        except json.JSONDecodeError:
            pass
    return default


def save_settings(s: dict) -> None:
    HOME_CFG.mkdir(parents=True, exist_ok=True)
    (HOME_CFG / "settings.json").write_text(json.dumps(s, indent=2), encoding="utf-8")


def load_cases() -> list:
    p = HOME_CFG / "investigations.json"
    if not p.exists():
        return []
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return []


def save_cases(cases: list) -> None:
    HOME_CFG.mkdir(parents=True, exist_ok=True)
    (HOME_CFG / "investigations.json").write_text(json.dumps(cases, indent=2), encoding="utf-8")


def find_data_file() -> Path | None:
    for p in DATA_CANDIDATES:
        if p.exists():
            return p
    return None


def load_records() -> list[dict]:
    path = find_data_file()
    if not path:
        print(f"{R}[!] pakistan-database.json missing{X}")
        return []
    payload = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(payload, list):
        return payload
    return payload.get("records") or payload.get("results") or payload.get("data") or []


def field(rec: dict, *keys: str) -> str:
    for k in keys:
        v = rec.get(k)
        if v is None:
            continue
        s = str(v).strip()
        if s:
            return s
    return ""


def is_nadra(rec: dict) -> bool:
    return "nadra" in field(rec, "dataset", "source_name", "source").lower() or field(rec, "id").startswith("NR-")


def score_record(rec: dict, query: str) -> tuple[int, list[str]]:
    q = query.strip()
    if not q:
        return 0, []
    tokens = [t for t in re.split(r"\s+", q.lower()) if t]
    qd = digits(q)
    if len(qd) >= 4:
        tokens.append(qd)
    tokens = list(dict.fromkeys(tokens))
    matched: list[str] = []
    total = 0
    fields = {
        "name": field(rec, "name"),
        "cnic": field(rec, "cnic"),
        "mobile": field(rec, "mobile", "phone"),
        "invoice": field(rec, "invoiceNumber", "invoice"),
        "business": field(rec, "businessName", "organization"),
        "city": field(rec, "city"),
        "province": field(rec, "province"),
        "address": field(rec, "currentAddress", "address"),
        "father": field(rec, "fatherName"),
        "prize": field(rec, "prize"),
        "id": field(rec, "id"),
    }
    for tok in tokens:
        td = digits(tok)
        best, best_f = 0, ""
        for fk, fv in fields.items():
            if not fv:
                continue
            fl, fd = fv.lower(), digits(fv)
            s = 0
            if fl == tok:
                s = 100
            elif fl.startswith(tok):
                s = 92
            elif tok in fl:
                s = 78
            if td and fd:
                if fd == td:
                    s = max(s, 100)
                elif fd.endswith(td) or td in fd:
                    s = max(s, 94)
            if s > best:
                best, best_f = s, fk
        if best:
            total += best
            if best_f not in matched:
                matched.append(best_f)
    if not total:
        return 0, []
    avg = min(99, round(total / max(len(tokens), 1)))
    name, qn = field(rec, "name").lower(), q.lower()
    if name == qn:
        avg = 99
        if "name" not in matched:
            matched.insert(0, "name")
    elif name.startswith(qn) or qn in name.split():
        avg = min(99, avg + 8)
    return avg, matched


def search_local(records: list[dict], query: str, source: str = "all") -> list[tuple[int, list[str], dict]]:
    hits = []
    for rec in records:
        if source == "pdf" and is_nadra(rec):
            continue
        if source == "nadra" and not is_nadra(rec):
            continue
        sc, mf = score_record(rec, query)
        if sc:
            hits.append((sc, mf, rec))
    hits.sort(key=lambda h: (-h[0], field(h[2], "name")))
    return hits


def search_api(query: str, settings: dict) -> tuple[list[dict], str]:
    if not settings.get("api_enabled"):
        return [], "API off"
    url = (settings.get("api_url") or DEFAULT_API).rstrip("/")
    full = f"{url}&q={urllib.parse.quote(query)}" if "?" in url else f"{url}?q={urllib.parse.quote(query)}"
    req = urllib.request.Request(full, headers={"Accept": "application/json", "User-Agent": "InfinityX-Kali/1.0"})
    key = (settings.get("api_key") or "").strip()
    if key:
        req.add_header("Authorization", f"Bearer {key}")
    try:
        with urllib.request.urlopen(req, timeout=12) as res:
            payload = json.loads(res.read().decode("utf-8", errors="replace"))
    except Exception as e:
        return [], f"API offline ({e})"
    rows = payload if isinstance(payload, list) else payload.get("results") or payload.get("records") or []
    return rows, f"API {len(rows)}"


def banner() -> None:
    print(f"""{R}
  ███████╗{W}  ███╗   ██╗{R}  ███████╗{W}  ██╗{C} ███╗   ██╗{R} ██╗{G} ████████╗{C} ██╗   ██╗ {B} ██╗  ██╗
  {R}╚══███╔╝{W}  ████╗  ██║{R}  ██╔════╝{W}  ██║{C} ████╗  ██║{R} ██║{G} ╚══██╔══╝{C} ╚██╗ ██╔╝ {B} ╚██╗██╔╝
  {R}  ███╔╝ {W}  ██╔██╗ ██║{R}  █████╗  {W}  ██║{C} ██╔██╗ ██║{R} ██║{G}    ██║   {C}  ╚████╔╝  {B}  ╚███╔╝
  {R} ███╔╝  {W}  ██║╚██╗██║{R}  ██╔══╝  {W}  ██║{C} ██║╚██╗██║{R} ██║{G}    ██║   {C}   ╚██╔╝   {B}  ██╔██╗
  {R}███████╗{W}  ██║ ╚████║{R}  ██║     {W}  ██║{C} ██║ ╚████║{R} ██║{G}    ██║   {C}    ██║    {B} ██╔╝ ██╗
  {R}╚══════╝{W}  ╚═╝  ╚═══╝{R}  ╚═╝     {W}  ╚═╝{C} ╚═╝  ╚═══╝{R} ╚═╝{G}    ╚═╝   {C}    ╚═╝    {B} ╚═╝  ╚═╝{X}
  {R}████ DATABASE HACKED BY INFINITY X ████{X}  {G}LIVE INDEX{X}  {C}FULL CNIC · FULL MOBILE{X}
""")


def bar(records: list[dict], settings: dict | None = None) -> None:
    pdf = sum(1 for r in records if not is_nadra(r))
    nad = sum(1 for r in records if is_nadra(r))
    api = "ON" if (settings or {}).get("api_enabled", True) else "OFF"
    print(f"  {DIMR}{'━' * 72}{X}")
    print(
        f"  {G}●{X} {W}{len(records)}{X} records   {C}●{X} PDF {G}{pdf}{X}   {B}●{X} NADRA {C}{nad}{X}   {R}●{X} API {api}   {Y}●{X} {now_iso()}"
    )
    print(f"  {DIMR}{'━' * 72}{X}")


def keys(*extra: str) -> None:
    bits = [f"{R}[0]{X} {D}back{X}", f"{Y}[#]{X} {D}open{X}", *extra]
    print("  " + "   ".join(bits))


def print_row(i: int, rec: dict, score: int | None = None) -> None:
    name = (field(rec, "name") or "?")[:26]
    cnic = field(rec, "cnic") or "—"
    mob = field(rec, "mobile", "phone") or "—"
    extra = field(rec, "city") or field(rec, "businessName", "organization") or field(rec, "prize") or ""
    extra = extra[:16]
    sc = f"{G}{score:>3}%{X}  " if score is not None else ""
    tag = f"{C}NADRA{X}" if is_nadra(rec) else f"{R}PDF{X}"
    print(f"  {Y}[{i:>2}]{X} {sc}{W}{name:<26}{X} {C}{cnic:<13}{X} {B}{mob:<16}{X} {tag} {D}{extra}{X}")


def print_dossier(rec: dict, score: int | None = None, matched: list[str] | None = None) -> None:
    src = "NADRA" if is_nadra(rec) else field(rec, "dataset", "source_name") or "INDEX"
    print()
    print(f"  {R}╔{'═' * 70}╗{X}")
    print(f"  {R}║{X} {C}OSINT DOSSIER{X}  {G}IN DATABASE{X}  {Y}{src.upper():<42}{X}{R}║{X}")
    print(f"  {R}╠{'═' * 70}╣{X}")
    print(f"  {R}║{X} {W}{(field(rec, 'name') or 'UNKNOWN')[:68]:<68}{X} {R}║{X}")
    ident = f"{field(rec, 'id')}" + (f"  ·  MATCH {score}%" if score is not None else "")
    print(f"  {R}║{X} {D}{ident[:68]:<68}{X} {R}║{X}")
    print(f"  {R}╠{'═' * 70}╣{X}")
    rows = [
        ("FULL NAME", field(rec, "name")),
        ("CNIC", field(rec, "cnic")),
        ("MOBILE", field(rec, "mobile", "phone")),
        ("INVOICE", field(rec, "invoiceNumber", "invoice")),
        ("BUSINESS / ORG", field(rec, "businessName", "organization", "business")),
        ("PRIZE", " · ".join(x for x in [field(rec, "prize"), field(rec, "prizeAmount")] if x)),
        ("FATHER NAME", field(rec, "fatherName", "father")),
        ("GENDER", field(rec, "gender")),
        ("DATE OF BIRTH", field(rec, "birthDate")),
        ("CITY", field(rec, "city")),
        ("PROVINCE", field(rec, "province")),
        ("COUNTRY", field(rec, "country") or "Pakistan"),
        ("CURRENT ADDRESS", field(rec, "currentAddress", "address")),
        ("PERMANENT ADDRESS", field(rec, "permanentAddress")),
        ("SOURCE", src),
    ]
    for label, val in rows:
        if not val:
            continue
        print(f"  {R}║{X} {B}{label:<18}{X} {G}{val[:50]:<50}{X} {R}║{X}")
    if matched:
        print(f"  {R}║{X} {C}{'MATCHED':<18}{X} {Y}{', '.join(matched)[:50]:<50}{X} {R}║{X}")
    print(f"  {R}╚{'═' * 70}╝{X}")
    print()
    print(f"  {R}[1]{X} pin to investigation    {R}[0]{X} {D}back{X}")


def dossier_loop(rec: dict, score: int | None = None, matched: list[str] | None = None) -> None:
    while True:
        clear()
        banner()
        print_dossier(rec, score, matched)
        ch = ask("select>")
        if ch is None or ch == "":
            return
        if ch == "1":
            pin_record(rec)
            ask("ENTER back>")
            return


def pin_record(rec: dict) -> None:
    cases = load_cases()
    if not cases:
        cases.append({"id": "INV-0001", "name": "Case 1", "created": now_iso(), "records": []})
    rid = field(rec, "id")
    cases[0]["records"] = [r for r in cases[0]["records"] if field(r, "id") != rid]
    cases[0]["records"].append(rec)
    save_cases(cases)
    print(f"  {G}[+] pinned {rid} → {cases[0]['id']}{X}")


def scan_anim(query: str) -> None:
    for i, ch in enumerate("█" * 18):
        sys.stdout.write(f"\r  {R}SCAN{X} {C}{query[:36]}{X}  {G}{ch * (i + 1)}{X}{D}{'░' * (18 - i)}{X}  ")
        sys.stdout.flush()
        time.sleep(0.03)
    sys.stdout.write("\r" + " " * 78 + "\r")


def browse_hits(title: str, hits: list[tuple[int | None, list[str], dict]], records: list[dict], settings: dict) -> None:
    if not hits:
        print(f"  {R}NOT FOUND IN DATABASE{X}")
        ask("0 back>")
        return
    page = 0
    pages = max(1, (len(hits) + PAGE - 1) // PAGE)
    while True:
        clear()
        banner()
        bar(records, settings)
        print(f"  {C}{title}{X}  {G}{len(hits)}{X} found   page {Y}{page + 1}/{pages}{X}")
        print(f"  {D}     NAME                       CNIC          MOBILE           SRC{X}")
        print(f"  {DIMR}{'─' * 72}{X}")
        chunk = hits[page * PAGE : page * PAGE + PAGE]
        for i, (sc, _mf, rec) in enumerate(chunk, 1):
            print_row(i, rec, sc if isinstance(sc, int) else None)
        print(f"  {DIMR}{'─' * 72}{X}")
        extras = []
        if page > 0:
            extras.append(f"{B}[p]{X} {D}prev{X}")
        if page + 1 < pages:
            extras.append(f"{B}[n]{X} {D}next{X}")
        keys(*extras)
        ch = ask("select 1-12>")
        if ch is None:
            return
        low = ch.lower()
        if low in {"n", "next"} and page + 1 < pages:
            page += 1
            continue
        if low in {"p", "prev"} and page > 0:
            page -= 1
            continue
        if ch.isdigit():
            n = int(ch)
            if 1 <= n <= len(chunk):
                sc, mf, rec = chunk[n - 1]
                dossier_loop(rec, sc if isinstance(sc, int) else None, mf)
            continue


def browse_records(title: str, recs: list[dict], all_records: list[dict], settings: dict) -> None:
    hits = [(None, [], r) for r in recs]
    browse_hits(title, hits, all_records, settings)


def do_search(records: list[dict], settings: dict) -> None:
    while True:
        clear()
        banner()
        bar(records, settings)
        print(f"  {C}SEARCH{X}  {D}name · CNIC · mobile · invoice · city · business · father{X}")
        print()
        print(f"  {R}[1]{X} All sources     {R}[2]{X} my files.pdf     {R}[3]{X} NADRA     {R}[4]{X} API")
        print(f"  {R}[0]{X} {D}back to menu{X}")
        src_map = {"1": "all", "2": "pdf", "3": "nadra", "4": "api"}
        ch = ask("select>")
        if ch is None:
            return
        source = src_map.get(ch, "all") if ch in src_map else "all"
        q = ask("query>")
        if q is None:
            continue
        if not q:
            continue
        scan_anim(q)
        local = [] if source == "api" else search_local(records, q, source if source != "api" else "all")
        extra, api_msg = [], "local"
        if settings.get("api_enabled") and source in {"all", "api"}:
            rows, api_msg = search_api(q, settings)
            seen = {field(h[2], "id") + field(h[2], "cnic") for h in local}
            for rec in rows:
                key = field(rec, "id") + field(rec, "cnic")
                if key in seen:
                    continue
                seen.add(key)
                sc, mf = score_record(rec, q)
                extra.append((sc or 70, mf or ["api"], rec))
        hits = local + extra
        hits.sort(key=lambda h: -(h[0] or 0))
        browse_hits(f"SEARCH · {q} · {api_msg}", hits, records, settings)


def show_dashboard(records: list[dict], settings: dict) -> None:
    pdf = [r for r in records if not is_nadra(r)]
    nad = [r for r in records if is_nadra(r)]
    cnics = sum(1 for r in records if field(r, "cnic"))
    phones = sum(1 for r in records if field(r, "mobile", "phone"))
    clear()
    banner()
    bar(records, settings)
    print(f"  {C}DASHBOARD{X}")
    print(f"  {DIMR}{'─' * 40}{X}")
    print(f"  {W}Indexed records{X}     {G}{len(records)}{X}")
    print(f"  {W}my files.pdf{X}        {G}{len(pdf)}{X}")
    print(f"  {W}NADRA{X}               {C}{len(nad)}{X}")
    print(f"  {W}CNIC (full){X}         {C}{cnics}{X}")
    print(f"  {W}Mobile (full){X}       {B}{phones}{X}")
    print(f"  {W}Investigations{X}      {R}{len(load_cases())}{X}")
    print(f"  {DIMR}{'─' * 40}{X}")
    print()
    print(f"  {R}[1]{X} open PDF index     {R}[2]{X} open NADRA index     {R}[0]{X} {D}back{X}")
    ch = ask("select>")
    if ch == "1":
        browse_records("MY FILES.PDF · FULL INDEX", pdf, records, settings)
    elif ch == "2":
        browse_records("NADRA · FULL INDEX", nad, records, settings)


def show_investigations(records: list[dict], settings: dict) -> None:
    cases = load_cases()
    if not cases or not cases[0].get("records"):
        clear()
        banner()
        print(f"  {Y}No pins yet. Search a record, open it, press 1 to pin.{X}")
        ask("0 back>")
        return
    recs = cases[0]["records"]
    browse_records(f"{cases[0]['id']} · {cases[0].get('name')}", recs, records, settings)


def show_graph(records: list[dict], settings: dict) -> None:
    clear()
    banner()
    bar(records, settings)
    print(f"  {C}INTELLIGENCE GRAPH{X}")
    q = ask("seed name/CNIC/city/org>")
    if q is None or not q:
        return
    hits = search_local(records, q, "all")
    if not hits:
        print(f"  {R}no seed found{X}")
        ask("0 back>")
        return
    rec = hits[0][2]
    org = field(rec, "businessName", "organization")
    city = field(rec, "city")
    related = []
    for other in records:
        if field(other, "id") == field(rec, "id"):
            continue
        link = None
        if org and field(other, "businessName", "organization") == org:
            link = "ORG"
        elif city and field(other, "city") == city:
            link = "CITY"
        elif field(rec, "cnic")[:5] and field(other, "cnic")[:5] == field(rec, "cnic")[:5]:
            link = "CNIC"
        if link:
            other = dict(other)
            other["_link"] = link
            related.append((90, [link], other))
    browse_hits(f"GRAPH from {field(rec, 'name')}", [(99, ["seed"], rec)] + related, records, settings)


def show_osint(records: list[dict], settings: dict) -> None:
    while True:
        clear()
        banner()
        bar(records, settings)
        print(f"  {C}OSINT MODULE{X}")
        print(f"  {DIMR}{'─' * 50}{X}")
        print(f"  Same engine as {B}infinityosint.netlify.app{X}")
        print(f"  {G}[1]{X} Search name")
        print(f"  {G}[2]{X} Search CNIC")
        print(f"  {G}[3]{X} Search mobile")
        print(f"  {G}[4]{X} Search invoice / business / city")
        print(f"  {R}[0]{X} {D}back{X}")
        ch = ask("select>")
        if ch is None:
            return
        labels = {"1": "name", "2": "CNIC", "3": "mobile", "4": "query"}
        if ch not in labels:
            continue
        q = ask(f"{labels[ch]}>")
        if q is None or not q:
            continue
        scan_anim(q)
        hits = search_local(records, q)
        browse_hits(f"OSINT · {q}", hits, records, settings)


def show_nadra(records: list[dict], settings: dict) -> None:
    nad = [r for r in records if is_nadra(r)]
    browse_records(f"NADRA · {len(nad)} CITIZENS · FULL CNIC", nad, records, settings)


def show_pdf(records: list[dict], settings: dict) -> None:
    pdf = [r for r in records if not is_nadra(r)]
    browse_records(f"MY FILES.PDF · {len(pdf)} RECORDS · FULL CNIC/MOBILE", pdf, records, settings)


def show_sources(records: list[dict], settings: dict) -> None:
    counts: dict[str, int] = {}
    for r in records:
        src = field(r, "dataset", "source_name") or "unknown"
        counts[src] = counts.get(src, 0) + 1
    while True:
        clear()
        banner()
        bar(records, settings)
        print(f"  {C}SOURCES{X}")
        items = list(counts.items())
        for i, (k, v) in enumerate(items, 1):
            print(f"  {Y}[{i}]{X} {W}{k:<32}{X} {G}{v}{X} records")
        print(f"  {R}[0]{X} {D}back{X}")
        ch = ask("select>")
        if ch is None:
            return
        if ch.isdigit() and 1 <= int(ch) <= len(items):
            name = items[int(ch) - 1][0]
            recs = [r for r in records if (field(r, "dataset", "source_name") or "unknown") == name]
            browse_records(name, recs, records, settings)


def show_datasets(records: list[dict], settings: dict) -> None:
    show_sources(records, settings)


def show_analytics(records: list[dict], settings: dict) -> None:
    prizes: dict[str, int] = {}
    cities: dict[str, int] = {}
    for r in records:
        prizes[field(r, "prize") or "—"] = prizes.get(field(r, "prize") or "—", 0) + 1
        cities[field(r, "city") or "—"] = cities.get(field(r, "city") or "—", 0) + 1
    while True:
        clear()
        banner()
        bar(records, settings)
        print(f"  {C}ANALYTICS{X}")
        print(f"  {Y}[1]{X} Prize breakdown")
        print(f"  {Y}[2]{X} City breakdown")
        print(f"  {R}[0]{X} {D}back{X}")
        ch = ask("select>")
        if ch is None:
            return
        if ch == "1":
            clear()
            banner()
            print(f"  {C}PRIZE{X}")
            for k, v in sorted(prizes.items(), key=lambda x: -x[1]):
                print(f"  {Y}{k:<22}{X} {G}{'█' * min(v, 40)}{X} {v}")
            ask("0 back>")
        elif ch == "2":
            clear()
            banner()
            print(f"  {C}CITY{X}")
            for k, v in sorted(cities.items(), key=lambda x: -x[1])[:30]:
                print(f"  {B}{k:<22}{X} {G}{'█' * min(v, 40)}{X} {v}")
            ask("0 back>")


def do_report(records: list[dict], settings: dict) -> None:
    clear()
    banner()
    q = ask("report query>")
    if q is None or not q:
        return
    hits = search_local(records, q)
    out = HOME_CFG / f"report-{int(time.time())}.txt"
    HOME_CFG.mkdir(parents=True, exist_ok=True)
    lines = [
        "DATABASE HACKED BY INFINITY X — OSINT REPORT",
        f"Generated: {now_iso()}",
        f"Investigator: {settings.get('investigator')}",
        f"Query: {q}",
        f"Hits: {len(hits)}",
        "=" * 60,
    ]
    for sc, mf, rec in hits:
        lines += [
            "",
            f"{field(rec, 'name')}  [{sc}%]",
            f"  CNIC   {field(rec, 'cnic')}",
            f"  MOBILE {field(rec, 'mobile', 'phone')}",
            f"  INV    {field(rec, 'invoiceNumber')}",
            f"  ORG    {field(rec, 'businessName', 'organization')}",
            f"  CITY   {field(rec, 'city')} {field(rec, 'province')}",
            f"  MATCH  {','.join(mf)}",
        ]
    out.write_text("\n".join(lines), encoding="utf-8")
    print(f"  {G}[+] {out}{X}")
    ask("0 back>")


def do_settings(settings: dict) -> dict:
    while True:
        clear()
        banner()
        print(f"  {C}SETTINGS{X}")
        print(f"  {Y}[1]{X} API enabled     {G}{settings.get('api_enabled')}{X}")
        print(f"  {Y}[2]{X} API URL         {D}{settings.get('api_url')}{X}")
        print(f"  {Y}[3]{X} Investigator    {W}{settings.get('investigator')}{X}")
        print(f"  {R}[0]{X} {D}back{X}")
        ch = ask("select>")
        if ch is None:
            save_settings(settings)
            return settings
        if ch == "1":
            settings["api_enabled"] = not settings.get("api_enabled")
        elif ch == "2":
            url = ask("url>")
            if url:
                settings["api_url"] = url
        elif ch == "3":
            name = ask("name>")
            if name:
                settings["investigator"] = name[:40]


def import_csv(records: list[dict]) -> list[dict]:
    clear()
    banner()
    path = ask("CSV path>")
    if path is None or not path:
        return records
    p = Path(path.strip('"')).expanduser()
    if not p.exists():
        print(f"  {R}file not found{X}")
        ask("0 back>")
        return records
    with p.open(encoding="utf-8", errors="replace", newline="") as f:
        rows = list(csv.DictReader(f))
    extra = []
    for i, row in enumerate(rows, 1):
        extra.append(
            {
                "id": row.get("id") or f"IMP-{i:04d}",
                "name": row.get("name") or row.get("full_name") or "",
                "cnic": row.get("cnic") or "",
                "mobile": row.get("mobile") or row.get("phone") or "",
                "phone": row.get("phone") or row.get("mobile") or "",
                "invoiceNumber": row.get("invoiceNumber") or row.get("invoice") or "",
                "businessName": row.get("businessName") or row.get("organization") or "",
                "organization": row.get("organization") or row.get("businessName") or "",
                "prize": row.get("prize") or "",
                "prizeAmount": row.get("prizeAmount") or "",
                "city": row.get("city") or "",
                "province": row.get("province") or "",
                "currentAddress": row.get("currentAddress") or row.get("address") or "",
                "permanentAddress": row.get("permanentAddress") or "",
                "fatherName": row.get("fatherName") or "",
                "gender": row.get("gender") or "",
                "birthDate": row.get("birthDate") or "",
                "country": row.get("country") or "Pakistan",
                "dataset": p.name,
                "source_name": p.name,
            }
        )
    HOME_CFG.mkdir(parents=True, exist_ok=True)
    (HOME_CFG / "imported.json").write_text(json.dumps(extra, indent=2), encoding="utf-8")
    print(f"  {G}[+] imported {len(extra)}{X}")
    ask("0 back>")
    return records + extra


def load_imported(records: list[dict]) -> list[dict]:
    p = HOME_CFG / "imported.json"
    if not p.exists():
        return records
    try:
        extra = json.loads(p.read_text(encoding="utf-8"))
        return records + extra if isinstance(extra, list) else records
    except json.JSONDecodeError:
        return records


def menu() -> str | None:
    print(f"""
  {R}[ 1 ]{X}  {W}Search{X}                 {D}name / CNIC / mobile / invoice / city{X}
  {R}[ 2 ]{X}  {W}Dashboard{X}
  {R}[ 3 ]{X}  {W}Investigations{X}
  {R}[ 4 ]{X}  {W}Intelligence Graph{X}
  {R}[ 5 ]{X}  {W}OSINT Module{X}
  {R}[ 6 ]{X}  {W}NADRA{X}                  {D}all citizens · full CNIC{X}
  {R}[ 7 ]{X}  {W}my files.pdf{X}           {D}all prize records · full mobile{X}
  {R}[ 8 ]{X}  {W}Sources{X}
  {R}[ 9 ]{X}  {W}Datasets{X}
  {R}[10 ]{X}  {W}Analytics{X}
  {R}[11 ]{X}  {W}Reports{X}
  {R}[12 ]{X}  {W}Settings{X}
  {R}[13 ]{X}  {W}Import CSV{X}
  {R}[ 0 ]{X}  {D}Exit{X}
""")
    return ask("infinityx>")


def interactive() -> None:
    settings = load_settings()
    records = load_imported(load_records())
    while True:
        clear()
        banner()
        bar(records, settings)
        choice = menu()
        if choice is None or choice.lower() in {"exit"}:
            print(f"  {R}infinityx offline.{X}")
            break
        if choice == "1":
            do_search(records, settings)
        elif choice == "2":
            show_dashboard(records, settings)
        elif choice == "3":
            show_investigations(records, settings)
        elif choice == "4":
            show_graph(records, settings)
        elif choice == "5":
            show_osint(records, settings)
        elif choice == "6":
            show_nadra(records, settings)
        elif choice == "7":
            show_pdf(records, settings)
        elif choice == "8":
            show_sources(records, settings)
        elif choice == "9":
            show_datasets(records, settings)
        elif choice == "10":
            show_analytics(records, settings)
        elif choice == "11":
            do_report(records, settings)
        elif choice == "12":
            settings = do_settings(settings)
        elif choice == "13":
            records = import_csv(records)
        else:
            print(f"  {Y}use numbers 1-13 · 0 = exit{X}")
            time.sleep(0.7)


def cli_search(query: str, source: str) -> None:
    settings = load_settings()
    records = load_imported(load_records())
    hits = search_local(records, query, source if source != "api" else "all")
    if settings.get("api_enabled") and source in {"all", "api"}:
        rows, _msg = search_api(query, settings)
        seen = {field(h[2], "id") + field(h[2], "cnic") for h in hits}
        for rec in rows:
            key = field(rec, "id") + field(rec, "cnic")
            if key in seen:
                continue
            sc, mf = score_record(rec, query)
            hits.append((sc or 70, mf or ["api"], rec))
        hits.sort(key=lambda h: -h[0])
    browse_hits(f"SEARCH · {query}", hits, records, settings)


def usage() -> None:
    print(f"""{G}infinityx{X}  {D}type a number · 0 = back{X}

  infinityx
  infinityx search "MUHAMMAD ASLAM"
  infinityx search 3320213987869
""")


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
            sys.stderr.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass
    args = sys.argv[1:]
    if not args:
        interactive()
        return
    cmd = args[0].lower()
    if cmd in {"-h", "--help", "help"}:
        usage()
        return
    if cmd in {"search", "s", "lookup"}:
        source = "all"
        qargs = []
        for a in args[1:]:
            if a == "--nadra":
                source = "nadra"
            elif a == "--pdf":
                source = "pdf"
            elif a == "--api":
                source = "api"
            else:
                qargs.append(a)
        q = " ".join(qargs).strip()
        if not q:
            usage()
            sys.exit(2)
        cli_search(q, source)
        return
    print(f"{R}unknown command{X}")
    usage()
    sys.exit(2)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n  {R}aborted{X}")
