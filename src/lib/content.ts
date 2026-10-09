/**
 * Capa de contenido: lee content/ en tiempo de build y devuelve estructuras
 * listas para renderizar. Todo el sitio es estático; nada de esto corre en
 * el navegador.
 *
 *   content/site.json                              metadatos del sitio
 *   content/<temática>/collection.json             temática: rutas de estudio y apps
 *   content/<temática>/<handbook>/book.json        partes y capítulos
 *   content/<temática>/<handbook>/<capítulo>.html  cuerpo del capítulo (o .mdx)
 */
import fs from "node:fs";
import path from "node:path";

export const CONTENT_DIR = path.join(process.cwd(), "content");

export interface SiteMeta {
  name: string;
  title: string;
  description: string;
  revised: string;
}

export interface CardMeta {
  kicker: string;
  tagline: string;
  description: string;
  icon: string;
  color: string;
  badge?: string;
}

export interface AppLink {
  id: string;
  href: string;
  title: string;
  meta?: string;
  card: CardMeta;
}

export interface LearningPath {
  role: string;
  summary: string;
  steps: { label: string; href: string; note?: string }[];
}

export interface ChapterMeta {
  id: string;
  file: string;
  title: string;
  badge?: string;
  revised?: string;
  lede?: string;
}

export interface PartMeta {
  label?: string;
  title?: string;
  chapters: ChapterMeta[];
}

export interface BookMeta {
  id: string;
  order: number;
  card: CardMeta;
  title: string;
  short: string;
  eyebrow: string;
  heading_html?: string;
  lede: string;
  description: string;
  revised: string;
  parts: PartMeta[];
}

export interface Heading {
  id: string;
  title: string;
}

export interface Chapter extends ChapterMeta {
  num: string;
  kind: "html" | "mdx";
  /** HTML ya procesado (ids en h3) o fuente MDX ya procesada. */
  body: string;
  subs: Heading[];
  minutes: number;
  text: string;
}

export interface Part extends Omit<PartMeta, "chapters"> {
  anchor: string;
  chapters: Chapter[];
}

export interface Book extends Omit<BookMeta, "parts"> {
  collection: string;
  href: string;
  parts: Part[];
  chapterCount: number;
  minutes: number;
  ids: Set<string>;
}

export interface Collection {
  id: string;
  order: number;
  title: string;
  description: string;
  href: string;
  apps: AppLink[];
  paths: LearningPath[];
  books: Book[];
}

export interface SearchEntry {
  b: string; // handbook
  c: string; // capítulo
  h: string; // encabezado
  u: string; // url
  t: string; // fragmento de texto
}

export class ContentError extends Error {}

const ID_RE = /\bid="([^"]+)"/g;
const H3_RE = /<h3(\s[^>]*)?>([\s\S]*?)<\/h3>/g;
const EMOJI_RE = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}\u{2190}-\u{21FF}\u{2300}-\u{23FF}\u{25A0}-\u{25FF}]+/gu;

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", nbsp: " " };

export function plainText(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (m, e: string) => {
      if (ENTITIES[e]) return ENTITIES[e];
      if (e.startsWith("#x")) return String.fromCodePoint(parseInt(e.slice(2), 16));
      if (e.startsWith("#")) return String.fromCodePoint(parseInt(e.slice(1), 10));
      return m;
    })
    .replace(/\s+/g, " ")
    .trim();
}

function cleanHeading(fragment: string): string {
  return plainText(fragment.replace(/<a class(?:Name)?="anchor"[\s\S]*?<\/a>/g, ""))
    .replace(EMOJI_RE, "")
    .replace(/^[\s·—-]+|[\s·—-]+$/g, "");
}

export function slugify(text: string): string {
  const s = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s.slice(0, 60).replace(/-+$/, "") || "seccion";
}

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

/* ------------------------------------------------------------------------ */

let siteCache: SiteMeta | null = null;
let collectionsCache: Collection[] | null = null;

export function getSite(): SiteMeta {
  siteCache ??= readJson<SiteMeta>(path.join(CONTENT_DIR, "site.json"));
  return siteCache;
}

export function getCollections(): Collection[] {
  if (collectionsCache) return collectionsCache;
  const cols: Collection[] = [];
  for (const dir of fs.readdirSync(CONTENT_DIR, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    const colDir = path.join(CONTENT_DIR, dir.name);
    const colFile = path.join(colDir, "collection.json");
    if (!fs.existsSync(colFile)) continue;
    const meta = readJson<Omit<Collection, "books" | "href">>(colFile);
    if (meta.id !== dir.name) throw new ContentError(`collection.json de "${dir.name}" declara id "${meta.id}"`);
    const books: Book[] = [];
    for (const b of fs.readdirSync(colDir, { withFileTypes: true })) {
      if (b.isDirectory() && fs.existsSync(path.join(colDir, b.name, "book.json"))) {
        books.push(loadBook(dir.name, path.join(colDir, b.name)));
      }
    }
    books.sort((a, b) => a.order - b.order);
    cols.push({ ...meta, apps: meta.apps ?? [], paths: meta.paths ?? [], href: `/${meta.id}`, books });
  }
  collectionsCache = cols.sort((a, b) => a.order - b.order);
  return collectionsCache;
}

export function getCollection(id: string): Collection | undefined {
  return getCollections().find((c) => c.id === id);
}

export function getBook(collection: string, id: string): Book | undefined {
  return getCollection(collection)?.books.find((b) => b.id === id);
}

export function allBooks(): Book[] {
  return getCollections().flatMap((c) => c.books);
}

/* ------------------------------------------------------------------------ */

function loadBook(collection: string, dir: string): Book {
  const meta = readJson<BookMeta>(path.join(dir, "book.json"));
  if (meta.id !== path.basename(dir)) {
    throw new ContentError(`[${collection}] book.json de "${path.basename(dir)}" declara id "${meta.id}"`);
  }
  const used = new Map<string, string>();
  const claim = (id: string, where: string) => {
    if (used.has(id)) {
      throw new ContentError(`[${collection}/${meta.id}] id duplicado "${id}" en ${where} (ya usado en ${used.get(id)})`);
    }
    used.set(id, where);
  };

  let count = 0;
  let words = 0;
  const parts: Part[] = meta.parts.map((part, pi) => {
    const anchor = `parte-${pi + 1}`;
    claim(anchor, "parte");
    const chapters = part.chapters.map((ch) => {
      count += 1;
      claim(ch.id, `capítulo ${ch.id}`);
      const file = path.join(dir, ch.file);
      if (!fs.existsSync(file)) throw new ContentError(`[${collection}/${meta.id}] no existe ${ch.file}`);
      const raw = fs.readFileSync(file, "utf8");
      const kind = ch.file.endsWith(".mdx") ? "mdx" : "html";
      const { body, subs } = kind === "html" ? processHtml(raw, ch.id, claim, used) : processMdx(raw, ch.id, claim, used);
      const text = plainText(kind === "html" ? body : body.replace(/^import .*$/gm, ""));
      const w = text.split(" ").length;
      words += w;
      return {
        ...ch,
        num: String(count).padStart(2, "0"),
        kind,
        body,
        subs,
        minutes: Math.max(1, Math.round(w / 200)),
        text,
      } satisfies Chapter;
    });
    return { label: part.label ?? `Parte ${pi + 1}`, title: part.title, anchor, chapters };
  });

  return {
    ...meta,
    collection,
    href: `/${collection}/${meta.id}`,
    parts,
    chapterCount: count,
    minutes: Math.round(words / 200),
    ids: new Set(used.keys()),
  };
}

type Claim = (id: string, where: string) => void;

function uniqueId(base: string, used: Map<string, string>): string {
  let id = base;
  for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
  return id;
}

function processHtml(raw: string, cid: string, claim: Claim, used: Map<string, string>) {
  for (const m of raw.matchAll(ID_RE)) claim(m[1], `capítulo ${cid}`);
  const subs: Heading[] = [];
  const body = raw.replace(H3_RE, (_all, attrs: string | undefined, inner: string) => {
    let a = attrs ?? "";
    const title = cleanHeading(inner);
    const existing = /\bid="([^"]+)"/.exec(a);
    let id: string;
    if (existing) {
      id = existing[1];
    } else {
      id = uniqueId(`${cid}--${slugify(title)}`, used);
      claim(id, `capítulo ${cid}`);
      a = ` id="${id}"` + a;
    }
    subs.push({ id, title });
    return `<h3${a}>${inner}<a class="anchor" href="#${id}" aria-label="Enlace a esta sección">#</a></h3>`;
  });
  return { body: body.trim(), subs };
}

/** En MDX los "### Título" se convierten en h3 con id estable, igual que en HTML. */
function processMdx(raw: string, cid: string, claim: Claim, used: Map<string, string>) {
  for (const m of raw.matchAll(ID_RE)) claim(m[1], `capítulo ${cid}`);
  const subs: Heading[] = [];
  let fence = false;
  const lines = raw.split(/\r?\n/).map((line) => {
    if (/^\s*(```|~~~)/.test(line)) fence = !fence;
    const m = !fence && /^###\s+(.+?)\s*$/.exec(line);
    if (!m) return line;
    const title = m[1].replace(/[*_`]/g, "");
    const id = uniqueId(`${cid}--${slugify(title)}`, used);
    claim(id, `capítulo ${cid}`);
    subs.push({ id, title });
    return `<h3 id="${id}">${escapeHtml(title)}<a className="anchor" href="#${id}" aria-label="Enlace a esta sección">#</a></h3>`;
  });
  return { body: lines.join("\n").trim(), subs };
}

/* ------------------------------------------------------------------------ */

export function searchIndex(): SearchEntry[] {
  const out: SearchEntry[] = [];
  for (const book of allBooks()) {
    for (const part of book.parts) {
      for (const ch of part.chapters) {
        out.push({ b: book.short, c: ch.title, h: ch.title, u: `${book.href}#${ch.id}`, t: (ch.lede ? plainText(ch.lede) : ch.text).slice(0, 170) });
        for (const s of ch.subs) {
          const after = ch.body.split(`id="${s.id}"`)[1]?.split(/<\/h3>/)[1] ?? "";
          out.push({ b: book.short, c: ch.title, h: s.title, u: `${book.href}#${s.id}`, t: plainText(after).slice(0, 170) });
        }
      }
    }
  }
  return out;
}

export function hoursLabel(minutes: number): { value: string; label: string } {
  return minutes >= 90 ? { value: `${Math.round(minutes / 60)}`, label: "h de lectura" } : { value: `${minutes} min`, label: "de lectura" };
}
