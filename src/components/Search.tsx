"use client";

import { useEffect, useRef, useState } from "react";
import type { SearchEntry } from "@/lib/content";

type Indexed = SearchEntry & { n: string; nh: string };

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

function highlight(text: string, terms: string[]) {
  const ts = terms.filter((t) => t.length > 1).map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (!ts.length) return text;
  const re = new RegExp(`(${ts.join("|")})`, "ig");
  return text.split(re).map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : part));
}

/** Búsqueda global sobre /search-index.json (generado en build). */
export default function Search() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState(-1);
  const [data, setData] = useState<Indexed[] | null>(null);
  const [failed, setFailed] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const box = useRef<HTMLDivElement>(null);

  const load = () => {
    if (data || failed) return;
    fetch("/search-index.json")
      .then((r) => r.json() as Promise<SearchEntry[]>)
      .then((d) => setData(d.map((e) => ({ ...e, n: norm(`${e.h} ${e.c} ${e.t}`), nh: norm(e.h) }))))
      .catch(() => setFailed(true));
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== input.current) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    const onClick = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, []);

  const query = norm(q.trim());
  const terms = query.split(/\s+/).filter(Boolean);
  const hits =
    query.length < 2 || !data
      ? []
      : data
          .filter((e) => terms.every((t) => e.n.includes(t)))
          .map((e) => [terms.reduce((s, t) => s + (e.nh.includes(t) ? 3 : 0), 0) + (e.nh.startsWith(query) ? 2 : 0), e] as const)
          .sort((a, b) => b[0] - a[0])
          .slice(0, 25)
          .map(([, e]) => e);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setSel((s) => Math.max(0, Math.min(hits.length - 1, s + (e.key === "ArrowDown" ? 1 : -1))));
    } else if (e.key === "Enter" && hits[Math.max(sel, 0)]) {
      window.location.href = hits[Math.max(sel, 0)].u;
    } else if (e.key === "Escape") {
      setOpen(false);
      input.current?.blur();
    }
  };

  return (
    <div className="search-box" ref={box}>
      <input
        ref={input}
        type="search"
        placeholder="Buscar en todos los handbooks: RAG, Saga, Zero Trust, CQRS…"
        autoComplete="off"
        aria-label="Buscar en todos los handbooks"
        value={q}
        onFocus={() => {
          load();
          setOpen(true);
        }}
        onChange={(e) => {
          load();
          setQ(e.target.value);
          setSel(-1);
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
      />
      <div className={`results${open && query.length >= 2 ? " show" : ""}`} role="listbox">
        {failed ? (
          <div className="empty">No se pudo cargar el índice de búsqueda.</div>
        ) : !data ? (
          <div className="empty">Cargando índice…</div>
        ) : hits.length ? (
          hits.map((e, i) => (
            <a key={e.u} href={e.u} className={i === sel ? "sel" : undefined} role="option" aria-selected={i === sel}>
              <span className="r-path">
                {e.b} › {e.c}
              </span>
              <span className="r-head">{highlight(e.h, terms)}</span>
              <span className="r-text">{e.t}</span>
            </a>
          ))
        ) : (
          <div className="empty">Sin resultados. Prueba con otro término.</div>
        )}
      </div>
    </div>
  );
}
