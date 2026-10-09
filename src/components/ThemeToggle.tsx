"use client";

function currentTheme(): "light" | "dark" {
  const t = document.documentElement.getAttribute("data-theme");
  if (t === "light" || t === "dark") return t;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function ThemeToggle() {
  const toggle = () => {
    const next = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("devbook.theme", JSON.stringify(next));
    } catch {
      /* sin almacenamiento: el cambio dura hasta recargar */
    }
  };
  return (
    <button type="button" className="icon-btn" onClick={toggle} aria-label="Cambiar tema claro/oscuro">
      ◐
    </button>
  );
}
