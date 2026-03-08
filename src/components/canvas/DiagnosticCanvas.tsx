import { parseMarkdownSections } from "@/lib/canvas-parser";

export default function DiagnosticCanvas({ content }: { content: string }) {
  const sections = parseMarkdownSections(content);

  if (sections.length === 0) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="rounded-xl bg-surface-2 h-16 w-full" />
        <div className="rounded-xl bg-surface-2 h-16 w-full" />
      </div>
    );
  }

  const icons = ["🔍", "⚠️", "✅", "💡", "🔧"];

  return (
    <div className="space-y-2">
      {sections.map((s, i) => (
        <div key={i} className="rounded-xl bg-surface-2 p-3 border border-border/50">
          <p className="text-caption font-semibold text-foreground flex items-center gap-2">
            <span>{icons[i % icons.length]}</span> {s.title}
          </p>
          {s.body && <p className="text-micro text-muted-foreground mt-1 leading-relaxed">{s.body}</p>}
        </div>
      ))}
    </div>
  );
}
