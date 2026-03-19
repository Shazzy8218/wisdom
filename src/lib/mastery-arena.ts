// Mastery Arena: Neural Syntax Engine v2.0 - Core Types & Data

export interface ArenaScenario {
  id: string;
  title: string;
  domain: string;
  goal: string;
  complexity: "beginner" | "intermediate" | "advanced" | "grandmaster";
  timeLimit: number;
  description: string;
  variables: string[];
  tags: string[];
  icon: string;
  aiIntervention?: "neutral" | "antagonist" | "active" | "environmental";
  desiredOutcome?: string;
}

export interface DrillDecision {
  id: string;
  timestamp: number;
  timeElapsed: number;
  action: string;
  consequence: string;
  score: number;
  biasDetected?: string;
  criticalNode?: boolean;
  alternativePath?: string;
}

export interface SituationUpdate {
  id: string;
  timestamp: number;
  type: "metric" | "comms" | "event" | "warning" | "intel" | "stakeholder";
  title: string;
  content: string;
  severity: "info" | "caution" | "critical";
  from?: string;
}

export interface CommMessage {
  id: string;
  timestamp: number;
  from: string;
  role: string;
  channel: "email" | "chat" | "call" | "alert";
  subject?: string;
  content: string;
  urgent: boolean;
  requiresResponse: boolean;
}

export interface DrillResult {
  scenarioId: string;
  totalScore: number;
  maxScore: number;
  decisions: DrillDecision[];
  situationLog: SituationUpdate[];
  commsLog: CommMessage[];
  metrics: {
    decisionSpeed: number;
    strategicForesight: number;
    resourceEfficiency: number;
    adaptability: number;
    composure: number;
    communicationClarity: number;
    overallGrade: string;
  };
  biases: string[];
  feedback: string;
  playbook: string[];
  cognitiveArchetype: string;
  archetypeDescription: string;
  counterfactuals: { turn: number; alternative: string; projectedOutcome: string; successRate: number }[];
  passed: boolean;
  timeUsed: number;
}

export const COMPLEXITY_CONFIG = {
  beginner: { label: "Cadet", color: "text-accent-green", turns: 5, timeMult: 1.5, description: "Guided scenarios with clear paths" },
  intermediate: { label: "Operator", color: "text-accent-gold", turns: 7, timeMult: 1, description: "Multi-variable challenges" },
  advanced: { label: "Commander", color: "text-primary", turns: 9, timeMult: 0.75, description: "High-pressure cascading crises" },
  grandmaster: { label: "Grandmaster", color: "text-primary", turns: 12, timeMult: 0.5, description: "Extreme ambiguity & chaos" },
};

export const AI_INTERVENTION_LEVELS = [
  { id: "neutral", label: "Neutral Observer", icon: "👁️", description: "AI provides context but doesn't actively oppose" },
  { id: "environmental", label: "Chaos Engine", icon: "🌪️", description: "Random disruptive events and market shifts" },
  { id: "antagonist", label: "Active Antagonist", icon: "⚔️", description: "AI deliberately counters your strategies" },
  { id: "active", label: "Full Adversary", icon: "🔥", description: "Intelligent opposition adapting to your moves" },
] as const;

export const DOMAINS = [
  { id: "startup", label: "Startup & Venture", icon: "🚀" },
  { id: "finance", label: "Finance & Markets", icon: "📊" },
  { id: "leadership", label: "Leadership & Ops", icon: "👔" },
  { id: "crisis", label: "Crisis Management", icon: "🔥" },
  { id: "legal", label: "Legal & Compliance", icon: "⚖️" },
  { id: "marketing", label: "Marketing & Growth", icon: "📈" },
  { id: "tech", label: "Tech & Engineering", icon: "⚙️" },
  { id: "healthcare", label: "Healthcare & Safety", icon: "🏥" },
  { id: "geopolitics", label: "Geopolitics & Defense", icon: "🌍" },
  { id: "cybersecurity", label: "Cybersecurity", icon: "🛡️" },
];

export const CURATED_SCENARIOS: ArenaScenario[] = [
  {
    id: "sc-1", title: "Series A Negotiation", domain: "startup", goal: "Secure $5M funding at favorable terms",
    complexity: "advanced", timeLimit: 300, icon: "🚀",
    description: "Three VCs are at the table. One wants 30% equity, another wants a board seat with veto power. Your runway ends in 6 weeks.",
    variables: ["Burn rate: $180K/mo", "Two competing term sheets", "CTO threatening to leave"],
    tags: ["negotiation", "fundraising", "pressure"],
  },
  {
    id: "sc-2", title: "Cyber Incident Command", domain: "cybersecurity", goal: "Contain data breach and manage fallout",
    complexity: "grandmaster", timeLimit: 240, icon: "🛡️",
    description: "Customer database potentially compromised. Media is calling. Regulators are watching. Your CISO just quit last week.",
    variables: ["500K user records at risk", "GDPR 72-hour disclosure window", "Stock price dropping 8%"],
    tags: ["crisis", "cybersecurity", "communications"],
  },
  {
    id: "sc-3", title: "Product Market Fit Pivot", domain: "startup", goal: "Pivot strategy with 3 months of runway",
    complexity: "intermediate", timeLimit: 300, icon: "🔄",
    description: "Your SaaS product has 200 users but near-zero retention. The board wants answers by Friday.",
    variables: ["$400K remaining capital", "Team of 12 with low morale", "One enterprise lead interested"],
    tags: ["strategy", "product", "pivot"],
  },
  {
    id: "sc-4", title: "Hostile Takeover Defense", domain: "finance", goal: "Defend against acquisition attempt",
    complexity: "grandmaster", timeLimit: 360, icon: "🛡",
    description: "A larger competitor just announced an unsolicited bid at 15% premium. Shareholders are split. Your poison pill expires in 30 days.",
    variables: ["Market cap: $2.1B", "Activist investor holds 8%", "Key patent litigation pending"],
    tags: ["finance", "M&A", "defense"],
  },
  {
    id: "sc-5", title: "Supply Chain Collapse", domain: "leadership", goal: "Restore operations within 48 hours",
    complexity: "advanced", timeLimit: 300, icon: "📦",
    description: "Your primary supplier just went bankrupt. Holiday season starts in 2 weeks. 40% of inventory depends on them.",
    variables: ["$2M in unfulfilled orders", "Three backup suppliers identified", "Warehouse at 30% capacity"],
    tags: ["operations", "logistics", "crisis"],
  },
  {
    id: "sc-6", title: "Regulatory Audit Survival", domain: "legal", goal: "Pass compliance audit with zero findings",
    complexity: "intermediate", timeLimit: 300, icon: "📋",
    description: "SEC is conducting a surprise audit. Your compliance officer found three potential violations last month that haven't been remediated.",
    variables: ["Whistleblower complaint filed", "Incomplete documentation for Q3", "New regulation took effect 60 days ago"],
    tags: ["compliance", "legal", "audit"],
  },
  {
    id: "sc-7", title: "Viral PR Crisis", domain: "marketing", goal: "Recover brand reputation within 24 hours",
    complexity: "advanced", timeLimit: 240, icon: "📱",
    description: "An employee's offensive social media post has gone viral. #BoycottYourBrand is trending. Your CEO is on a plane for 8 more hours.",
    variables: ["2M+ social impressions", "Major retailer considering pulling products", "Employee has protected class status"],
    tags: ["PR", "crisis", "social media"],
  },
  {
    id: "sc-8", title: "Emergency Room Triage", domain: "healthcare", goal: "Optimize patient outcomes with limited resources",
    complexity: "beginner", timeLimit: 300, icon: "🏥",
    description: "Mass casualty event. 15 patients arriving, 4 ER beds available, 2 surgeons on call. Prioritize and allocate.",
    variables: ["Varying injury severity", "Blood supply at 40%", "Nearest backup hospital 45min away"],
    tags: ["healthcare", "triage", "resource allocation"],
  },
  {
    id: "sc-9", title: "Geopolitical Sanctions Navigation", domain: "geopolitics", goal: "Restructure operations to comply with new sanctions within 72 hours",
    complexity: "grandmaster", timeLimit: 360, icon: "🌍",
    description: "New sanctions just hit your top 3 export markets. $50M in contracts are at risk. Board is demanding a response by market open.",
    variables: ["Multi-jurisdiction compliance", "Key partner in sanctioned region", "Competitor poised to absorb your clients"],
    tags: ["geopolitics", "sanctions", "restructuring"],
  },
  {
    id: "sc-10", title: "AI Ethics Board Hearing", domain: "tech", goal: "Defend your AI product's deployment before an ethics review panel",
    complexity: "advanced", timeLimit: 300, icon: "🤖",
    description: "Your facial recognition product is under fire. A bias audit found 23% error rate on minority groups. The panel includes hostile regulators.",
    variables: ["Media coverage intensifying", "Key enterprise clients watching", "Engineering team divided on fix timeline"],
    tags: ["AI ethics", "regulation", "product defense"],
  },
];

export const COGNITIVE_ARCHETYPES = [
  { id: "strategic-architect", name: "Strategic Architect", description: "Methodical planner who builds systems and sees long-term consequences clearly" },
  { id: "rapid-executor", name: "Rapid Executor", description: "Fast decision-maker who thrives under time pressure but may miss nuances" },
  { id: "risk-navigator", name: "Risk Navigator", description: "Balanced approach to uncertainty, weighing probabilities carefully" },
  { id: "aggressive-opportunist", name: "Aggressive Opportunist", description: "Exploits openings rapidly but may overextend resources" },
  { id: "defensive-guardian", name: "Defensive Guardian", description: "Prioritizes preservation and risk mitigation over aggressive gains" },
  { id: "diplomatic-negotiator", name: "Diplomatic Negotiator", description: "Seeks consensus and alliance-based solutions under pressure" },
  { id: "detail-fixated", name: "Detail Analyst", description: "Thorough information processor who may lose time in analysis paralysis" },
  { id: "chaos-rider", name: "Chaos Rider", description: "Thrives in high-ambiguity situations, adapts fluidly but may lack structure" },
];

export function getArenaStats(): { totalDrills: number; avgScore: number; bestGrade: string; streak: number; archetypeHistory: string[] } {
  try {
    const raw = localStorage.getItem("wisdom-arena-stats");
    if (raw) return JSON.parse(raw);
  } catch {}
  return { totalDrills: 0, avgScore: 0, bestGrade: "—", streak: 0, archetypeHistory: [] };
}

export function saveArenaResult(result: DrillResult) {
  const stats = getArenaStats();
  const newTotal = stats.totalDrills + 1;
  const newAvg = Math.round(((stats.avgScore * stats.totalDrills) + result.totalScore) / newTotal);
  const gradeOrder = ["F", "D", "C", "B", "A", "S"];
  const bestGrade = gradeOrder.indexOf(result.metrics.overallGrade) > gradeOrder.indexOf(stats.bestGrade)
    ? result.metrics.overallGrade : stats.bestGrade;
  const streak = result.passed ? stats.streak + 1 : 0;
  const archetypeHistory = [...(stats.archetypeHistory || []), result.cognitiveArchetype].slice(-20);
  localStorage.setItem("wisdom-arena-stats", JSON.stringify({ totalDrills: newTotal, avgScore: newAvg, bestGrade, streak, archetypeHistory }));
}

export function getDrillHistory(): DrillResult[] {
  try {
    const raw = localStorage.getItem("wisdom-arena-history");
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function saveDrillToHistory(result: DrillResult) {
  const history = getDrillHistory();
  history.unshift(result);
  localStorage.setItem("wisdom-arena-history", JSON.stringify(history.slice(0, 50)));
}
