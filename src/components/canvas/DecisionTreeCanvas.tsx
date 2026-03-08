import { parseMarkdownSections } from "@/lib/canvas-parser";

export default function DecisionTreeCanvas({ content }: { content: string }) {
  const nodes = parseMarkdownSections(content);

  if (nodes.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 animate-pulse">
        <div className="rounded-xl bg-surface-2 h-12 w-48" />
        <div className="w-px h-4 bg-border" />
        <div className="flex gap-4">
          <div className="rounded-xl bg-surface-2 h-12 w-32" />
          <div className="rounded-xl bg-surface-2 h-12 w-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1">
      {nodes.map((node, i) => (
        <div key={i} className="flex flex-col items-center">
          <div className={`rounded-xl p-3 border text-center max-w-[280px] ${
            i === 0 ? "bg-primary/10 border-primary/30" : "bg-surface-2 border-border/50"
          }`}>
            <p className="text-caption font-semibold text-foreground">{node.title}</p>
            {node.body && <p className="text-micro text-muted-foreground mt-1">{node.body}</p>}
          </div>
          {i < nodes.length - 1 && (
            <div className="w-px h-4 bg-border" />
          )}
        </div>
      ))}
    </div>
  );
}
