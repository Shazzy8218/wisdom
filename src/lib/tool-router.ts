// Central Tool Router — detects user intent and routes to the correct Owl tool

export type OwlTool =
  | "chat"        // Default text chat
  | "imagegen"    // Image generation
  | "vision"      // Image analysis
  | "web"         // Web search / live info (Perplexity)
  | "firecrawl"   // Website scraping / analysis (Firecrawl)
  | "strategic"   // Combined Perplexity + Firecrawl analysis
  | "chart"       // Chart generation
  | "docgen"      // Document generation (PDF, DOCX, CSV, Slides)
  | "calculator"  // Quick math
  | "reminder"    // Reminders
  | "localtime";  // Local device time/date

export type StrategicType = "market-heat" | "competitor-autopsy" | "website-audit" | "opportunity-scan";

export interface RouteResult {
  tool: OwlTool;
  subType?: string;
  strategicType?: StrategicType;
  confidence: number;
  extractedUrl?: string;
}

// Extract URLs from text
function extractUrl(text: string): string | undefined {
  const urlMatch = text.match(/https?:\/\/[^\s,)]+/i);
  if (urlMatch) return urlMatch[0];
  // Detect bare domains
  const domainMatch = text.match(/\b([a-zA-Z0-9-]+\.(?:com|io|co|net|org|dev|app|ai|xyz|me|info|biz|store|shop|agency|design|tech|site|online|page|pro|services|solutions|studio|work|world|cloud|digital|marketing|business)(?:\/[^\s,)]*)?)\b/i);
  if (domainMatch) return `https://${domainMatch[1]}`;
  return undefined;
}

const patterns: { tool: OwlTool; subType?: string; strategicType?: StrategicType; regex: RegExp; weight: number }[] = [
  // === STRATEGIC ANALYSIS (combined tools) ===
  // Market Heat Check
  { tool: "strategic", strategicType: "market-heat", regex: /\b(is|are)\b.*\b(getting|becoming)\b.*\b(crowded|saturated|competitive|oversaturated)\b/i, weight: 0.97 },
  { tool: "strategic", strategicType: "market-heat", regex: /\b(market|niche|space|industry)\b.*\b(heat|saturated|crowded|competitive|opportunity|viable|dead|alive|growing|shrinking)\b/i, weight: 0.95 },
  { tool: "strategic", strategicType: "market-heat", regex: /\b(validate|viability|viable)\b.*\b(idea|business|niche|market|concept)\b/i, weight: 0.93 },
  { tool: "strategic", strategicType: "market-heat", regex: /\b(how crowded|how competitive|how saturated)\b/i, weight: 0.95 },

  // Competitor Autopsy
  { tool: "strategic", strategicType: "competitor-autopsy", regex: /\b(competitor|competition)\b.*\b(analysis|autopsy|teardown|breakdown|audit|doing|compare|inspect)\b/i, weight: 0.96 },
  { tool: "strategic", strategicType: "competitor-autopsy", regex: /\b(compare|analyze|inspect|audit|teardown|break down)\b.*\b(competitor|competition|niche|against|versus|vs)\b/i, weight: 0.94 },
  { tool: "strategic", strategicType: "competitor-autopsy", regex: /\b(what are|who are)\b.*\b(competitors|competing|doing in)\b/i, weight: 0.93 },

  // Website Revenue Audit
  { tool: "strategic", strategicType: "website-audit", regex: /\b(audit|analyze|review|inspect|teardown|break down|critique|fix|improve)\b.*\b(website|site|landing page|homepage|page|web page|conversions?)\b/i, weight: 0.96 },
  { tool: "strategic", strategicType: "website-audit", regex: /\b(website|site|landing page|page)\b.*\b(audit|analysis|teardown|review|improve|fix|optimize|conversion|revenue)\b/i, weight: 0.94 },
  { tool: "strategic", strategicType: "website-audit", regex: /\b(revenue leaks?|conversion rate|why.*(not converting|not selling|low sales))\b/i, weight: 0.93 },

  // Live Opportunity Scanner
  { tool: "strategic", strategicType: "opportunity-scan", regex: /\b(what|which)\b.*\b(opportunity|opportunities|niche|niches)\b.*\b(should|opening|emerging|heating|growing|pursue|go after)\b/i, weight: 0.95 },
  { tool: "strategic", strategicType: "opportunity-scan", regex: /\b(opportunity|niche)\b.*\b(scan|scanner|finder|detect|emerging|opening up|heating up)\b/i, weight: 0.93 },
  { tool: "strategic", strategicType: "opportunity-scan", regex: /\b(what.*(service|business|product|side hustle).*heating up|emerging trend|untapped market)\b/i, weight: 0.93 },

  // === FIRECRAWL (website scraping) ===
  { tool: "firecrawl", regex: /\b(scrape|crawl|extract|pull)\b.*\b(website|site|page|url|content|data from)\b/i, weight: 0.95 },
  { tool: "firecrawl", regex: /\b(summarize|read|digest|analyze)\b.*\b(this (?:website|site|page|url|link)|(?:the )?(?:website|site|page) at)\b/i, weight: 0.93 },
  { tool: "firecrawl", regex: /\b(what('s| is) on|what does)\b.*\b(this (?:website|site|page)|(?:their|the) (?:website|site|page))\b/i, weight: 0.9 },
  { tool: "firecrawl", regex: /\b(pricing|offer|headline|CTA|testimonial|FAQ)\b.*\b(on|from|of)\b.*\b(this|their|the)\b.*\b(site|page|website)\b/i, weight: 0.92 },
  { tool: "firecrawl", regex: /\b(landing page|homepage)\b.*\b(analysis|breakdown|review|look at|check)\b/i, weight: 0.9 },

  // Image generation
  { tool: "imagegen", regex: /\b(generate|create|make|draw|design|produce|render|build)\b.*\b(image|picture|logo|icon|diagram|illustration|art|graphic|mockup|thumbnail|flowchart|visual|poster|banner|concept|wireframe)\b/i, weight: 0.95 },
  { tool: "imagegen", regex: /\b(image|picture|logo|icon|diagram|illustration|mockup|flowchart)\b.*\b(for|of|about|showing)\b/i, weight: 0.9 },
  { tool: "imagegen", regex: /^(generate|create|make|draw|design)\s/i, weight: 0.7 },

  // Document generation
  { tool: "docgen", subType: "csv", regex: /\b(create|generate|make|export|build)\b.*\b(csv|spreadsheet|excel|table data)\b/i, weight: 0.95 },
  { tool: "docgen", subType: "pdf", regex: /\b(create|generate|make|export|build)\b.*\b(pdf|document|report|paper)\b/i, weight: 0.9 },
  { tool: "docgen", subType: "docx", regex: /\b(create|generate|make|export|build)\b.*\b(docx?|word doc)\b/i, weight: 0.95 },
  { tool: "docgen", subType: "slides", regex: /\b(create|generate|make|build)\b.*\b(slide|deck|presentation|pptx?|powerpoint)\b/i, weight: 0.95 },

  // Web search / live info (Perplexity)
  { tool: "web", subType: "weather", regex: /\b(weather|temperature|forecast|rain|snow|humidity)\b.*\b(in|at|for|today|tomorrow|this week)\b/i, weight: 0.95 },
  { tool: "web", subType: "weather", regex: /\b(is it|will it)\b.*\b(rain|snow|cold|hot|warm)\b/i, weight: 0.9 },
  { tool: "web", subType: "finance", regex: /\b(price|stock|crypto|bitcoin|btc|eth|ethereum|nasdaq|s&p|market|share price|trading)\b/i, weight: 0.9 },
  { tool: "web", subType: "finance", regex: /\b(how much is|what is the price)\b/i, weight: 0.85 },
  { tool: "web", subType: "sports", regex: /\b(score|standings|game|match|nba|nfl|mlb|nhl|premier league|champions league|world cup|tournament)\b/i, weight: 0.85 },
  { tool: "web", subType: "news", regex: /\b(latest|breaking|recent|current|today's|this week's)\b.*\b(news|update|headline|event|development)\b/i, weight: 0.9 },
  { tool: "web", subType: "search", regex: /\b(search|look up|find|google|browse|what is happening|current)\b/i, weight: 0.6 },
  // Local time/date
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
  const url = extractUrl(text);

  for (const p of patterns) {
    if (p.regex.test(text) && p.weight > best.confidence) {
      // Don't route question-style queries to imagegen
      if (p.tool === "imagegen" && /^(what|how|why|can you|do you|are you|is)\b/i.test(text) && !/\b(generate|create|make|draw|design)\b/i.test(text)) {
        continue;
      }
      best = { tool: p.tool, subType: p.subType, strategicType: p.strategicType, confidence: p.weight, extractedUrl: url };
    }
  }

  // If a URL is present and we haven't matched a strategic/firecrawl pattern, check if it's a website analysis request
  if (url && best.tool === "chat") {
    // Any message with a URL that mentions analysis words
    if (/\b(audit|analyze|review|check|look at|inspect|improve|fix|teardown|break down|what do you think|feedback|critique)\b/i.test(text)) {
      best = { tool: "strategic", strategicType: "website-audit", confidence: 0.92, extractedUrl: url };
    } else if (/\b(scrape|crawl|extract|summarize|read|content|pull)\b/i.test(text)) {
      best = { tool: "firecrawl", confidence: 0.92, extractedUrl: url };
    }
  }

  // If strategic type needs a URL for website-audit but none found, it may still be valid (niche-based)
  if (best.extractedUrl === undefined && url) {
    best.extractedUrl = url;
  }

  return best;
}

// Tool badge labels
export const TOOL_LABELS: Record<OwlTool, { icon: string; label: string }> = {
  chat: { icon: "💬", label: "Chat" },
  imagegen: { icon: "🎨", label: "Image Gen" },
  vision: { icon: "👁️", label: "Vision" },
  web: { icon: "🌐", label: "Perplexity" },
  firecrawl: { icon: "🔥", label: "Firecrawl" },
  strategic: { icon: "🧠", label: "Strategic Analysis" },
  chart: { icon: "📊", label: "Chart" },
  docgen: { icon: "📄", label: "Doc Gen" },
  calculator: { icon: "🧮", label: "Calculator" },
  reminder: { icon: "⏰", label: "Reminder" },
  localtime: { icon: "🕐", label: "Local Time" },
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

export const STRATEGIC_LABELS: Record<StrategicType, { icon: string; label: string }> = {
  "market-heat": { icon: "🔥", label: "Market Heat Check" },
  "competitor-autopsy": { icon: "🔬", label: "Competitor Autopsy" },
  "website-audit": { icon: "🏥", label: "Website Revenue Audit" },
  "opportunity-scan": { icon: "🎯", label: "Opportunity Scanner" },
};
