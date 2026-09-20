#!/usr/bin/env python3
"""
INFINITY X — Kali Linux OSINT Lab
DATABASE HACKED BY INFINITY X
Authorized training / OSINT workstation.

Zero extra packages. Python 3.9+ only (stdlib).
"""
from __future__ import annotations

import csv
import json
import os
import re
import shutil
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

# ── palette: Kali red / electric blue / terminal green ──────────────
R = "\033[1;31m"
B = "\033[1;34m"
C = "\033[1;36m"
G = "\033[1;32m"
Y = "\033[1;33m"
W = "\033[1;37m"
D = "\033[2;37m"
X = "\033[0m"
BG = "\033[40m"

HERE = Path(__file__).resolve().parent
HOME_CFG = Path.home() / ".infinityx"
DATA_CANDIDATES = [
    HERE / "data" / "pakistan-database.json",
    HERE.parent / "data" / "pakistan-database.json",
    Path("/usr/share/infinityx/data/pakistan-database.json"),
    Path("/opt/infinityx/data/pakistan-database.json"),
    Path.home() / ".local/share/infinityx/data/pakistan-database.json",
    HOME_CFG / "data" / "pakistan-database.json",
    HOME_CFG / "pakistan-database.json",
]
DEFAULT_API = os.environ.get("INFINITYX_API", "https://infinityosint.netlify.app/api/search")


def clear() -> None:
    os.system("clear" if os.name != "nt" else "cls")


def pause(msg: str = "Press ENTER") -> None:
    try:
        input(f"\n  {D}{msg}{X} ")
    except (EOFError, KeyboardInterrupt):
        print()


def digits(s: str) -> str:
    return re.sub(r"\D", "", s or "")


def now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%SZ")


def load_settings() -> dict:
    HOME_CFG.mkdir(parents=True, exist_ok=True)
    p = HOME_CFG / "settings.json"
    default = {
        "api_enabled": True,
        "api_url": DEFAULT_API,
        "api_key": "",
        "investigator": "Analyst IX-01",
    }
    if p.exists():
        try:
            data = json.loads(p.read_text(encoding="utf-8"))
            default.update(data)
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
        print(f"{R}[!] Index not found. Put pakistan-database.json in ./data/{X}")
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


def blob(rec: dict) -> str:
    parts = [
        field(rec, "id"),
        field(rec, "name", "full_name"),
        field(rec, "cnic", "CNIC"),
        field(rec, "mobile", "phone"),
        field(rec, "invoiceNumber", "invoice"),
        field(rec, "businessName", "organization", "business"),
        field(rec, "prize"),
        field(rec, "prizeAmount"),
        field(rec, "city"),
        field(rec, "province"),
        field(rec, "currentAddress", "address"),
        field(rec, "permanentAddress"),
        field(rec, "fatherName", "father"),
        field(rec, "gender"),
        field(rec, "birthDate"),
        field(rec, "country"),
        field(rec, "dataset", "source_name", "source"),
    ]
    return " ".join(parts).lower()


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
        best = 0
        best_f = ""
        for fk, fv in fields.items():
            if not fv:
                continue
            fl = fv.lower()
            fd = digits(fv)
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
                best = s
                best_f = fk
        if best:
            total += best
            if best_f not in matched:
                matched.append(best_f)
    if not total:
        return 0, []
    avg = min(99, round(total / max(len(tokens), 1)))
    name = field(rec, "name").lower()
    qn = query.strip().lower()
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
        src = field(rec, "dataset", "source_name", "source").lower()
        if source == "pdf" and "nadra" in src:
            continue
        if source == "nadra" and "nadra" not in src:
            continue
        sc, mf = score_record(rec, query)
        if sc:
            hits.append((sc, mf, rec))
    hits.sort(key=lambda h: (-h[0], field(h[2], "name")))
    return hits


def search_api(query: str, settings: dict) -> tuple[list[dict], str]:
    if not settings.get("api_enabled"):
        return [], "API disabled"
    url = (settings.get("api_url") or DEFAULT_API).rstrip("/")
    if "?" in url:
        full = f"{url}&q={urllib.parse.quote(query)}"
    else:
        full = f"{url}?q={urllib.parse.quote(query)}"
    req = urllib.request.Request(full, headers={"Accept": "application/json", "User-Agent": "InfinityX-Kali/1.0"})
    key = (settings.get("api_key") or "").strip()
    if key:
        req.add_header("Authorization", f"Bearer {key}")
    try:
        with urllib.request.urlopen(req, timeout=12) as res:
            payload = json.loads(res.read().decode("utf-8", errors="replace"))
    except Exception as e:  # noqa: BLE001 — surface any network/parse failure to TUI
        return [], f"API error: {e}"
    rows = payload if isinstance(payload, list) else payload.get("results") or payload.get("records") or payload.get("data") or []
    return rows, f"API {len(rows)} hits"


def banner() -> None:
    print(f"""{BG}{R}
    ██╗███╗   ██╗███████╗██╗███╗   ██╗██╗████████╗██╗   ██╗    {B}██╗  ██╗{R}
    ██║████╗  ██║██╔════╝██║████╗  ██║██║╚══██╔══╝╚██╗ ██╔╝    {B}╚██╗██╔╝{R}
    ██║██╔██╗ ██║█████╗  ██║██╔██╗ ██║██║   ██║    ╚████╔╝     {B} ╚███╔╝ {R}
    ██║██║╚██╗██║██╔══╝  ██║██║╚██╗██║██║   ██║     ╚██╔╝      {B} ██╔██╗ {R}
    ██║██║ ╚████║██║     ██║██║ ╚████║██║   ██║      ██║       {B}██╔╝ ██╗{R}
    ╚═╝╚═╝  ╚═══╝╚═╝     ╚═╝╚═╝  ╚═══╝╚═╝   ╚═╝      ╚═╝       {B}╚═╝  ╚═╝{X}
{C}        DATABASE HACKED BY INFINITY X{X}  {G}· KALI OSINT LAB · ONLINE{X}
{D}        name · CNIC · mobile · invoice · city · business · NADRA{X}
""")


def rule() -> None:
    print(f"{B}  {'─' * 66}{X}")


def scan_anim(query: str) -> None:
    frames = ["|", "/", "-", "\\"]
    for i in range(16):
        sys.stdout.write(
            f"\r  {R}[{frames[i % 4]}]{X} {C}SCANNING INDEX{X} {G}{query[:42]}{X}   "
        )
        sys.stdout.flush()
        time.sleep(0.05)
    sys.stdout.write("\r" + " " * 72 + "\r")
    sys.stdout.flush()


def print_dossier(rec: dict, score: int | None = None, matched: list[str] | None = None) -> None:
    src = field(rec, "dataset", "source_name", "source") or "INDEX"
    print()
    print(f"  {R}╔{'═' * 64}╗{X}")
    print(f"  {R}║{X} {C}OSINT DOSSIER{X}  {G}IN DATABASE{X}  {Y}{src.upper():<28}{X} {R}║{X}")
    print(f"  {R}╠{'═' * 64}╣{X}")
    name = field(rec, "name") or "UNKNOWN"
    print(f"  {R}║{X} {W}{name[:62]:<62}{X} {R}║{X}")
    ident = f"{field(rec, 'id')} · match {score}%" if score is not None else field(rec, "id")
    print(f"  {R}║{X} {D}{ident[:62]:<62}{X} {R}║{X}")
    print(f"  {R}╠{'═' * 64}╣{X}")

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
        ("COUNTRY", field(rec, "country")),
        ("CURRENT ADDRESS", field(rec, "currentAddress", "address")),
        ("PERMANENT ADDRESS", field(rec, "permanentAddress")),
        ("SOURCE", src),
    ]
    for label, val in rows:
        if not val:
            continue
        print(f"  {R}║{X} {B}{label:<16}{X} {G}{val[:45]:<45}{X} {R}║{X}")
    if matched:
        tags = " ".join(matched)
        print(f"  {R}║{X} {C}MATCHED{X}          {Y}{tags[:45]:<45}{X} {R}║{X}")
    print(f"  {R}╚{'═' * 64}╝{X}")


def print_hit_line(i: int, score: int, rec: dict) -> None:
    name = field(rec, "name")[:28] or "?"
    cnic = field(rec, "cnic")[:15] or "—"
    mob = field(rec, "mobile", "phone")[:16] or "—"
    src = field(rec, "dataset", "source_name")[:12]
    print(
        f"  {Y}{i:>2}{X}  {G}{score:>3}%{X}  {W}{name:<28}{X}  {C}{cnic:<15}{X}  {B}{mob:<16}{X}  {R}{src}{X}"
    )


def menu() -> str:
    print(f"""
  {R}[1]{X} {W}Search{X}              name / CNIC / mobile / invoice / city
  {R}[2]{X} {W}Dashboard{X}           live counters
  {R}[3]{X} {W}Investigations{X}      pin records to a case
  {R}[4]{X} {W}Intelligence Graph{X}  related by CNIC / org / city
  {R}[5]{X} {W}OSINT Module{X}
  {R}[6]{X} {W}NADRA Module{X}
  {R}[7]{X} {W}my files.pdf{X}
  {R}[8]{X} {W}Sources{X}
  {R}[9]{X} {W}Datasets{X}
  {R}[10]{X} {W}Analytics{X}
  {R}[11]{X} {W}Reports{X}            export dossier
  {R}[12]{X} {W}Settings{X}           API + investigator
  {R}[13]{X} {W}Import CSV{X}         add more records
  {R}[0]{X} {D}Exit{X}
""")
    try:
        return input(f"  {G}infinityx>{X} ").strip()
    except (EOFError, KeyboardInterrupt):
        return "0"


def do_search(records: list[dict], settings: dict, query: str | None = None, source: str = "all") -> list[tuple[int, list[str], dict]]:
    if query is None:
        print(f"  {C}Query examples:{X} {D}MUHAMMAD ASLAM  ·  3320213987869  ·  00923212423862  ·  Lahore{X}")
        print(f"  {C}Source filter:{X}  {D}all  |  pdf  |  nadra  |  api{X}")
        query = input(f"  {G}search>{X} ").strip()
        src_in = input(f"  {G}source [all]>{X} ").strip().lower() or "all"
        if src_in in {"all", "pdf", "nadra", "api"}:
            source = src_in
    if not query:
        return []
    scan_anim(query)
    local = [] if source == "api" else search_local(records, query, source if source != "api" else "all")
    api_rows, api_msg = ([], "skipped")
    if settings.get("api_enabled") and source in {"all", "api"}:
        api_rows, api_msg = search_api(query, settings)
    seen = {field(h[2], "id") + field(h[2], "cnic") for h in local}
    extra = []
    for rec in api_rows:
        key = field(rec, "id") + field(rec, "cnic")
        if key in seen:
            continue
        seen.add(key)
        sc, mf = score_record(rec, query)
        extra.append((sc or 70, mf or ["api"], rec))
    hits = local + extra
    hits.sort(key=lambda h: (-h[0], field(h[2], "name")))
    print(f"  {G}{len(hits)} found{X}  {D}· local {len(local)} · {api_msg}{X}")
    if not hits:
        print(f"  {R}NOT FOUND IN DATABASE{X}")
        return []
    print(f"  {D} #   %     NAME                          CNIC             MOBILE            SRC{X}")
    rule()
    for i, (sc, _mf, rec) in enumerate(hits[:40], 1):
        print_hit_line(i, sc, rec)
    if len(hits) > 40:
        print(f"  {D}… {len(hits) - 40} more{X}")
    pick = input(f"\n  {G}open # (ENTER skip)>{X} ").strip()
    if pick.isdigit():
        n = int(pick)
        if 1 <= n <= min(40, len(hits)):
            sc, mf, rec = hits[n - 1]
            print_dossier(rec, sc, mf)
            pin = input(f"  {G}pin to investigation? [y/N]>{X} ").strip().lower()
            if pin == "y":
                pin_record(rec)
    return hits


def pin_record(rec: dict) -> None:
    cases = load_cases()
    if not cases:
        cases.append(
            {
                "id": "INV-0001",
                "name": "Case 1",
                "created": now_iso(),
                "records": [],
            }
        )
    rec_id = field(rec, "id")
    cases[0]["records"] = [r for r in cases[0]["records"] if field(r, "id") != rec_id]
    cases[0]["records"].append(rec)
    save_cases(cases)
    print(f"  {G}[+] pinned {rec_id} → {cases[0]['id']}{X}")


def show_dashboard(records: list[dict]) -> None:
    pdf = [r for r in records if "nadra" not in field(r, "dataset", "source_name").lower()]
    nadra = [r for r in records if "nadra" in field(r, "dataset", "source_name").lower()]
    cnics = sum(1 for r in records if field(r, "cnic"))
    phones = sum(1 for r in records if field(r, "mobile", "phone"))
    print(f"""
  {C}DASHBOARD{X}  {D}{now_iso()}{X}
  {B}{'─' * 40}{X}
  {W}Indexed records{X}     {G}{len(records)}{X}
  {W}my files.pdf{X}        {G}{len(pdf)}{X}
  {W}NADRA GitHub{X}        {G}{len(nadra)}{X}
  {W}CNIC present{X}        {C}{cnics}{X}
  {W}Mobile present{X}      {C}{phones}{X}
  {W}Investigations{X}      {R}{len(load_cases())}{X}
  {W}API{X}                 {G}ONLINE{X} {D}{DEFAULT_API}{X}
  {B}{'─' * 40}{X}
  {D}SYSTEM STATUS · AUTHORIZED TRAINING ENVIRONMENT{X}
""")


def show_investigations() -> None:
    cases = load_cases()
    if not cases:
        print(f"  {Y}No investigations yet. Search a record and pin it.{X}")
        return
    for c in cases:
        print(f"\n  {R}{c.get('id')}{X}  {W}{c.get('name')}{X}  {D}{c.get('created')}{X}")
        for rec in c.get("records", []):
            print(f"    {G}•{X} {field(rec, 'name')}  {C}{field(rec, 'cnic')}{X}  {B}{field(rec, 'mobile', 'phone')}{X}")


def show_graph(records: list[dict]) -> None:
    q = input(f"  {G}seed name/CNIC/city/org>{X} ").strip()
    if not q:
        return
    hits = search_local(records, q, "all")[:1]
    if not hits:
        print(f"  {R}no seed found{X}")
        return
    rec = hits[0][2]
    org = field(rec, "businessName", "organization")
    city = field(rec, "city")
    print_dossier(rec, hits[0][0], hits[0][1])
    print(f"\n  {C}RELATED NODES{X}")
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
            link = "CNIC-PREFIX"
        if link:
            related.append((link, other))
    if not related:
        print(f"  {D}no graph edges{X}")
        return
    for link, other in related[:20]:
        print(f"  {R}[{link}]{X} {W}{field(other, 'name')}{X}  {C}{field(other, 'cnic')}{X}  {G}{field(other, 'city') or field(other, 'businessName')}{X}")


def show_osint() -> None:
    print(f"""
  {C}OSINT MODULE{X}
  {B}{'─' * 50}{X}
  {W}INFINITY X{X} is a training OSINT lab. Search across:
    {G}•{X} Full name
    {G}•{X} CNIC (full or last digits)
    {G}•{X} Mobile / phone
    {G}•{X} Invoice number
    {G}•{X} Business / organization
    {G}•{X} City · province · father name
  {D}Live web twin:{X} {B}https://infinityosint.netlify.app{X}
""")


def show_nadra(records: list[dict]) -> None:
    nadra = [r for r in records if "nadra" in field(r, "dataset", "source_name").lower()]
    print(f"""
  {C}NADRA MODULE{X}
  {B}{'─' * 50}{X}
  Source: GitHub Project-Nadra_management_System demo
  Indexed citizens: {G}{len(nadra)}{X}
  Search father name, city, province, CNIC.
""")
    for r in nadra[:8]:
        print(f"  {G}•{X} {field(r, 'name'):<22} {C}{field(r, 'cnic')}{X}  {B}{field(r, 'city')}{X}")


def show_pdf(records: list[dict]) -> None:
    pdf = [r for r in records if "nadra" not in field(r, "dataset", "source_name").lower()]
    print(f"""
  {C}MY FILES.PDF{X}
  {B}{'─' * 50}{X}
  Prize-winner corpus · {G}{len(pdf)}{X} records
  Fields: name · CNIC · mobile · invoice · business · prize
""")
    for r in pdf[:8]:
        print(f"  {G}•{X} {field(r, 'name'):<24} {C}{field(r, 'cnic')}{X}  {Y}{field(r, 'prize')}{X}")


def show_sources(records: list[dict]) -> None:
    counts: dict[str, int] = {}
    for r in records:
        src = field(r, "dataset", "source_name") or "unknown"
        counts[src] = counts.get(src, 0) + 1
    print(f"\n  {C}SOURCES{X}")
    for k, v in counts.items():
        print(f"  {R}●{X} {W}{k:<28}{X} {G}{v}{X} records")
    print(f"  {R}●{X} {W}{'Live API':<28}{X} {B}{DEFAULT_API}{X}")


def show_datasets(records: list[dict]) -> None:
    show_sources(records)
    print(f"\n  {D}Schema: id name cnic mobile invoice business prize city province fatherName{X}")


def show_analytics(records: list[dict]) -> None:
    prizes: dict[str, int] = {}
    cities: dict[str, int] = {}
    for r in records:
        p = field(r, "prize") or "—"
        prizes[p] = prizes.get(p, 0) + 1
        c = field(r, "city") or "—"
        cities[c] = cities.get(c, 0) + 1
    print(f"\n  {C}ANALYTICS · PRIZE{X}")
    for k, v in sorted(prizes.items(), key=lambda x: -x[1])[:8]:
        bar = "█" * min(v, 40)
        print(f"  {Y}{k:<22}{X} {G}{bar}{X} {v}")
    print(f"\n  {C}ANALYTICS · CITY{X}")
    for k, v in sorted(cities.items(), key=lambda x: -x[1])[:8]:
        bar = "█" * min(v, 40)
        print(f"  {B}{k:<22}{X} {G}{bar}{X} {v}")


def do_report(records: list[dict], settings: dict) -> None:
    q = input(f"  {G}report query>{X} ").strip()
    if not q:
        return
    hits = search_local(records, q)
    out = HOME_CFG / f"report-{digits(now_iso()) or 'x'}.txt"
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
        lines.append("")
        lines.append(f"{field(rec, 'name')}  [{sc}%]  {','.join(mf)}")
        lines.append(f"  CNIC   {field(rec, 'cnic')}")
        lines.append(f"  MOBILE {field(rec, 'mobile', 'phone')}")
        lines.append(f"  INV    {field(rec, 'invoiceNumber')}")
        lines.append(f"  ORG    {field(rec, 'businessName', 'organization')}")
        lines.append(f"  CITY   {field(rec, 'city')} {field(rec, 'province')}")
    out.write_text("\n".join(lines), encoding="utf-8")
    print(f"  {G}[+] saved {out}{X}")


def do_settings(settings: dict) -> dict:
    print(f"""
  {C}SETTINGS{X}
  api_enabled = {settings.get('api_enabled')}
  api_url     = {settings.get('api_url')}
  investigator= {settings.get('investigator')}
""")
    v = input(f"  {G}enable API? [Y/n]>{X} ").strip().lower()
    if v in {"n", "no"}:
        settings["api_enabled"] = False
    elif v in {"y", "yes", ""}:
        settings["api_enabled"] = True
    url = input(f"  {G}API URL (empty keep)>{X} ").strip()
    if url:
        settings["api_url"] = url
    name = input(f"  {G}investigator (empty keep)>{X} ").strip()
    if name:
        settings["investigator"] = name[:40]
    save_settings(settings)
    print(f"  {G}[+] saved ~/.infinityx/settings.json{X}")
    return settings


def import_csv(records: list[dict]) -> list[dict]:
    path = input(f"  {G}CSV path>{X} ").strip().strip('"')
    if not path:
        return records
    p = Path(path).expanduser()
    if not p.exists():
        print(f"  {R}file not found{X}")
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
    dest = HOME_CFG / "imported.json"
    HOME_CFG.mkdir(parents=True, exist_ok=True)
    dest.write_text(json.dumps(extra, indent=2), encoding="utf-8")
    print(f"  {G}[+] imported {len(extra)} rows{X}")
    return records + extra


def load_imported(records: list[dict]) -> list[dict]:
    p = HOME_CFG / "imported.json"
    if not p.exists():
        return records
    try:
        extra = json.loads(p.read_text(encoding="utf-8"))
        if isinstance(extra, list):
            return records + extra
    except json.JSONDecodeError:
        pass
    return records


def interactive() -> None:
    settings = load_settings()
    records = load_imported(load_records())
    while True:
        clear()
        banner()
        print(f"  {G}●{X} {len(records)} records  {C}●{X} API {'ON' if settings.get('api_enabled') else 'OFF'}  {R}●{X} {settings.get('investigator')}")
        choice = menu()
        if choice in {"0", "q", "exit"}:
            print(f"  {R}infinityx offline.{X}")
            break
        clear()
        banner()
        if choice == "1":
            do_search(records, settings)
        elif choice == "2":
            show_dashboard(records)
        elif choice == "3":
            show_investigations()
        elif choice == "4":
            show_graph(records)
        elif choice == "5":
            show_osint()
        elif choice == "6":
            show_nadra(records)
        elif choice == "7":
            show_pdf(records)
        elif choice == "8":
            show_sources(records)
        elif choice == "9":
            show_datasets(records)
        elif choice == "10":
            show_analytics(records)
        elif choice == "11":
            do_report(records, settings)
        elif choice == "12":
            settings = do_settings(settings)
        elif choice == "13" or choice.lower() == "import":
            records = import_csv(records)
        else:
            print(f"  {Y}unknown command{X}")
        pause()


def cli_search(query: str, source: str) -> None:
    settings = load_settings()
    records = load_imported(load_records())
    banner()
    hits = search_local(records, query, source if source != "api" else "all")
    if settings.get("api_enabled") and source in {"all", "api"}:
        api_rows, msg = search_api(query, settings)
        print(f"  {D}{msg}{X}")
        seen = {field(h[2], "id") + field(h[2], "cnic") for h in hits}
        for rec in api_rows:
            key = field(rec, "id") + field(rec, "cnic")
            if key in seen:
                continue
            sc, mf = score_record(rec, query)
            hits.append((sc or 70, mf or ["api"], rec))
        hits.sort(key=lambda h: -h[0])
    if not hits:
        print(f"  {R}NOT FOUND IN DATABASE{X}")
        sys.exit(1)
    for i, (sc, mf, rec) in enumerate(hits[:25], 1):
        print_hit_line(i, sc, rec)
    print()
    print_dossier(hits[0][2], hits[0][0], hits[0][1])


def usage() -> None:
    print(
        f"""{G}infinityx{X} — DATABASE HACKED BY INFINITY X  {D}(Kali OSINT Lab){X}

  {W}infinityx{X}                         interactive TUI
  {W}infinityx search{X} {C}"<query>"{X}        one-shot search
  {W}infinityx search{X} {C}"33202..." --nadra{X}
  {W}infinityx dashboard{X}

  Query: name · CNIC · mobile · invoice · city · business
"""
    )


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
    if cmd == "dashboard":
        banner()
        show_dashboard(load_imported(load_records()))
        return
    print(f"{R}unknown command{X}")
    usage()
    sys.exit(2)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n  {R}aborted{X}")
