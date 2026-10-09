"use client";

import { useEffect } from "react";

const store = {
  get<T>(k: string, d: T): T {
    try {
      const v = localStorage.getItem(k);
      return v === null ? d : (JSON.parse(v) as T);
    } catch {
      return d;
    }
  },
  set(k: string, v: unknown) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {
      /* sin almacenamiento */
    }
  },
};

const normalize = (s: string | null) =>
  (s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/**
 * Comportamiento interactivo de una página de handbook. El HTML llega
 * renderizado desde el servidor; este componente solo añade interacción:
 * índice activo, filtro, menú móvil, capítulos dominados, copiar código e impresión.
 */
export default function HandbookClient({ storageKey }: { storageKey: string }) {
  useEffect(() => {
    const ac = new AbortController();
    const { signal } = ac;
    const body = document.body;

    /* ---------- Menú móvil ---------- */
    const menuBtn = document.getElementById("menuBtn");
    const scrim = document.getElementById("scrim");
    const closeNav = () => {
      body.classList.remove("nav-open");
      menuBtn?.setAttribute("aria-expanded", "false");
    };
    menuBtn?.addEventListener("click", () => {
      const open = body.classList.toggle("nav-open");
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    }, { signal });
    scrim?.addEventListener("click", closeNav, { signal });
    document.querySelectorAll(".sidebar a").forEach((a) => a.addEventListener("click", closeNav, { signal }));

    /* ---------- Índice activo y progreso ---------- */
    const chapters = Array.from(document.querySelectorAll<HTMLElement>("section.chapter"));
    const tocByCh: Record<string, HTMLElement> = {};
    document.querySelectorAll<HTMLElement>(".toc-ch").forEach((el) => (tocByCh[el.dataset.ch!] = el));
    const subLinks: Record<string, HTMLElement> = {};
    document.querySelectorAll<HTMLAnchorElement>(".toc-sub").forEach((a) => (subLinks[a.getAttribute("href")!.slice(1)] = a));
    const heads = Array.from(document.querySelectorAll<HTMLElement>("section.chapter h3[id]"));
    const sidebar = document.getElementById("sidebar");
    let activeCh: string | null = null;
    let activeSub: string | null = null;

    const setActive = () => {
      const y = window.scrollY + 120;
      let ch: HTMLElement | null = null;
      for (const c of chapters) {
        if (c.offsetTop <= y) ch = c;
        else break;
      }
      const id = ch?.id ?? null;
      if (id !== activeCh) {
        if (activeCh && tocByCh[activeCh]) {
          tocByCh[activeCh].classList.remove("open");
          tocByCh[activeCh].querySelector(".toc-link")?.classList.remove("active");
        }
        if (id && tocByCh[id]) {
          tocByCh[id].classList.add("open");
          const link = tocByCh[id].querySelector<HTMLElement>(".toc-link")!;
          link.classList.add("active");
          if (sidebar && !body.classList.contains("nav-open")) {
            const r = link.getBoundingClientRect();
            const sr = sidebar.getBoundingClientRect();
            if (r.top < sr.top + 40 || r.bottom > sr.bottom - 40) sidebar.scrollTop += r.top - sr.top - sr.height / 3;
          }
        }
        activeCh = id;
      }
      let sub: HTMLElement | null = null;
      for (const h of heads) {
        if (h.offsetTop <= y) sub = h;
        else break;
      }
      const sid = sub && sub.closest("section.chapter") === ch ? sub.id : null;
      if (sid !== activeSub) {
        if (activeSub) subLinks[activeSub]?.classList.remove("active");
        if (sid) subLinks[sid]?.classList.add("active");
        activeSub = sid;
      }
      const bar = document.getElementById("progressBar");
      if (bar) {
        const h = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = `${h > 0 ? Math.min(100, (window.scrollY / h) * 100) : 0}%`;
      }
      document.getElementById("backToTop")?.classList.toggle("show", window.scrollY > 900);
    };
    let ticking = false;
    window.addEventListener("scroll", () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setActive();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true, signal });
    window.addEventListener("resize", setActive, { signal });
    setActive();
    document.getElementById("backToTop")?.addEventListener("click", () => window.scrollTo({ top: 0 }), { signal });

    /* ---------- Filtro del índice ---------- */
    const filter = document.getElementById("tocFilter") as HTMLInputElement | null;
    if (filter) {
      filter.addEventListener("input", () => {
        const q = normalize(filter.value);
        document.querySelectorAll<HTMLElement>(".toc-ch").forEach((ch) => {
          const chMatch = normalize(ch.querySelector(".toc-link")!.textContent).includes(q);
          let anySub = false;
          ch.querySelectorAll(".toc-sub").forEach((s) => {
            const m = !q || chMatch || normalize(s.textContent).includes(q);
            s.classList.toggle("toc-hidden", !m);
            if (m && q) anySub = true;
          });
          ch.classList.toggle("toc-hidden", !!q && !chMatch && !anySub);
          ch.classList.toggle("open", (!!q && (anySub || chMatch)) || ch.dataset.ch === activeCh);
        });
        document.querySelectorAll(".toc-group").forEach((g) => g.classList.toggle("toc-hidden", !g.querySelector(".toc-ch:not(.toc-hidden)")));
      }, { signal });
      document.addEventListener("keydown", (e) => {
        const tag = (document.activeElement as HTMLElement | null)?.tagName;
        if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") {
          e.preventDefault();
          body.classList.add("nav-open");
          filter.focus();
        }
        if (e.key === "Escape") {
          filter.blur();
          closeNav();
        }
      }, { signal });
    }

    /* ---------- Capítulos dominados ---------- */
    const doneKey = `devbook.done.${storageKey}`;
    const done = store.get<Record<string, boolean>>(doneKey, {});
    const paintDone = (id: string) => {
      const btn = document.querySelector<HTMLButtonElement>(`.mark-done[data-ch="${CSS.escape(id)}"]`);
      const on = !!done[id];
      if (btn) {
        btn.setAttribute("aria-pressed", on ? "true" : "false");
        btn.textContent = on ? "✓ Dominado" : "Marcar como dominado";
      }
      const t = tocByCh[id];
      if (t) {
        let mark = t.querySelector(".done");
        if (on && !mark) {
          mark = document.createElement("span");
          mark.className = "done";
          mark.textContent = "✓";
          t.querySelector(".toc-link")!.appendChild(mark);
        }
        if (!on && mark) mark.remove();
      }
    };
    const paintCount = () => {
      const el = document.getElementById("doneCount");
      if (el) el.textContent = `${Object.keys(done).filter((k) => done[k] && tocByCh[k]).length} / ${chapters.length}`;
    };
    document.querySelectorAll<HTMLButtonElement>(".mark-done").forEach((btn) => {
      const id = btn.dataset.ch!;
      paintDone(id);
      btn.addEventListener("click", () => {
        if (done[id]) delete done[id];
        else done[id] = true;
        store.set(doneKey, done);
        paintDone(id);
        paintCount();
      }, { signal });
    });
    paintCount();

    /* ---------- Copiar código ---------- */
    const added: HTMLElement[] = [];
    document.querySelectorAll<HTMLPreElement>(".content pre").forEach((pre) => {
      if (pre.closest(".diagram") || pre.querySelector(".copy-btn")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "copy-btn";
      btn.textContent = "copiar";
      btn.addEventListener("click", () => {
        const clone = pre.cloneNode(true) as HTMLElement;
        clone.querySelectorAll(".copy-btn, .lang-label").forEach((n) => n.remove());
        const ok = () => {
          btn.textContent = "copiado";
          setTimeout(() => (btn.textContent = "copiar"), 1400);
        };
        navigator.clipboard?.writeText(clone.textContent!.replace(/\s+$/, "")).then(ok, () => {});
      });
      pre.appendChild(btn);
      added.push(btn);
    });

    /* ---------- Impresión y anclas dentro de plegables ---------- */
    window.addEventListener("beforeprint", () => {
      document.querySelectorAll("details").forEach((d) => {
        if (!d.open) {
          d.setAttribute("data-print-open", "");
          d.open = true;
        }
      });
    }, { signal });
    window.addEventListener("afterprint", () => {
      document.querySelectorAll<HTMLDetailsElement>("details[data-print-open]").forEach((d) => {
        d.open = false;
        d.removeAttribute("data-print-open");
      });
    }, { signal });
    const openTarget = () => {
      if (!location.hash) return;
      const el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      let d = el?.closest("details") ?? null;
      while (d) {
        d.open = true;
        d = d.parentElement?.closest("details") ?? null;
      }
    };
    window.addEventListener("hashchange", openTarget, { signal });
    openTarget();

    return () => {
      ac.abort();
      added.forEach((b) => b.remove());
      body.classList.remove("nav-open");
    };
  }, [storageKey]);

  return null;
}
