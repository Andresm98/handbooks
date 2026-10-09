import Link from "next/link";
import Topbar from "@/components/Topbar";

export default function NotFound() {
  return (
    <>
      <Topbar />
      <main className="home">
        <section className="home-hero empty-state">
          <div className="eyebrow">404</div>
          <h1>Esta página no existe</h1>
          <p>Puede que el handbook haya cambiado de temática o de nombre.</p>
          <p style={{ marginTop: "1.5rem" }}>
            <Link href="/">Volver al inicio →</Link>
          </p>
        </section>
      </main>
    </>
  );
}
