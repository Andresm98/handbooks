import Link from "next/link";
import type { CardMeta, Collection } from "@/lib/content";
import { hoursLabel } from "@/lib/content";

function Card({ href, title, card, meta, external }: { href: string; title: string; card: CardMeta; meta: string; external?: boolean }) {
  const inner = (
    <>
      <span className="book-icon">{card.icon}</span>
      <span className="book-kicker">
        {card.kicker}
        {card.badge && <span className="badge">{card.badge}</span>}
      </span>
      <span className="book-title">{title}</span>
      <span className="book-desc">{card.description}</span>
      <span className="book-meta">{meta}</span>
    </>
  );
  const style = { "--card-accent": card.color } as React.CSSProperties;
  // Las apps son HTML estático en public/: enlace normal, no navegación de Next.
  return external ? (
    <a className="book-card" href={href} style={style}>
      {inner}
    </a>
  ) : (
    <Link className="book-card" href={href} style={style}>
      {inner}
    </Link>
  );
}

export function BookGrid({ collection }: { collection: Collection }) {
  return (
    <div className="books">
      {collection.books.map((b) => {
        const h = hoursLabel(b.minutes);
        return (
          <Card
            key={b.id}
            href={b.href}
            title={b.title}
            card={b.card}
            meta={`${b.chapterCount} capítulo${b.chapterCount === 1 ? "" : "s"} · ${h.value} ${h.label.replace(" de lectura", "")}`}
          />
        );
      })}
      {collection.apps.map((a) => (
        <Card key={a.id} href={a.href} title={a.title} card={a.card} meta={a.meta ?? "Aplicación interactiva"} external />
      ))}
    </div>
  );
}

export function Paths({ collection }: { collection: Collection }) {
  if (!collection.paths.length) return null;
  return (
    <>
      <div className="section-head">
        <h2>Rutas de estudio por rol</h2>
        <p>El orden recomendado según el rol al que apuntas.</p>
      </div>
      <div className="paths">
        {collection.paths.map((p) => (
          <article className="path" key={p.role}>
            <h3>{p.role}</h3>
            <p>{p.summary}</p>
            <ol>
              {p.steps.map((s) => (
                <li key={s.href + s.label}>
                  <a href={s.href}>{s.label}</a>
                  {s.note && <small>{s.note}</small>}
                </li>
              ))}
            </ol>
          </article>
        ))}
      </div>
    </>
  );
}
