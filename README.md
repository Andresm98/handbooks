# AnaxDevBook

Handbooks personales por temática, construidos con **Next.js (App Router)** y desplegados en **Vercel**. Todo el contenido se prerenderiza como estático en el build; Docker da el mismo entorno en local, en CI o en cualquier nube de contenedores.

## Estructura

```
content/
  site.json                                   nombre y descripción del sitio
  <temática>/collection.json                  título, rutas de estudio por rol y apps
  <temática>/<handbook>/book.json             tarjeta, partes y capítulos
  <temática>/<handbook>/<capítulo>.html|.mdx  cuerpo de cada capítulo
public/
  apps/                                       aplicaciones autocontenidas (roadmap)
  icons/, manifest.json, sw.js                PWA y modo offline
src/
  app/                                        rutas: /, /<temática>, /<temática>/<handbook>
  components/                                 UI (índice, búsqueda, tema, MDX)
  lib/content.ts                              lectura y procesado del contenido
scripts/validate.ts                           valida ids y enlaces (corre antes de cada build)
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
