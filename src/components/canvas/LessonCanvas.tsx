import { parseMarkdownSections } from "@/lib/canvas-parser";

export default function LessonCanvas({ content }: { content: string }) {
  const sections = parseMarkdownSections(content);

  if (sections.length === 0) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="rounded-xl bg-surface-2 h-8 w-2/3" />
        <div className="rounded-xl bg-surface-2 h-20 w-full" />
        <div className="rounded-xl bg-surface-2 h-12 w-full" />
      </div>
    );
  }

  const sectionIcons = ["💡", "🧠", "📌", "⚡", "🎯"];

  return (
    <div className="space-y-3">
      {sections.map((s, i) => (
        <div key={i} className={`rounded-xl p-3 ${i === 0 ? "bg-primary/10 border border-primary/20" : "bg-surface-2"}`}>
          <p className="text-caption font-semibold text-foreground flex items-center gap-2">
            <span>{sectionIcons[i % sectionIcons.length]}</span> {s.title}
          </p>
          {s.body && <p className="text-micro text-muted-foreground mt-1.5 leading-relaxed">{s.body}</p>}
        </div>
      ))}
    </div>
  );
}
