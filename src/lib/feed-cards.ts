// Feed card types and categories for the Wisdom Feed

export type FeedCardType =
  | "tax-hack" | "legal-advantage" | "benefit-claim" | "government-program"
  | "phenomenon-brief" | "systemic-context" | "reality-check" | "deep-pattern"
  | "money-momentum" | "leverage-point" | "pitfall-alert" | "rich-mindset" | "ethical-compass";

export type FeedCategory = "survival" | "phenomenon" | "wealth";

export const FEED_CATEGORIES: Record<FeedCategory, { label: string; icon: string; description: string }> = {
  survival: { label: "Survival Guide", icon: "🛡️", description: "Tax strategies, legal advantages & government benefits" },
  phenomenon: { label: "Phenomenon Decoder", icon: "🔮", description: "Strategic pattern recognition" },
  wealth: { label: "Wealth Engine", icon: "💎", description: "Financial intelligence & ethical frameworks" },
};

export function getCardCategory(type: FeedCardType): FeedCategory {
  if (["money-momentum", "leverage-point", "pitfall-alert", "rich-mindset", "ethical-compass"].includes(type)) return "wealth";
  if (["tax-hack", "legal-advantage", "benefit-claim", "government-program"].includes(type)) return "survival";
  return "phenomenon";
}

export interface FeedCard {
  id: string;
  type: FeedCardType;
  title: string;
  hook: string;
  content: string;
  visual?: "before-after" | "steps" | "flow" | "chips" | "comparison";
  visualData?: any;
  interaction?: "choice" | "reveal" | "rate";
  options?: string[];
  correctAnswer?: number;
  xp: number;
  tokens: number;
  confidence?: number;
  source?: string;
  shareSnippet?: string;
  tryPrompt?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  urgencyLevel?: "low" | "medium" | "high" | "critical";
  analyticalFlags?: string[];
}

// Card type display config
export const CARD_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  "tax-hack": { label: "Tax Hack", color: "text-emerald-400" },
  "legal-advantage": { label: "Legal Advantage", color: "text-sky-400" },
  "benefit-claim": { label: "Benefit Claim", color: "text-lime-400" },
  "government-program": { label: "Gov Program", color: "text-violet-400" },
  "phenomenon-brief": { label: "Phenomenon", color: "text-amber-400" },
  "systemic-context": { label: "Systemic", color: "text-cyan-400" },
  "reality-check": { label: "Reality Check", color: "text-amber-400" },
  "deep-pattern": { label: "Deep Pattern", color: "text-purple-400" },
  "money-momentum": { label: "Money Momentum", color: "text-green-400" },
  "leverage-point": { label: "Leverage", color: "text-teal-400" },
  "pitfall-alert": { label: "Pitfall Alert", color: "text-red-400" },
  "rich-mindset": { label: "Rich Mindset", color: "text-primary" },
  "ethical-compass": { label: "Ethics", color: "text-amber-400" },
};

// Track seen cards
const SEEN_KEY = "wisdom-feed-seen";

export function getSeenCardIds(): string[] {
  try { return JSON.parse(localStorage.getItem(SEEN_KEY) || "[]"); } catch { return []; }
}

export function markCardSeen(id: string) {
  const seen = getSeenCardIds();
  if (!seen.includes(id)) {
    seen.push(id);
    if (seen.length > 500) seen.splice(0, seen.length - 300);
    localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
  }
}
