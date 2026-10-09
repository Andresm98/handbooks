# AnaxDevBook

Handbooks de ingeniería de software, arquitectura, Solutions Architecture e IA generativa, publicados como sitio estático con soporte offline (PWA).

| Handbook | Archivo generado | Fuente |
|---|---|---|
| IA Generativa, RAG y Sistemas Agénticos | `docs/ia-generativa.html` | `src/handbooks/ia-generativa/` |
| Software Engineering — Handbook Senior | `docs/software-engineer.html` | `src/handbooks/software-engineer/` |
| Arquitectura de Software | `docs/arquitectura-software.html` | `src/handbooks/arquitectura-software/` |
| Solutions Architecture | `docs/solutions-architect.html` | `src/handbooks/solutions-architect/` |
| Roadmap interactivo (Banca) | `docs/roadmap.html` | `src/apps/roadmap.html` |

## Editar contenido

1. Edita el capítulo en `src/handbooks/<handbook>/<capitulo>.html`. Cada archivo contiene solo el cuerpo del capítulo: el título, el número y las insignias salen de `book.json`.
2. Para añadir, mover o renombrar capítulos, edita `src/handbooks/<handbook>/book.json`.
3. Genera el sitio:

```bash
python tools/build.py
```

El build (solo biblioteca estándar de Python) genera las páginas de `docs/`, `index.html`, `search-index.json` (búsqueda global) y `sw.js` (con versión de caché nueva en cada cambio) y **falla si hay ids duplicados o enlaces internos rotos**.

No edites a mano los archivos generados: se sobrescriben en cada build.

## Probar en local

```bash
python -m http.server 8000
```

Abre `http://localhost:8000`. La búsqueda global y el service worker necesitan servirse por HTTP (no funcionan con `file://`).

## Estructura

```
assets/         CSS y JS compartidos (tema claro/oscuro, índice, progreso, copiar código)
src/site.json   orden de handbooks y rutas de estudio por rol
src/templates/  plantillas de página, índice y service worker
src/handbooks/  contenido por handbook (book.json + un HTML por capítulo)
src/apps/       aplicaciones autocontenidas que se copian tal cual
tools/build.py  generador del sitio
```
