import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Topbar from "@/components/Topbar";
import { BookGrid, Paths } from "@/components/CollectionBlocks";
import { getCollection, getCollections } from "@/lib/content";

export const dynamicParams = false;

export function generateStaticParams() {
  return getCollections().map((c) => ({ collection: c.id }));
}

type Params = { params: Promise<{ collection: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const col = getCollection((await params).collection);
  return col ? { title: col.title, description: col.description } : {};
}

export default async function CollectionPage({ params }: Params) {
  const col = getCollection((await params).collection);
  if (!col) notFound();
  return (
    <>
      <Topbar crumbs={[{ label: col.title }]} />
      <main className="home">
        <section className="home-hero">
          <div className="eyebrow">Temática · {col.books.length} handbooks</div>
          <h1>{col.title}</h1>
          <p>{col.description}</p>
        </section>
        <div className="section-head">
          <h2>Handbooks</h2>
          <p>Cada tema vive en un solo lugar; los handbooks se enlazan entre sí.</p>
        </div>
        <BookGrid collection={col} />
        <Paths collection={col} />
      </main>
    </>
  );
}
