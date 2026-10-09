import Link from "next/link";
import { getSite } from "@/lib/content";
import ThemeToggle from "./ThemeToggle";

interface Props {
  crumbs?: { label: string; href?: string }[];
  /** Muestra botón de menú, contador de capítulos dominados y barra de progreso (páginas de handbook). */
  book?: boolean;
}

export default function Topbar({ crumbs = [], book = false }: Props) {
  const site = getSite();
  return (
    <header className="topbar">
      {book && (
        <button className="icon-btn menu-btn" id="menuBtn" aria-label="Abrir índice" aria-controls="sidebar" aria-expanded="false">
          ☰
        </button>
      )}
      <Link className="brand" href="/" title="Volver al inicio">
        <span className="brand-mark">A</span>
        <span>{site.name}</span>
      </Link>
      {crumbs.map((c) => (
        <span className="crumb" key={c.label}>
          /{" "}
          {c.href ? (
            <Link href={c.href} style={{ color: "inherit", fontWeight: 500 }}>
              {c.label}
            </Link>
          ) : (
            c.label
          )}
        </span>
      ))}
      <span className="spacer" />
      {book && (
        <span className="chapter-badge" title="Capítulos marcados como dominados">
          ✓ <span id="doneCount">0</span>
        </span>
      )}
      <ThemeToggle />
      {book && <div className="progress-bar" id="progressBar" />}
    </header>
  );
}
