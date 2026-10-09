import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";

/**
 * Componentes disponibles en capítulos .mdx. Generan el mismo marcado que el
 * contenido HTML, así que heredan el sistema de diseño sin estilos nuevos.
 *
 *   <Callout type="tip" label="Regla práctica">Texto…</Callout>
 *   <CardGrid><Card title="RAG" eyebrow="Patrón" accent="blue">…</Card></CardGrid>
 *   <Badge tone="green">Nuevo</Badge>
 *   <Diagram>{`A ──► B`}</Diagram>
 *   <Flow steps={["Consulta", "Retrieval", "LLM"]} highlight={[1]} />
 */
type Tone = "info" | "tip" | "warn" | "danger" | "def" | "axiom";
type Accent = "blue" | "green" | "gold" | "red" | "violet";

function Callout({ type = "info", label, children }: { type?: Tone; label?: string; children: React.ReactNode }) {
  return (
    <div className={`callout ${type}`}>
      {label && <span className="callout-label">{label}</span>}
      {children}
    </div>
  );
}

function CardGrid({ children }: { children: React.ReactNode }) {
  return <div className="card-grid">{children}</div>;
}

function Card({ title, eyebrow, accent, children }: { title: string; eyebrow?: string; accent?: Accent; children: React.ReactNode }) {
  return (
    <div className={`card${accent ? ` accent-${accent}` : ""}`}>
      {eyebrow && <div className="card-num">{eyebrow}</div>}
      <div className="card-title">{title}</div>
      <div className="card-body">{children}</div>
    </div>
  );
}

function Badge({ tone, children }: { tone?: "green" | "blue" | "red" | "gold" | "purple"; children: React.ReactNode }) {
  return <span className={`tag${tone ? ` ${tone}` : ""}`}>{children}</span>;
}

function Diagram({ children }: { children: string }) {
  return <div className="diagram">{children}</div>;
}

function Flow({ steps, highlight = [] }: { steps: string[]; highlight?: number[] }) {
  return (
    <div className="flow">
      {steps.map((s, i) => (
        <span key={s} style={{ display: "contents" }}>
          {i > 0 && <div className="flow-arrow">→</div>}
          <div className={`flow-step${highlight.includes(i) ? " highlight" : ""}`}>{s}</div>
        </span>
      ))}
    </div>
  );
}

const components = { Callout, CardGrid, Card, Badge, Diagram, Flow };

export async function MdxChapter({ source }: { source: string }) {
  const { content } = await compileMDX({
    source,
    components,
    options: {
      // El contenido es propio y versionado: se permiten expresiones en props
      // (steps={[...]}) pero se sigue bloqueando JS peligroso (eval, require…).
      blockJS: false,
      blockDangerousJS: true,
      mdxOptions: { remarkPlugins: [remarkGfm] },
    },
  });
  return <div className="chapter-body">{content}</div>;
}
