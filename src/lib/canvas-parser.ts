// Parse markdown into structured sections for canvas rendering

export interface ParsedSection {
  title: string;
  body: string;
}

/** Extract ## or ### sections from markdown */
export function parseMarkdownSections(md: string): ParsedSection[] {
  const lines = md.split("\n");
  const sections: ParsedSection[] = [];
  let current: ParsedSection | null = null;

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,4}\s+(.+)/);
    if (headingMatch) {
      if (current) sections.push(current);
      current = { title: headingMatch[1].replace(/[*_`]/g, "").trim(), body: "" };
    } else if (current) {
      const cleaned = line.replace(/^[-*]\s+/, "• ").trim();
      if (cleaned) current.body += (current.body ? "\n" : "") + cleaned;
    } else if (line.trim()) {
      // Content before any heading — make it a section
      current = { title: line.replace(/^[-*]\s+/, "").replace(/[*_`#]/g, "").trim(), body: "" };
    }
  }
  if (current) sections.push(current);
  return sections;
}

/** Parse markdown table into headers + rows */
export function parseMarkdownTable(md: string): { headers: string[]; rows: string[][] } {
  const lines = md.split("\n").filter(l => l.includes("|"));
  if (lines.length < 2) {
    // Try to extract from numbered/bulleted list as fallback
    const items = md.split("\n").filter(l => /^\s*[\d\-*]+/.test(l));
    if (items.length > 0) {
      return {
        headers: ["#", "Action", "Details"],
        rows: items.map((item, i) => {
          const clean = item.replace(/^\s*[\d\-*.]+\s*/, "").trim();
          const parts = clean.split(/[:\-–—]\s*/);
          return [String(i + 1), parts[0] || clean, parts.slice(1).join(" ") || ""];
        }),
      };
    }
    return { headers: [], rows: [] };
  }

  const parseRow = (line: string) =>
    line.split("|").map(c => c.trim()).filter(c => c && !c.match(/^[\-:]+$/));

  const headers = parseRow(lines[0]);
  const separatorIdx = lines.findIndex(l => /^\|?\s*[-:]+/.test(l));
  const dataLines = separatorIdx >= 0 ? lines.slice(separatorIdx + 1) : lines.slice(1);
  const rows = dataLines.map(parseRow).filter(r => r.length > 0);

  return { headers, rows };
}

/** Classify user intent from their message */
export type DetectedIntent = "roadmap" | "action-table" | "document" | "diagnostic" | "decision-tree" | "lesson";

export function detectIntent(message: string): DetectedIntent {
  const lower = message.toLowerCase();

  // Business / plan / roadmap
  if (/\b(plan|roadmap|strategy|launch|business|startup|revenue|timeline|kpi|milestone|growth)\b/.test(lower)) return "roadmap";
  
  // Task / action / todo
  if (/\b(task|todo|action|checklist|steps|workflow|list|schedule|deadline|priorities)\b/.test(lower)) return "action-table";
  
  // Decision / choice
  if (/\b(decide|decision|choose|compare|vs|versus|option|trade.?off|should i|pros|cons)\b/.test(lower)) return "decision-tree";
  
  // Troubleshoot / debug / fix
  if (/\b(troubleshoot|debug|diagnose|fix|error|problem|issue|broken|why.+not|doesn.t work)\b/.test(lower)) return "diagnostic";
  
  // Learn / teach / explain
  if (/\b(learn|teach|explain|what is|how does|concept|understand|study|tutorial|lesson)\b/.test(lower)) return "lesson";
  
  // Default: document/writing
  return "document";
}

/** Detect intent from AI response content for canvas rendering */
export function detectResponseIntent(content: string): DetectedIntent {
  // Check for table patterns
  if ((content.match(/\|/g) || []).length > 6) return "action-table";
  
  // Check for numbered steps
  const numberedSteps = (content.match(/^\d+[.)]\s/gm) || []).length;
  if (numberedSteps >= 3) return "roadmap";
  
  // Check for decision markers
  if (/option [ab12]|alternative|versus|compared to/i.test(content)) return "decision-tree";
  
  // Check for diagnostic markers
  if (/root cause|diagnosis|symptom|issue.*found|check.*first/i.test(content)) return "diagnostic";
  
  // Check for lesson markers
  if (/key concept|mental model|example|takeaway|wisdom line/i.test(content)) return "lesson";
  
  return "document";
}
