#!/usr/bin/env python3
"""Genera el sitio AnaxDevBook a partir de src/.

    python tools/build.py    # genera docs/, index.html, search-index.json, sw.js y valida enlaces

Estructura de entrada:
    src/site.json                     handbooks y rutas de estudio por rol
    src/handbooks/<id>/book.json      metadatos, partes y capítulos
    src/handbooks/<id>/<cap>.html     cuerpo de cada capítulo (sin <section>)
    src/apps/*.html                   aplicaciones autocontenidas (se copian tal cual)
    src/templates/*.html              plantillas con marcadores {{nombre}}

Solo usa la biblioteca estándar para que funcione en cualquier máquina.
"""
from __future__ import annotations

import hashlib
import html
import json
import re
import shutil
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
DOCS = ROOT / "docs"

ID_RE = re.compile(r'\bid="([^"]+)"')
H3_RE = re.compile(r"<h3(\s[^>]*)?>(.*?)</h3>", re.S)
TAG_RE = re.compile(r"<[^>]+>")
EMOJI_RE = re.compile(
    "[\U0001F000-\U0001FAFF☀-➿⬀-⯿️‍←-⇿⌀-⏿■-◿]+"
)


class BuildError(Exception):
    pass


def read(p: Path) -> str:
    return p.read_text(encoding="utf-8")


def write(p: Path, text: str) -> None:
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding="utf-8", newline="\n")


def plain(fragment: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(TAG_RE.sub(" ", fragment))).strip()


def clean_heading(fragment: str) -> str:
    text = plain(re.sub(r'<a class="anchor"[^>]*>.*?</a>', "", fragment))
    return EMOJI_RE.sub("", text).strip(" ·—-")


def slugify(text: str) -> str:
    text = unicodedata.normalize("NFD", text.lower())
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    text = re.sub(r"[^a-z0-9]+", "-", text).strip("-")
    return text[:60].strip("-") or "seccion"


def render(template: str, **values: str) -> str:
    def sub(m: re.Match) -> str:
        key = m.group(1)
        if key not in values:
            raise BuildError(f"Falta el valor de plantilla '{key}'")
        return values[key]

    return re.sub(r"\{\{(\w+)\}\}", sub, template)


def esc(s: str) -> str:
    return html.escape(s, quote=True)


# ---------------------------------------------------------------------------
# Handbooks
# ---------------------------------------------------------------------------


def build_book(book_dir: Path, site: dict, template: str, search: list) -> dict:
    meta = json.loads(read(book_dir / "book.json"))
    book_id = meta["id"]
    used_ids: dict[str, str] = {}
    toc_groups, body_parts = [], []
    words_total = 0
    chapter_count = 0
    new_count = 0

    def claim(i: str, where: str) -> None:
        if i in used_ids:
            raise BuildError(f"[{book_id}] id duplicado '{i}' en {where} (ya usado en {used_ids[i]})")
        used_ids[i] = where

    for part_index, part in enumerate(meta["parts"]):
        toc_items = []
        part_html = []
        if part.get("title"):
            part_html.append(
                f'<div class="part" id="parte-{part_index + 1}"><div class="part-label">{esc(part.get("label", f"Parte {part_index + 1}"))}</div>'
                f'<div class="part-title">{esc(part["title"])}</div></div>'
            )
            claim(f"parte-{part_index + 1}", "parte")
        for ch in part["chapters"]:
            chapter_count += 1
            num = f"{chapter_count:02d}"
            cid = ch["id"]
            claim(cid, f"capítulo {cid}")
            body = read(book_dir / ch["file"])

            # ids existentes en el cuerpo
            for i in ID_RE.findall(body):
                claim(i, f"capítulo {cid}")

            # asignar ids a los h3 que no lo tienen y construir subíndice
            subs = []

            def fix_h3(m: re.Match) -> str:
                attrs, inner = m.group(1) or "", m.group(2)
                idm = ID_RE.search(attrs)
                title = clean_heading(inner)
                if idm:
                    hid = idm.group(1)
                else:
                    base = f"{cid}--{slugify(title)}"
                    hid, n = base, 2
                    while hid in used_ids:
                        hid, n = f"{base}-{n}", n + 1
                    claim(hid, f"capítulo {cid}")
                    attrs = f' id="{hid}"' + attrs
                subs.append((hid, title))
                return f'<h3{attrs}>{inner}<a class="anchor" href="#{hid}" aria-label="Enlace a esta sección">#</a></h3>'

            body = H3_RE.sub(fix_h3, body)
            words = len(plain(body).split())
            words_total += words

            badges = []
            if ch.get("badge"):
                cls = "new" if ch["badge"].lower().startswith("nuevo") else ""
                if cls:
                    new_count += 1
                badges.append(f'<span class="chapter-badge {cls}">{esc(ch["badge"])}</span>')
            if ch.get("revised"):
                badges.append(f'<span class="chapter-badge revised" title="Contenido sensible al tiempo: revisa su vigencia">Vigente a {esc(ch["revised"])}</span>')
            badges.append(f'<span class="chapter-badge">{max(1, round(words / 200))} min</span>')
            lede = f'<p class="chapter-lede">{ch["lede"]}</p>' if ch.get("lede") else ""
            part_html.append(
                f'<section class="chapter" id="{cid}">\n'
                f'<header class="chapter-head"><div class="chapter-kicker"><span class="chapter-num">CAP. {num}</span>{"".join(badges)}'
                f'<span class="chapter-tools"><button type="button" class="mark-done" data-ch="{cid}" aria-pressed="false">Marcar como dominado</button></span></div>'
                f'<h2>{esc(ch["title"])}<a class="anchor" href="#{cid}" aria-label="Enlace a este capítulo">#</a></h2>{lede}</header>\n'
                f"{body.strip()}\n</section>"
            )

            sub_html = "".join(f'<a class="toc-sub" href="#{h}">{esc(t)}</a>' for h, t in subs)
            toc_items.append(
                f'<div class="toc-ch" data-ch="{cid}"><a class="toc-link" href="#{cid}"><span class="n">{num}</span><span>{esc(ch["title"])}</span></a>'
                f'<div class="toc-subs">{sub_html}</div></div>'
            )

            url = f"docs/{book_id}.html"
            search.append({"b": meta["short"], "c": ch["title"], "h": ch["title"], "u": f"{url}#{cid}",
                           "t": plain(ch.get("lede", "") or body)[:170]})
            for h, t in subs:
                after = body.split(f'id="{h}"', 1)[-1]
                after = after.split("</h3>", 1)[-1]
                search.append({"b": meta["short"], "c": ch["title"], "h": t, "u": f"{url}#{h}", "t": plain(after)[:170]})

        toc_groups.append(
            f'<div class="toc-group"><div class="toc-group-title">{esc(part.get("title") or meta["short"])}</div>{"".join(toc_items)}</div>'
        )
        body_parts.append("\n".join(part_html))

    others = "".join(
        f'<a href="{esc(o["href"].replace("docs/", ""))}">{esc(o["title"])}<small>{esc(o["tagline"])}</small></a>'
        for o in site["handbooks"]
        if o["id"] != book_id
    )
    minutes = round(words_total / 200)
    page = render(
        template,
        lang="es",
        title=esc(meta["title"]),
        description=esc(meta["description"]),
        book_id=book_id,
        short=esc(meta["short"]),
        eyebrow=esc(meta["eyebrow"]),
        heading=meta.get("heading_html", esc(meta["title"])),
        lede=meta["lede"],
        chapters=str(chapter_count),
        hours=f"{minutes / 60:.0f}" if minutes >= 90 else f"{minutes} min",
        hours_label="h de lectura" if minutes >= 90 else "de lectura",
        revised=esc(meta["revised"]),
        toc="\n".join(toc_groups),
        body="\n".join(body_parts),
        others=others,
        sources=meta.get("sources_html", ""),
    )
    out = DOCS / f"{book_id}.html"
    write(out, page)
    return {"id": book_id, "chapters": chapter_count, "minutes": minutes, "bytes": len(page.encode("utf-8")),
            "new": new_count, "ids": set(ID_RE.findall(page))}


# ---------------------------------------------------------------------------
# Índice, búsqueda y service worker
# ---------------------------------------------------------------------------


def build_index(site: dict, stats: dict, template: str) -> None:
    cards = []
    for hb in site["handbooks"]:
        st = stats.get(hb["id"])
        if st:
            meta = f'{st["chapters"]} capítulos · {max(1, round(st["minutes"] / 60))} h'
        else:
            meta = hb.get("meta", "Aplicación interactiva")
        badge = f'<span class="badge">{esc(hb["badge"])}</span>' if hb.get("badge") else ""
        cards.append(
            f'<a class="book-card" href="{esc(hb["href"])}" style="--card-accent:{esc(hb["color"])}">'
            f'<span class="book-icon">{esc(hb.get("icon", hb["title"][:2]))}</span>'
            f'<span class="book-kicker">{esc(hb["kicker"])}{badge}</span>'
            f'<span class="book-title">{esc(hb["title"])}</span>'
            f'<span class="book-desc">{esc(hb["description"])}</span>'
            f'<span class="book-meta">{esc(meta)}</span></a>'
        )
    paths = []
    for p in site["paths"]:
        steps = "".join(
            f'<li><a href="{esc(s["href"])}">{esc(s["label"])}</a>{(" <small>" + esc(s["note"]) + "</small>") if s.get("note") else ""}</li>'
            for s in p["steps"]
        )
        paths.append(
            f'<article class="path"><h3>{esc(p["role"])}</h3><p>{esc(p["summary"])}</p><ol>{steps}</ol></article>'
        )
    page = render(template, cards="\n".join(cards), paths="\n".join(paths), revised=esc(site["revised"]))
    write(ROOT / "index.html", page)


def build_sw(files: list[str]) -> None:
    digest = hashlib.sha256()
    for f in sorted(files):
        p = ROOT / f
        if p.is_file():
            digest.update(f.encode())
            digest.update(p.read_bytes())
    version = digest.hexdigest()[:12]
    template = read(SRC / "templates" / "sw.js")
    write(ROOT / "sw.js", render(template, version=version, precache=json.dumps(sorted(files), indent=2)))




# ---------------------------------------------------------------------------
# Validación de enlaces
# ---------------------------------------------------------------------------


def check_links(pages: dict[str, set]) -> list[str]:
    errors = []
    # href="..." en HTML y "href": "..." en datos JSON embebidos (roadmap)
    href_re = re.compile(r'href(?:="|":\s*")([^"]+)"')
    for rel, ids in pages.items():
        src = read(ROOT / rel)
        base = (ROOT / rel).parent
        for href in href_re.findall(src):
            if re.match(r"^(https?:|mailto:|tel:|data:|javascript:)", href) or href.startswith("//") or "'" in href:
                continue
            path, _, frag = href.partition("#")
            if not path:
                if frag and frag not in ids:
                    errors.append(f"{rel}: ancla interna rota #{frag}")
                continue
            target = (base / path).resolve()
            try:
                trel = target.relative_to(ROOT).as_posix()
            except ValueError:
                errors.append(f"{rel}: enlace fuera del sitio {href}")
                continue
            if not target.exists():
                errors.append(f"{rel}: archivo inexistente {href}")
                continue
            if frag and trel in pages and frag not in pages[trel]:
                errors.append(f"{rel}: ancla rota {href}")
    return errors


# ---------------------------------------------------------------------------


def main() -> int:
    site = json.loads(read(SRC / "site.json"))
    book_tpl = read(SRC / "templates" / "handbook.html")
    search: list = []
    stats = {}
    for hb in site["handbooks"]:
        bdir = SRC / "handbooks" / hb["id"]
        if (bdir / "book.json").exists():
            stats[hb["id"]] = build_book(bdir, site, book_tpl, search)

    for app in sorted((SRC / "apps").glob("*.html")):
        shutil.copyfile(app, DOCS / app.name)

    build_index(site, stats, read(SRC / "templates" / "index.html"))
    write(ROOT / "search-index.json", json.dumps(search, ensure_ascii=False, separators=(",", ":")))

    pages = {f"docs/{bid}.html": st["ids"] for bid, st in stats.items()}
    pages["index.html"] = set(ID_RE.findall(read(ROOT / "index.html")))
    for app in (SRC / "apps").glob("*.html"):
        pages[f"docs/{app.name}"] = set(ID_RE.findall(read(app)))
    errors = check_links(pages)

    precache = ["./", "index.html", "manifest.json", "search-index.json", "assets/handbook.css", "assets/handbook.js",
                "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png"]
    precache += sorted(p for p in pages if p.startswith("docs/"))
    build_sw(precache)

    for bid, st in stats.items():
        print(f"  {bid:24s} {st['chapters']:3d} caps  {st['minutes'] / 60:5.1f} h  {st['bytes'] / 1024:7.0f} KB  ({st['new']} nuevos)")
    print(f"  búsqueda: {len(search)} entradas")
    if errors:
        print("\nENLACES ROTOS:")
        for e in errors:
            print("  -", e)
        return 1
    print("  enlaces: OK")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except BuildError as e:
        print("ERROR:", e)
        sys.exit(2)
