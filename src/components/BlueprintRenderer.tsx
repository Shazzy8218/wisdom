import React, { useState } from "react";
import { motion } from "framer-motion";
import { Check, Circle, ArrowRight, TrendingUp, GitBranch, Table2, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface BlueprintRendererProps {
  content: string;
  aggressiveMode: boolean;
}

interface RoadmapStep {
  text: string;
  checked: boolean;
}

interface TableRow {
  cells: string[];
}

// Detect content type from AI response
function detectContentType(content: string): "roadmap" | "logic-flow" | "revenue-table" | "text" {
  const lower = content.toLowerCase();
  // Check for table patterns (markdown tables)
  if ((content.match(/\|/g) || []).length > 6 && content.includes("---")) return "revenue-table";
  // Check for numbered step patterns or roadmap keywords
  if (/(?:step\s*\d|phase\s*\d|stage\s*\d|\d+\.\s+\*\*)/i.test(content) && 
      (lower.includes("plan") || lower.includes("roadmap") || lower.includes("step") || lower.includes("phase"))) return "roadmap";
  // Check for decision/strategy patterns
  if (lower.includes("if ") && lower.includes("then") || lower.includes("option a") || lower.includes("decision") || lower.includes("strategy")) return "logic-flow";
  return "text";
}

function parseRoadmapSteps(content: string): RoadmapStep[] {
  const lines = content.split("\n");
  const steps: RoadmapStep[] = [];
  for (const line of lines) {
    const match = line.match(/^(?:\d+[\.\)]\s*|\-\s*|\*\s*)?\*?\*?(.+?)\*?\*?\s*$/);
    if (match && match[1].trim().length > 3 && !line.startsWith("#") && !line.startsWith("|") && !line.startsWith("---")) {
      steps.push({ text: match[1].trim().replace(/^\*\*|\*\*$/g, ""), checked: false });
    }
  }
  return steps.slice(0, 12);
}

function parseTable(content: string): { headers: string[]; rows: TableRow[] } {
  const lines = content.split("\n").filter(l => l.includes("|"));
  if (lines.length < 2) return { headers: [], rows: [] };
  const parse = (line: string) => line.split("|").map(c => c.trim()).filter(Boolean);
  const headers = parse(lines[0]);
  const rows = lines.slice(2).map(l => ({ cells: parse(l) })).filter(r => r.cells.length > 0);
  return { headers, rows };
}

function parseLogicNodes(content: string): { label: string; type: "condition" | "action" }[] {
  const nodes: { label: string; type: "condition" | "action" }[] = [];
  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.replace(/^[\-\*\d\.\)\s]+/, "").trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("|")) continue;
    if (/^if |^when |^option |^choice /i.test(trimmed)) {
      nodes.push({ label: trimmed, type: "condition" });
    } else if (trimmed.length > 5) {
      nodes.push({ label: trimmed, type: "action" });
    }
  }
  return nodes.slice(0, 10);
}

export default function BlueprintRenderer({ content, aggressiveMode }: BlueprintRendererProps) {
  const type = detectContentType(content);
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());

  const toggleStep = (i: number) => {
    setCheckedSteps(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const accentClass = aggressiveMode ? "text-accent-red" : "text-primary";
  const borderAccent = aggressiveMode ? "border-accent-red/20" : "border-primary/20";
  const bgAccent = aggressiveMode ? "bg-accent-red/5" : "bg-primary/5";

  if (type === "roadmap") {
    const steps = parseRoadmapSteps(content);
    if (steps.length < 2) return <MarkdownBlock content={content} />;
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className={`h-4 w-4 ${accentClass}`} />
          <span className="section-label">{aggressiveMode ? "AGGRESSIVE ROADMAP" : "STRATEGIC ROADMAP"}</span>
        </div>
        {steps.map((step, i) => (
          <motion.button key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }} onClick={() => toggleStep(i)}
            className={`w-full flex items-start gap-3 p-3 rounded-lg border transition-all text-left ${
              checkedSteps.has(i) ? `${bgAccent} ${borderAccent}` : "border-border hover:border-muted-foreground/20"
            }`}>
            <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all ${
              checkedSteps.has(i) ? `${borderAccent} ${bgAccent}` : "border-muted-foreground/30"
            }`}>
              {checkedSteps.has(i) && <Check className={`h-3 w-3 ${accentClass}`} />}
            </div>
            <div className="flex-1 min-w-0">
              <span className={`text-sm font-mono ${checkedSteps.has(i) ? "line-through text-muted-foreground" : "text-foreground"}`}>
                {step.text}
              </span>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground shrink-0">
              {String(i + 1).padStart(2, "0")}
            </span>
          </motion.button>
        ))}
        <div className="mt-2 text-[10px] font-mono text-muted-foreground text-right">
          {checkedSteps.size}/{steps.length} COMPLETE
        </div>
      </motion.div>
    );
  }

  if (type === "revenue-table") {
    const { headers, rows } = parseTable(content);
    if (headers.length === 0) return <MarkdownBlock content={content} />;
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <Table2 className={`h-4 w-4 ${accentClass}`} />
          <span className="section-label">{aggressiveMode ? "AGGRESSIVE PROJECTION" : "REVENUE PROJECTION"}</span>
        </div>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm font-mono">
            <thead>
              <tr className={`${bgAccent} border-b ${borderAccent}`}>
                {headers.map((h, i) => (
                  <th key={i} className={`px-3 py-2 text-left text-[10px] uppercase tracking-wider ${accentClass}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-surface-2 transition-colors">
                  {row.cells.map((cell, j) => (
                    <td key={j} className="px-3 py-2 text-foreground/80">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    );
  }

  if (type === "logic-flow") {
    const nodes = parseLogicNodes(content);
    if (nodes.length < 2) return <MarkdownBlock content={content} />;
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
        <div className="flex items-center gap-2 mb-3">
          <GitBranch className={`h-4 w-4 ${accentClass}`} />
          <span className="section-label">{aggressiveMode ? "KILL/SCALE DECISION TREE" : "LOGIC FLOW"}</span>
        </div>
        {nodes.map((node, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}>
            <div className={`flex items-start gap-2 p-3 rounded-lg border ${
              node.type === "condition" ? `${borderAccent} ${bgAccent}` : "border-border"
            }`}>
              {node.type === "condition" ? (
                <GitBranch className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${accentClass}`} />
              ) : (
                <ArrowRight className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
              )}
              <span className="text-sm font-mono text-foreground/90">{node.label}</span>
            </div>
            {i < nodes.length - 1 && (
              <div className="flex justify-center py-0.5">
                <div className="w-px h-3 bg-border" />
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>
    );
  }

  return <MarkdownBlock content={content} />;
}

import React from "react";

const MarkdownBlock = React.forwardRef<HTMLDivElement, { content: string }>(({ content }, ref) => {
  return (
    <div ref={ref} className="prose prose-invert prose-sm max-w-none font-mono text-sm leading-relaxed
      [&_p]:my-1.5 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5
      [&_h1]:text-base [&_h1]:text-primary [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2
      [&_h2]:text-sm [&_h2]:text-primary [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1.5
      [&_h3]:text-sm [&_h3]:text-foreground [&_h3]:font-medium
      [&_code]:bg-surface-2 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-accent-gold
      [&_pre]:bg-surface-2 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-border
      [&_strong]:text-foreground
      [&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
});
MarkdownBlock.displayName = "MarkdownBlock";
