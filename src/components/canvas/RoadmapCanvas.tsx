import { parseMarkdownSections } from "@/lib/canvas-parser";

export default function RoadmapCanvas({ content }: { content: string }) {
  const steps = parseMarkdownSections(content);
  
  return (
    <div className="space-y-3">
      {steps.length === 0 ? (
        <div className="flex gap-3 animate-pulse">
          {[1,2,3].map(i => (
            <div key={i} className="flex-1 rounded-xl bg-surface-2 h-20" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="flex flex-col items-center">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-micro font-bold">
                  {i + 1}
                </div>
                {i < steps.length - 1 && <div className="w-px h-full min-h-[16px] bg-border mt-1" />}
              </div>
              <div className="flex-1 rounded-xl bg-surface-2 p-3 mb-1">
                <p className="text-caption font-semibold text-foreground">{step.title}</p>
                {step.body && <p className="text-micro text-muted-foreground mt-1 leading-relaxed">{step.body}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
