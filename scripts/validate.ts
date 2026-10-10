/**
 * Valida el contenido antes de compilar (corre en `prebuild`):
 *   - ids duplicados dentro de un handbook (los detecta la capa de contenido)
 *   - enlaces internos rotos: anclas, handbooks, temáticas y archivos de public/
 *   - roadmap: contenido ampliado completo, esquema de temas nuevos y referencias cruzadas
 *
 * Los enlaces internos se escriben con rutas absolutas: /<temática>/<handbook>#ancla
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
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

/* ---------- Roadmap: public/apps/roadmap.html + public/apps/roadmap-data/*.js ---------- */
type Plus = {
  conceptos?: [string, string][];
  profundidad?: { t: string; p: unknown[] }[];
  recurrentes?: { tema: string; por: string; clave: string }[];
  casos?: Record<string, string>[];
  escenarios?: { sintoma: string; pasos: string[]; solucion: string }[];
};

function validateRoadmap(errors: string[]): string {
  const html = fs.readFileSync(path.join(PUBLIC_DIR, "apps", "roadmap.html"), "utf8");
  const files = [...html.matchAll(/<script src="\/apps\/roadmap-data\/([\w-]+\.js)"><\/script>/g)].map((m) => m[1]);
  // Igual que en el navegador: window es el objeto global.
  const sandbox: { window: Record<string, unknown> } & Record<string, unknown> = { window: {} };
  sandbox.window = sandbox;
  const ctx = vm.createContext(sandbox);
  for (const f of files) {
    const file = path.join(PUBLIC_DIR, "apps", "roadmap-data", f);
    if (!fs.existsSync(file)) {
      errors.push(`roadmap: falta el archivo de datos ${f}`);
      continue;
    }
    try {
      vm.runInContext(fs.readFileSync(file, "utf8"), ctx, { filename: f });
    } catch (e) {
      errors.push(`roadmap: error al evaluar ${f}: ${(e as Error).message}`);
    }
  }
  const plus = sandbox.window.ROADMAP_PLUS as { temas: Record<string, Plus>; nuevos: Record<string, unknown>[]; transversales: { tema: string; temas: string[] }[] } | undefined;
  if (!plus) {
    errors.push("roadmap: registro.js no definió ROADMAP_PLUS");
    return "";
  }

  const baseIds = [...html.matchAll(/CHAPTERS\.push\(\{\s*"?id"?:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
  const newIds = plus.nuevos.map((c) => String(c.id));
  const all = [...baseIds, ...newIds];
  const dup = all.filter((id, i) => all.indexOf(id) !== i);
  if (dup.length) errors.push(`roadmap: ids de tema duplicados: ${dup.join(", ")}`);
  const known = new Set(all);
  const nums = [...html.matchAll(/CHAPTERS\.push\(\{\s*"?id"?:\s*['"][^'"]+['"],\s*"?num"?:\s*(\d+)/g)].map((m) => Number(m[1])).concat(plus.nuevos.map((c) => Number(c.num)));
  if (new Set(nums).size !== nums.length) errors.push("roadmap: números de tema repetidos");

  const checkPlus = (id: string, p: Plus | undefined) => {
    const where = `roadmap › ${id}`;
    if (!p) return errors.push(`${where}: sin contenido ampliado (conceptos, profundidad, recurrentes, casos, escenarios)`);
    if (!p.conceptos || p.conceptos.length < 8 || p.conceptos.some((c) => !Array.isArray(c) || c.length !== 2 || !c[0] || !c[1])) errors.push(`${where}: conceptos debe tener al menos 8 pares [término, definición]`);
    if (!p.profundidad || p.profundidad.length < 2 || p.profundidad.some((s) => !s.t || !Array.isArray(s.p) || !s.p.length)) errors.push(`${where}: profundidad necesita al menos 2 bloques con t y p`);
    if (!p.recurrentes || p.recurrentes.length < 3 || p.recurrentes.some((r) => !r.tema || !r.por || !r.clave)) errors.push(`${where}: recurrentes necesita al menos 3 entradas con tema, por y clave`);
    if (!p.casos || !p.casos.length || p.casos.some((k) => ["titulo", "cuando", "que", "causa", "leccion", "fuente"].some((f) => !k[f]))) errors.push(`${where}: cada caso necesita titulo, cuando, que, causa, leccion y fuente`);
    if (!p.escenarios || !p.escenarios.length || p.escenarios.some((e) => !e.sintoma || !e.pasos?.length || !e.solucion)) errors.push(`${where}: cada escenario necesita sintoma, pasos y solucion`);
  };

  for (const id of Object.keys(plus.temas)) if (!baseIds.includes(id)) errors.push(`roadmap: contenido ampliado para un tema inexistente "${id}"`);
  for (const id of baseIds) checkPlus(id, plus.temas[id]);

  const NIVELES = new Set(["Junior", "Semi Senior", "Senior", "Staff/Arquitecto"]);
  const REQ_C = ["definicion", "problema", "fundamentos", "arquitectura", "funcionamiento", "buenas", "malas", "errores", "patrones", "antipatrones", "ejemploReal", "ejemploBanca", "ejemploEmpresarial", "ventajas", "desventajas", "faq"];
  for (const ch of plus.nuevos as Record<string, any>[]) {
    const where = `roadmap › ${ch.id}`;
    for (const f of ["id", "num", "titulo", "dominio", "resumen", "nivel", "dificultad", "tiempoEstimado", "prereq", "tecnologias", "c", "entrevistas", "ejercicios", "proyecto", "checklist", "recursos", "relacionados"]) {
      if (ch[f] === undefined) errors.push(`${where}: falta el campo ${f}`);
    }
    for (const f of REQ_C) if (!ch.c?.[f]) errors.push(`${where}: falta c.${f}`);
    if (!ch.proyecto?.tech?.length) errors.push(`${where}: proyecto.tech vacío`);
    for (const e of ch.entrevistas ?? []) if (!NIVELES.has(e.nivel)) errors.push(`${where}: nivel de entrevista desconocido "${e.nivel}"`);
    for (const r of [...(ch.prereq ?? []), ...(ch.relacionados ?? [])]) if (!known.has(r)) errors.push(`${where}: referencia a tema inexistente "${r}"`);
    checkPlus(ch.id, ch.plus);
  }
  for (const t of plus.transversales) for (const id of t.temas) if (!known.has(id)) errors.push(`roadmap › transversal "${t.tema}": tema inexistente "${id}"`);

  const roadmapBlock = html.slice(html.indexOf("const ROADMAP = ["), html.indexOf("const CAPSTONE_PROJECTS"));
  for (const m of roadmapBlock.matchAll(/'([a-z0-9-]+)'/g)) if (m[1].includes("-") && !known.has(m[1])) errors.push(`roadmap › ROADMAP: tema inexistente "${m[1]}"`);
  const enRoadmap = new Set([...roadmapBlock.matchAll(/'([a-z0-9-]+)'/g)].map((m) => m[1]));
  for (const id of newIds) if (!enRoadmap.has(id)) errors.push(`roadmap › ${id}: no aparece en ningún nivel del ROADMAP`);

  const casos = Object.values(plus.temas).reduce((n, p) => n + (p.casos?.length ?? 0), 0) + plus.nuevos.reduce((n, c: any) => n + (c.plus?.casos?.length ?? 0), 0);
  return `  roadmap: ${all.length} temas (${newIds.length} nuevos) · ${casos} casos reales · ${plus.transversales.length} temas transversales`;
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
  console.log(validateRoadmap(errors));
  if (errors.length) {
    console.error("\nENLACES ROTOS:");
    for (const e of errors) console.error("  -", e);
    return 1;
  }
  console.log("  enlaces: OK");
  return 0;
}

process.exit(main());
