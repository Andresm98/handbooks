import { Fragment } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Topbar from "@/components/Topbar";
import HandbookClient from "@/components/HandbookClient";
import { MdxChapter } from "@/components/mdx";
import { allBooks, getBook, getCollection, hoursLabel } from "@/lib/content";

export const dynamicParams = false;

export function generateStaticParams() {
  return allBooks().map((b) => ({ collection: b.collection, book: b.id }));
}

type Params = { params: Promise<{ collection: string; book: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { collection, book } = await params;
  const b = getBook(collection, book);
  return b ? { title: b.title, description: b.description } : {};
}

export default async function BookPage({ params }: Params) {
  const { collection, book: bookId } = await params;
  const book = getBook(collection, bookId);
  const col = getCollection(collection);
  if (!book || !col) notFound();
  const hours = hoursLabel(book.minutes);
  const others = [
    ...col.books.filter((b) => b.id !== book.id).map((b) => ({ href: b.href, title: b.title, tagline: b.card.tagline })),
    ...col.apps.map((a) => ({ href: a.href, title: a.title, tagline: a.card.tagline })),
  ];

  return (
    <>
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>
      <Topbar book crumbs={[{ label: col.title, href: col.href }, { label: book.short }]} />
      <div className="scrim" id="scrim" />
      <div className="layout">
        <nav className="sidebar" id="sidebar" aria-label="Índice del handbook">
          <div className="sidebar-filter">
            <input id="tocFilter" type="search" placeholder="Filtrar índice  ( / )" aria-label="Filtrar índice" />
          </div>
          {book.parts.map((part) => (
            <div className="toc-group" key={part.anchor}>
              <div className="toc-group-title">{part.title ?? book.short}</div>
              {part.chapters.map((ch) => (
                <div className="toc-ch" data-ch={ch.id} key={ch.id}>
                  <a className="toc-link" href={`#${ch.id}`}>
                    <span className="n">{ch.num}</span>
                    <span>{ch.title}</span>
                  </a>
                  <div className="toc-subs">
                    {ch.subs.map((s) => (
                      <a className="toc-sub" href={`#${s.id}`} key={s.id}>
                        {s.title}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </nav>

        <main className="content" id="contenido">
          <div className="content-inner">
            <header className="hero">
              <div className="eyebrow">{book.eyebrow}</div>
              <h1 dangerouslySetInnerHTML={{ __html: book.heading_html ?? book.title }} />
              <p className="lede" dangerouslySetInnerHTML={{ __html: book.lede }} />
              <div className="hero-meta">
                <span>
                  <strong>{book.chapterCount}</strong> capítulo{book.chapterCount === 1 ? "" : "s"}
                </span>
                <span>
                  <strong>{hours.value}</strong> {hours.label}
                </span>
                <span>
                  Revisado <strong>{book.revised}</strong>
                </span>
              </div>
            </header>

            {book.parts.map((part) => (
              <Fragment key={part.anchor}>
                {part.title && (
                  <div className="part" id={part.anchor}>
                    <div className="part-label">{part.label}</div>
                    <div className="part-title">{part.title}</div>
                  </div>
                )}
                {part.chapters.map((ch) => (
                  <section className="chapter" id={ch.id} key={ch.id}>
                    <header className="chapter-head">
                      <div className="chapter-kicker">
                        <span className="chapter-num">CAP. {ch.num}</span>
                        {ch.badge && <span className={`chapter-badge${ch.badge.toLowerCase().startsWith("nuevo") ? " new" : ""}`}>{ch.badge}</span>}
                        {ch.revised && (
                          <span className="chapter-badge revised" title="Contenido sensible al tiempo: revisa su vigencia">
                            Vigente a {ch.revised}
                          </span>
                        )}
                        <span className="chapter-badge">{ch.minutes} min</span>
                        <span className="chapter-tools">
                          <button type="button" className="mark-done" data-ch={ch.id} aria-pressed="false">
                            Marcar como dominado
                          </button>
                        </span>
                      </div>
                      <h2>
                        {ch.title}
                        <a className="anchor" href={`#${ch.id}`} aria-label="Enlace a este capítulo">
                          #
                        </a>
                      </h2>
                      {ch.lede && <p className="chapter-lede" dangerouslySetInnerHTML={{ __html: ch.lede }} />}
                    </header>
                    {ch.kind === "mdx" ? <MdxChapter source={ch.body} /> : <div className="chapter-body" dangerouslySetInnerHTML={{ __html: ch.body }} />}
                  </section>
                ))}
              </Fragment>
            ))}

            <footer className="book-footer">
              <div>
                <strong>Otros handbooks de {col.title}</strong>
              </div>
              <div className="others">
                {others.map((o) => (
                  <a href={o.href} key={o.href}>
                    {o.title}
                    <small>{o.tagline}</small>
                  </a>
                ))}
              </div>
              <p>
                Contenido en <code>content/{book.collection}/{book.id}/</code>.
              </p>
            </footer>
          </div>
        </main>
      </div>
      <button className="icon-btn back-to-top" id="backToTop" aria-label="Volver arriba">
        ↑
      </button>
      <HandbookClient storageKey={`${book.collection}.${book.id}`} />
    </>
  );
}
