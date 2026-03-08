// Central Tool Router — detects user intent and routes to the correct Owl tool

export type OwlTool =
  | "chat"        // Default text chat
  | "imagegen"    // Image generation
  | "vision"      // Image analysis
  | "web"         // Web search / live info
  | "chart"       // Chart generation
  | "docgen"      // Document generation (PDF, DOCX, CSV, Slides)
  | "calculator"  // Quick math
  | "reminder"    // Reminders
  | "localtime";  // Local device time/date

export interface RouteResult {
  tool: OwlTool;
  subType?: string; // e.g. "weather", "finance", "csv", "pdf"
  confidence: number;
}

const patterns: { tool: OwlTool; subType?: string; regex: RegExp; weight: number }[] = [
  // Image generation
  { tool: "imagegen", regex: /\b(generate|create|make|draw|design|produce|render|build)\b.*\b(image|picture|logo|icon|diagram|illustration|art|graphic|mockup|thumbnail|flowchart|visual|poster|banner|concept|wireframe)\b/i, weight: 0.95 },
  { tool: "imagegen", regex: /\b(image|picture|logo|icon|diagram|illustration|mockup|flowchart)\b.*\b(for|of|about|showing)\b/i, weight: 0.9 },
  { tool: "imagegen", regex: /^(generate|create|make|draw|design)\s/i, weight: 0.7 },

  // Document generation
  { tool: "docgen", subType: "csv", regex: /\b(create|generate|make|export|build)\b.*\b(csv|spreadsheet|excel|table data)\b/i, weight: 0.95 },
  { tool: "docgen", subType: "pdf", regex: /\b(create|generate|make|export|build)\b.*\b(pdf|document|report|paper)\b/i, weight: 0.9 },
  { tool: "docgen", subType: "docx", regex: /\b(create|generate|make|export|build)\b.*\b(docx?|word doc)\b/i, weight: 0.95 },
  { tool: "docgen", subType: "slides", regex: /\b(create|generate|make|build)\b.*\b(slide|deck|presentation|pptx?|powerpoint)\b/i, weight: 0.95 },

  // Web search / live info
  { tool: "web", subType: "weather", regex: /\b(weather|temperature|forecast|rain|snow|humidity)\b.*\b(in|at|for|today|tomorrow|this week)\b/i, weight: 0.95 },
  { tool: "web", subType: "weather", regex: /\b(is it|will it)\b.*\b(rain|snow|cold|hot|warm)\b/i, weight: 0.9 },
  { tool: "web", subType: "finance", regex: /\b(price|stock|crypto|bitcoin|btc|eth|ethereum|nasdaq|s&p|market|share price|trading)\b/i, weight: 0.9 },
  { tool: "web", subType: "finance", regex: /\b(how much is|what is the price)\b/i, weight: 0.85 },
  { tool: "web", subType: "sports", regex: /\b(score|standings|game|match|nba|nfl|mlb|nhl|premier league|champions league|world cup|tournament)\b/i, weight: 0.85 },
  { tool: "web", subType: "news", regex: /\b(latest|breaking|recent|current|today's|this week's)\b.*\b(news|update|headline|event|development)\b/i, weight: 0.9 },
  { tool: "web", subType: "search", regex: /\b(search|look up|find|google|browse|what is happening|current)\b/i, weight: 0.6 },
  // Local time/date (handled locally, not web)
  { tool: "localtime", regex: /\b(what time|current time|what's the time|time is it|time for me)\b/i, weight: 0.98 },
  { tool: "localtime", regex: /\b(what('s| is) (the |today'?s? )?date|today'?s? date|what day|what is today)\b/i, weight: 0.98 },
  { tool: "localtime", regex: /\b(what (day|month|year) is it)\b/i, weight: 0.98 },
  { tool: "web", subType: "product", regex: /\b(best|compare|review|buy|purchase|product|recommend)\b.*\b(laptop|phone|camera|tool|software|app|device|headphone|monitor)\b/i, weight: 0.8 },

  // Chart
  { tool: "chart", regex: /\b(chart|graph|plot|visualize|visualization)\b/i, weight: 0.85 },
  { tool: "chart", regex: /\b(show|display)\b.*\b(progress|mastery|stats|data|trend)\b/i, weight: 0.7 },

  // Calculator
  { tool: "calculator", regex: /\b(calculate|compute|math|equation|formula)\b/i, weight: 0.8 },
  { tool: "calculator", regex: /\b\d+\s*[\+\-\*\/\%\^]\s*\d+\b/, weight: 0.9 },
  { tool: "calculator", regex: /\b(what is|how much is)\b\s+\d+/i, weight: 0.6 },

  // Reminders
  { tool: "reminder", regex: /\b(remind|reminder|set.*(alarm|timer)|remind me|don't forget|schedule.*remind)\b/i, weight: 0.9 },
];

export function routeToTool(text: string, hasImage?: boolean, hasFile?: boolean): RouteResult {
  // Explicit overrides
  if (hasImage) return { tool: "vision", confidence: 1.0 };
  if (hasFile) return { tool: "vision", confidence: 0.9 };

  let best: RouteResult = { tool: "chat", confidence: 0.5 };

  for (const p of patterns) {
    if (p.regex.test(text) && p.weight > best.confidence) {
      // Don't route question-style queries to imagegen
      if (p.tool === "imagegen" && /^(what|how|why|can you|do you|are you|is)\b/i.test(text) && !/\b(generate|create|make|draw|design)\b/i.test(text)) {
        continue;
      }
      best = { tool: p.tool, subType: p.subType, confidence: p.weight };
    }
  }

  return best;
}

// Tool badge labels
export const TOOL_LABELS: Record<OwlTool, { icon: string; label: string }> = {
  chat: { icon: "💬", label: "Chat" },
  imagegen: { icon: "🎨", label: "Image Gen" },
  vision: { icon: "👁️", label: "Vision" },
  web: { icon: "🌐", label: "Web" },
  chart: { icon: "📊", label: "Chart" },
  docgen: { icon: "📄", label: "Doc Gen" },
  calculator: { icon: "🧮", label: "Calculator" },
  reminder: { icon: "⏰", label: "Reminder" },
};

export const WEB_SUB_LABELS: Record<string, string> = {
  weather: "🌤️ Weather",
  finance: "💰 Finance",
  sports: "⚽ Sports",
  news: "📰 News",
  time: "🕐 Time",
  search: "🔍 Search",
  product: "🛍️ Products",
};
