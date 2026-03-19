// Mastery Arena: Neural Syntax Engine - Core Types & Data

export interface ArenaScenario {
  id: string;
  title: string;
  domain: string;
  goal: string;
  complexity: "beginner" | "intermediate" | "advanced" | "grandmaster";
  timeLimit: number; // seconds
  description: string;
  variables: string[];
  tags: string[];
  icon: string;
}

export interface DrillDecision {
  id: string;
  timestamp: number;
  timeElapsed: number;
  action: string;
  consequence: string;
  score: number; // -10 to 10
  biasDetected?: string;
}

export interface SituationUpdate {
  id: string;
  timestamp: number;
  type: "metric" | "comms" | "event" | "warning" | "intel";
  title: string;
  content: string;
  severity: "info" | "caution" | "critical";
}

export interface DrillResult {
  scenarioId: string;
  totalScore: number;
  maxScore: number;
  decisions: DrillDecision[];
  situationLog: SituationUpdate[];
  metrics: {
    decisionSpeed: number;
    strategicForesight: number;
    resourceEfficiency: number;
    adaptability: number;
    composure: number;
    overallGrade: string;
  };
  biases: string[];
  feedback: string;
  playbook: string[];
  passed: boolean;
  timeUsed: number;
}

export const COMPLEXITY_CONFIG = {
  beginner: { label: "Cadet", color: "text-accent-green", turns: 4, timeMult: 1.5 },
  intermediate: { label: "Operator", color: "text-accent-gold", turns: 6, timeMult: 1 },
  advanced: { label: "Commander", color: "text-primary", turns: 8, timeMult: 0.75 },
  grandmaster: { label: "Grandmaster", color: "text-primary", turns: 10, timeMult: 0.5 },
};

export const DOMAINS = [
  { id: "startup", label: "Startup & Venture", icon: "🚀" },
  { id: "finance", label: "Finance & Markets", icon: "📊" },
  { id: "leadership", label: "Leadership & Ops", icon: "👔" },
  { id: "crisis", label: "Crisis Management", icon: "🔥" },
  { id: "legal", label: "Legal & Compliance", icon: "⚖️" },
  { id: "marketing", label: "Marketing & Growth", icon: "📈" },
  { id: "tech", label: "Tech & Engineering", icon: "⚙️" },
  { id: "healthcare", label: "Healthcare & Safety", icon: "🏥" },
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
    id: "sc-2", title: "Cyber Incident Command", domain: "crisis", goal: "Contain data breach and manage fallout",
    complexity: "grandmaster", timeLimit: 240, icon: "🔥",
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
];

export function getArenaStats(): { totalDrills: number; avgScore: number; bestGrade: string; streak: number } {
  try {
    const raw = localStorage.getItem("wisdom-arena-stats");
    if (raw) return JSON.parse(raw);
  } catch {}
  return { totalDrills: 0, avgScore: 0, bestGrade: "—", streak: 0 };
}

export function saveArenaResult(result: DrillResult) {
  const stats = getArenaStats();
  const newTotal = stats.totalDrills + 1;
  const newAvg = Math.round(((stats.avgScore * stats.totalDrills) + result.totalScore) / newTotal);
  const gradeOrder = ["F", "D", "C", "B", "A", "S"];
  const bestGrade = gradeOrder.indexOf(result.metrics.overallGrade) > gradeOrder.indexOf(stats.bestGrade)
    ? result.metrics.overallGrade : stats.bestGrade;
  const streak = result.passed ? stats.streak + 1 : 0;
  localStorage.setItem("wisdom-arena-stats", JSON.stringify({ totalDrills: newTotal, avgScore: newAvg, bestGrade, streak }));
}
