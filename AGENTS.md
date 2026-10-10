<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AnaxDevBook — guía para agentes

Sitio de handbooks personales por temática (Next.js 16, App Router, generación 100% estática). Todo el contenido está en español; escribe contenido, comentarios y mensajes en español.

## Antes de terminar cualquier cambio

```bash
npm run validate    # ids duplicados, enlaces rotos y esquema del roadmap
npm run typecheck
npm run build       # ejecuta validate en prebuild; debe terminar sin errores
```

No des un cambio por terminado si alguno falla. `validate` es la red de seguridad del contenido: si falla, corrige el contenido, no el validador (salvo que el validador tenga un bug real).

## Dónde va cada cosa

| Quiero… | Archivo |
|---|---|
| Editar un capítulo | `content/<temática>/<handbook>/<capítulo>.html` o `.mdx` |
| Agregar, mover o renombrar capítulos | `content/<temática>/<handbook>/book.json` |
| Agregar una temática | `content/<temática>/collection.json` + carpetas de handbooks |
| Rutas de estudio por rol, apps de una temática | `collection.json` (`paths`, `apps`) |
| Contenido del roadmap interactivo | `public/apps/roadmap-data/*.js` |
| Estilos | `src/app/globals.css` (handbooks) y `src/app/home.css` (portada) |
| Lógica de lectura de contenido | `src/lib/content.ts` |
| Comportamiento interactivo de un handbook | `src/components/HandbookClient.tsx` |
| Componentes disponibles en MDX | `src/components/mdx.tsx` |

## Reglas de contenido

- **Enlaces internos siempre absolutos**: `/<temática>/<handbook>#ancla` o `/apps/roadmap.html`. Las rutas relativas (`otro.html`) fallan la validación.
- **Ids únicos por handbook.** Los `<h3>` sin id reciben uno automático (`<capítulo>--<slug>`); si cambias el texto de un `<h3>` sin id, cambia su ancla. Si algo enlaza a esa sección, dale un `id` explícito.
- **Capítulos HTML** contienen solo el cuerpo: sin `<section>`, sin `<h2>` (el título sale de `book.json`), y usan las clases existentes del sistema de diseño (`callout tip|warn|danger|def|axiom`, `card-grid`/`card`, `diagram`, `flow`, `table-wrap`, `tag`). No agregues estilos en línea ni clases nuevas sin definirlas en `globals.css`.
- **Capítulos MDX**: `### Título` para subsecciones y los componentes de `mdx.tsx`. Las expresiones JS en props están permitidas; el JS peligroso está bloqueado.
- **Contenido sensible al tiempo** (modelos, precios, versiones de frameworks, regulación): marca el capítulo con `"revised": "<mes año>"` en `book.json`.
- **Hechos verificables**: casos reales, fechas, cifras y CVEs deben corresponder a fuentes públicas citables. Si no estás seguro de un dato, no lo inventes: omítelo o márcalo para revisión.
- **Código de ejemplo contra APIs de LLM**: usa identificadores de modelo vigentes y patrones actuales del SDK oficial; nunca inventes nombres de métodos.

## Roadmap interactivo

`public/apps/roadmap.html` es una SPA autocontenida (JS sin framework). El contenido ampliado vive en `public/apps/roadmap-data/`, un archivo por dominio, cargados en orden desde `registro.js`:

- `RoadmapPlus.temas({ '<id>': { conceptos, profundidad, recurrentes, casos, escenarios } })` amplía un tema existente.
- `RoadmapPlus.nuevo({ ...tema completo })` agrega un tema nuevo (mismo esquema que los de `roadmap.html` más `plus` y `matriz`). Agrégalo también a un nivel del array `ROADMAP` en `roadmap.html`.
- `RoadmapPlus.transversales([...])` alimenta la página de temas transversales.
- Mínimos que exige `validate`: 8 conceptos, 2 bloques de profundidad, 3 recurrentes, 1 caso con `titulo/cuando/que/causa/leccion/fuente` y 1 escenario por tema. Los niveles de entrevista válidos son `Junior`, `Semi Senior`, `Senior` y `Staff/Arquitecto`.
- Formato permitido en los textos: `` `código` `` y `**negrita**`. Los strings van entre comillas simples: escapa los apóstrofos (`O\'Reilly`).

## Lo que no se debe hacer

- No crear archivos HTML de handbooks a mano en `public/`: las páginas se generan desde `content/`.
- No borrar ni editar el bloque `nextjs-agent-rules` de este archivo.
- No commitear `node_modules/`, `.next/`, `next-env.d.ts` ni `*.tsbuildinfo` (están en `.gitignore`).
- No hacer commit, push ni despliegues sin que el usuario lo pida.
- No agregar dependencias sin necesidad clara; el sitio es estático y debe seguir siéndolo.
