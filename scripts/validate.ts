/**
 * Valida el contenido antes de compilar (corre en `prebuild`):
 *   - ids duplicados dentro de un handbook (los detecta la capa de contenido)
 *   - enlaces internos rotos: anclas, handbooks, temáticas y archivos de public/
 *
 * Los enlaces internos se escriben con rutas absolutas: /<temática>/<handbook>#ancla
 */
import fs from "node:fs";
import path from "node:path";
import { ContentError, getCollections, getBook, getCollection, type Book } from "../src/lib/content";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const HREF_RE = /href(?:=|":\s*)"([^"]+)"|\]\(([^)\s]+)\)/g;

function hrefsIn(text: string): string[] {
  return [...text.matchAll(HREF_RE)].map((m) => m[1] ?? m[2]).filter((h) => !h.includes("'") && !h.includes("+"));
}

function check(href: string, from: string, current: Book | undefined, errors: string[]) {
  if (/^(https?:|mailto:|tel:|data:|javascript:)/.test(href) || href.startsWith("//")) return;
  const [p, frag] = href.split("#");
  if (!p) {
    if (!current) errors.push(`${from}: ancla sin handbook de referencia #${frag}`);
    else if (frag && !current.ids.has(frag)) errors.push(`${from}: ancla interna rota #${frag}`);
    return;
  }
  if (!p.startsWith("/")) {
    errors.push(`${from}: usa rutas absolutas (/<temática>/<handbook>), no "${href}"`);
    return;
  }
  if (p === "/") return;
  const segs = p.slice(1).split("/");
  if (segs.length === 2 && getCollection(segs[0])) {
    const book = getBook(segs[0], segs[1]);
    if (!book) errors.push(`${from}: handbook inexistente ${href}`);
    else if (frag && !book.ids.has(frag)) errors.push(`${from}: ancla rota ${href}`);
    return;
  }
  if (segs.length === 1 && getCollection(segs[0])) return;
  if (!fs.existsSync(path.join(PUBLIC_DIR, ...segs))) errors.push(`${from}: ruta inexistente ${href}`);
}

function main(): number {
  const errors: string[] = [];
  let collections;
  try {
    collections = getCollections();
  } catch (e) {
    if (e instanceof ContentError) {
      console.error("ERROR:", e.message);
      return 2;
    }
    throw e;
  }

  let chapters = 0;
  for (const col of collections) {
    for (const book of col.books) {
      for (const part of book.parts) {
        for (const ch of part.chapters) {
          chapters++;
          for (const h of hrefsIn(ch.body)) check(h, `${book.href} › ${ch.file}`, book, errors);
          if (ch.lede) for (const h of hrefsIn(ch.lede)) check(h, `${book.href} › lede ${ch.id}`, book, errors);
        }
      }
      console.log(`  ${(col.id + "/" + book.id).padEnd(36)} ${String(book.chapterCount).padStart(3)} caps  ${(book.minutes / 60).toFixed(1).padStart(4)} h`);
    }
    for (const p of col.paths) for (const s of p.steps) check(s.href, `${col.id}/collection.json › ${p.role}`, undefined, errors);
    for (const a of col.apps) check(a.href, `${col.id}/collection.json › ${a.id}`, undefined, errors);
  }

  for (const f of fs.readdirSync(path.join(PUBLIC_DIR, "apps")).filter((f) => f.endsWith(".html"))) {
    const text = fs.readFileSync(path.join(PUBLIC_DIR, "apps", f), "utf8");
    for (const h of hrefsIn(text)) if (h.startsWith("/") || h.startsWith("#")) {
      if (!h.startsWith("#")) check(h, `public/apps/${f}`, undefined, errors);
    }
  }

  console.log(`  ${collections.length} temática(s) · ${chapters} capítulos`);
  if (errors.length) {
    console.error("\nENLACES ROTOS:");
    for (const e of errors) console.error("  -", e);
    return 1;
  }
  console.log("  enlaces: OK");
  return 0;
}

process.exit(main());
