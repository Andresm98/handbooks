# AnaxDevBook

Handbooks personales por temática, construidos con **Next.js (App Router)** y desplegados en **Vercel**. Todo el contenido se prerenderiza como estático en el build; Docker da el mismo entorno en local, en CI o en cualquier nube de contenedores. Funciona sin conexión como PWA, con tema claro/oscuro y búsqueda global.

## Contenido actual

Temática **Ingeniería de Software, Arquitectura e IA** (`content/ingenieria/`):

| Handbook | Capítulos | Enfoque |
|---|---|---|
| IA Generativa, RAG y Sistemas Agénticos | 38 | Fundamentos de ML y Transformers, integración de LLMs, RAG, agentes, MCP, evals, seguridad, gobernanza, costos, system design de IA y mapa de competencias para AI Engineer / AI Architect |
| Software Engineering — Handbook Senior | 18 | Oficio del código, diseño, backend, frontend, datos, testing, performance, seguridad y stack .NET / SQL Server / Angular por nivel |
| Arquitectura de Software | 10 | Principios, estilos como herramientas de decisión, patrones distribuidos, frontend y casos |
| Solutions Architecture | 21 | Rol del SA, modelos mentales, cloud y multi-cloud, redes, datos, seguridad, operación, modernización y casos |
| Roadmap interactivo (Banca) | 30 temas | Ruta Junior → Arquitecto con conceptos clave, profundización, temas recurrentes, 45 casos reales, troubleshooting, entrevistas por nivel, proyectos y checklist con progreso guardado |

Cada handbook incluye rutas de estudio por rol (Software Engineer, AI Software Engineer, Solutions Architect, AI Solutions Architect) en la portada.

## Estructura

```
content/
  site.json                                   nombre y descripción del sitio
  <temática>/collection.json                  título, rutas de estudio por rol y apps
  <temática>/<handbook>/book.json             tarjeta, partes y capítulos
  <temática>/<handbook>/<capítulo>.html|.mdx  cuerpo de cada capítulo
public/
  apps/roadmap.html                           roadmap interactivo (SPA autocontenida)
  apps/roadmap-data/*.js                      contenido ampliado del roadmap, un archivo por dominio
  icons/, manifest.json, sw.js                PWA y modo offline
src/
  app/                                        rutas: /, /<temática>, /<temática>/<handbook>
  app/globals.css, app/home.css               sistema de diseño (estilo Tailwind, tema claro/oscuro)
  components/                                 UI (índice, búsqueda, tema, MDX)
  lib/content.ts                              lectura y procesado del contenido
scripts/validate.ts                           valida ids, enlaces y roadmap (corre antes de cada build)
AGENTS.md                                     convenciones para agentes de IA que trabajen en el repo
```

Rutas generadas:

| Ruta | Contenido |
|---|---|
| `/` | Todas las temáticas, buscador global |
| `/<temática>` | Handbooks, apps y rutas de estudio de una temática |
| `/<temática>/<handbook>` | El handbook completo con índice lateral |
| `/search-index.json` | Índice de búsqueda (estático) |
| `/api/health` | Healthcheck para contenedores |

## Añadir contenido

**Una temática nueva** (por ejemplo, finanzas personales):

1. Crea `content/finanzas/collection.json` con `id`, `order`, `title` y `description` (opcionalmente `paths` y `apps`).
2. Crea un handbook: `content/finanzas/inversion/book.json` y sus capítulos.
3. Ejecuta `npm run dev`. La temática aparece en la portada; no hay que tocar código.

**Un capítulo**: añádelo a `parts[].chapters` en `book.json` (`id`, `file`, `title`; opcionales `lede`, `badge`, `revised`) y crea el archivo.

- **`.html`**: el cuerpo del capítulo con las clases del sistema de diseño.
- **`.mdx`**: Markdown con componentes: `<Callout>`, `<CardGrid>`, `<Card>`, `<Badge>`, `<Diagram>` y `<Flow>` (ver `src/components/mdx.tsx`). Las tablas Markdown (GFM) funcionan.

Los `### títulos` (MDX) y los `<h3>` (HTML) generan automáticamente el subíndice y anclas estables `#<capítulo>--<título>`.

**Enlaces internos**: usa rutas absolutas, `/<temática>/<handbook>#ancla`. `npm run validate` falla si un enlace o un ancla no existe, o si hay ids duplicados en un handbook. Se ejecuta automáticamente antes de cada `build`, así que Vercel y Docker nunca publican enlaces rotos.

**Contenido que caduca**: marca con `"revised": "oct 2026"` los capítulos con datos que cambian rápido (modelos, precios, frameworks, regulación); se muestran con la insignia *Vigente a*.

## Roadmap interactivo

`public/apps/roadmap.html` es una aplicación sin framework con progreso, favoritos y búsqueda propios (guardados en el navegador). Sus 22 temas base viven en el HTML; el contenido ampliado y los temas nuevos viven en `public/apps/roadmap-data/`, cargados en este orden: `registro.js`, `fundamentos.js`, `backend.js`, `frontend.js`, `datos.js`, `infraestructura.js`, `calidad-seguridad.js`, `arquitectura-banca-ia.js` y `transversales.js`.

```js
// Ampliar un tema existente
RoadmapPlus.temas({
  'bases-relacionales': {
    conceptos:   [['Término', 'Definición concisa'], /* ≥ 8 */],
    profundidad: [{ t: 'Título', p: ['Párrafo', ['viñeta', 'viñeta']], code: { lang, code } }],
    recurrentes: [{ tema, por, clave }],                            // ≥ 3
    casos:       [{ titulo, cuando, que, causa, leccion, fuente }], // incidentes públicos citables
    escenarios:  [{ sintoma, pasos: [], solucion }]
  }
});

// Tema nuevo: mismo esquema que los de roadmap.html, más `plus` y `matriz`.
// Agrégalo también a un nivel del array ROADMAP en roadmap.html.
RoadmapPlus.nuevo({ id, num, titulo, dominio, nivel, c: { ... }, entrevistas, plus: { ... } });

// Página de temas transversales
RoadmapPlus.transversales([{ tema, resumen, capas: [], regla, temas: ['id-de-tema'] }]);
```

Los textos admiten `` `código` `` y `**negrita**`. El validador comprueba los mínimos de cada bloque, los campos de los temas nuevos, que no haya ids ni números duplicados y que prerrequisitos, relacionados, temas transversales y niveles del roadmap apunten a temas existentes.

## Desarrollo

```bash
npm install
npm run dev          # http://localhost:3000
npm run validate     # ids y enlaces
npm run typecheck
npm run build
```

## Docker

```bash
docker compose up --build web            # imagen de producción → http://localhost:3000
docker compose --profile dev up --build  # desarrollo con recarga en caliente → http://localhost:3001
```

La imagen es multi-etapa (`deps` → `builder` → `runner`): Node 24 alpine, salida `standalone` de Next, usuario sin privilegios, sistema de archivos de solo lectura y healthcheck sobre `/api/health`. La misma imagen se puede desplegar sin cambios en Cloud Run, Azure Container Apps, ECS/App Runner o Kubernetes.

## Despliegue

- **Vercel** (producción): despliega desde `main` con el preset *Next.js*. No necesita variables de entorno.
- **CI** (`.github/workflows/ci.yml`): valida contenido, typecheck, build de Next, build de la imagen Docker y smoke test del contenedor.
