import Link from "next/link";
import Topbar from "@/components/Topbar";
import Search from "@/components/Search";
import { BookGrid, Paths } from "@/components/CollectionBlocks";
import { getCollections, getSite } from "@/lib/content";

export default function Home() {
  const site = getSite();
  const collections = getCollections();
  const single = collections.length === 1;
  return (
    <>
      <Topbar />
      <main className="home">
        <section className="home-hero">
          <div className="eyebrow">Knowledge hub · {collections.length} temática{collections.length === 1 ? "" : "s"}</div>
          <h1>
            Handbooks personales para <span>aprender y decidir mejor</span>
          </h1>
          <p>{site.description}</p>
          <Search />
        </section>

        {collections.map((col) => (
          <section className="collection" key={col.id} id={col.id}>
            <div className="section-head collection-head">
              <div>
                <h2>{col.title}</h2>
                <p>{col.description}</p>
              </div>
              {!single && <Link href={col.href}>Ver temática →</Link>}
            </div>
            <BookGrid collection={col} />
            <Paths collection={col} />
          </section>
        ))}

        <footer className="home-foot">
          Revisado {site.revised} · Contenido en <code>content/</code>, una carpeta por temática. Funciona sin conexión una vez instalado.
        </footer>
      </main>
    </>
  );
}
