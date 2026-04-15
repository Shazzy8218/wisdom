// Feed card types and starter content for the Phenomenon Decoder, Domain Leverage Engine & Survival Engine

export type FeedCardType =
  | "phenomenon-brief" | "systemic-context" | "strategic-impact" | "opportunity-watch" | "reality-compass"
  | "reality-check" | "source-comparison" | "deep-pattern"
  // Domain Leverage Engine types
  | "money-momentum" | "leverage-point" | "profit-pathway" | "rich-mindset" | "ethical-compass" | "pitfall-alert"
  // Survival Engine types
  | "tax-hack" | "legal-advantage" | "benefit-claim" | "government-program";

export type FeedCategory = "phenomenon" | "wealth" | "survival";

export const FEED_CATEGORIES: Record<FeedCategory, { label: string; icon: string; description: string }> = {
  phenomenon: { label: "Phenomenon Decoder", icon: "📡", description: "Strategic pattern recognition" },
  wealth: { label: "Wealth Engine", icon: "💎", description: "Financial intelligence & leverage" },
  survival: { label: "Survival Guide", icon: "🛡️", description: "Tax, benefits & legal advantages" },
};

export function getCardCategory(type: FeedCardType): FeedCategory {
  if (["money-momentum", "leverage-point", "profit-pathway", "rich-mindset", "ethical-compass", "pitfall-alert"].includes(type)) return "wealth";
  if (["tax-hack", "legal-advantage", "benefit-claim", "government-program"].includes(type)) return "survival";
  return "phenomenon";
}

export type AnalyticalFlag =
  | "source-comparison" | "logical-chain" | "correlation-observation"
  | "narrative-framing" | "data-verification" | "bias-detected"
  | "pattern-divergence" | "unaccounted-variable" | "strategic-incongruence";

export const ANALYTICAL_FLAGS: Record<AnalyticalFlag, { label: string; icon: string; color: string }> = {
  "source-comparison": { label: "Source Comparison", icon: "🔍", color: "text-blue-400" },
  "logical-chain": { label: "Logical Chain", icon: "🔗", color: "text-purple-400" },
  "correlation-observation": { label: "Correlation", icon: "📊", color: "text-amber-400" },
  "narrative-framing": { label: "Narrative Framing", icon: "🪞", color: "text-cyan-400" },
  "data-verification": { label: "Data Verification", icon: "✓", color: "text-emerald-400" },
  "bias-detected": { label: "Bias Detected", icon: "⚠️", color: "text-rose-400" },
  "pattern-divergence": { label: "Pattern Divergence", icon: "⚡", color: "text-orange-400" },
  "unaccounted-variable": { label: "Unaccounted Variable", icon: "❓", color: "text-yellow-400" },
  "strategic-incongruence": { label: "Strategic Incongruence", icon: "🎯", color: "text-red-400" },
};

export interface DecisionProtocol {
  action: string;
  linkedCourse?: string;
  linkedCourseId?: string;
}

export interface AdaptationDirective {
  directive: string;
  urgency: "low" | "medium" | "high" | "critical";
  domain: string;
}

export interface OperationalArchetype {
  name: string;
  description: string;
  historicalExample?: string;
}

export interface EthicalFramework {
  tradition: "jewish" | "islamic" | "stoic" | "utilitarian" | "virtue" | "esg";
  principle: string;
  application: string;
}

export interface ProfitPathway {
  scenario: string;
  potentialOutcome: string;
  timeframe: string;
}

export interface FinancialPitfall {
  name: string;
  description: string;
  avoidanceStrategy: string;
}

export interface FeedCard {
  id: string;
  type: FeedCardType;
  title: string;
  hook: string;
  content: string;
  visual: "diagram" | "infographic" | "compare" | "steps" | "chart" | "icon" | "trend-map" | "influence-web" | "trajectory" | "anomaly-grid";
  visualData?: {
    labels?: string[];
    steps?: string[];
    before?: string;
    after?: string;
    trendData?: { label: string; value: number }[];
    connections?: { from: string; to: string; strength: number }[];
    trajectoryData?: { label: string; current: number; projected: number }[];
  };
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  xp: number;
  tokens: number;
  interaction?: "choice" | "tap-reveal" | "fill-in";
  options?: string[];
  correctAnswer?: number;
  tryPrompt?: string;
  shareSnippet: string;
  source?: string;
  confidence?: number;
  // Cognitive augmentation fields
  analyticalFlags?: AnalyticalFlag[];
  impactAnalysis?: string;
  sourceStreams?: { name: string; perspective: string }[];
  decisionProtocols?: DecisionProtocol[];
  contrastingViews?: { viewA: string; viewB: string };
  // Phenomenon Decoder fields
  phenomenonDomain?: "policy" | "market" | "technology" | "social" | "media" | "finance" | "legal";
  systemicContext?: string;
  strategicImpactProjection?: string;
  opportunitySignal?: { type: "erosion" | "amplification"; description: string };
  adaptationDirectives?: AdaptationDirective[];
  operationalArchetype?: OperationalArchetype;
  realityCompass?: { dominant: string; alternative: string };
  interconnections?: string[];
  underlyingDrivers?: string[];
  urgencyLevel?: "monitor" | "alert" | "critical";
  // Domain Leverage Engine fields
  leveragePoint?: string;
  profitPathway?: ProfitPathway;
  richMindsetContrast?: { commonBelief: string; wealthBuilder: string };
  ethicalFrameworks?: EthicalFramework[];
  financialPitfall?: FinancialPitfall;
  roiPotential?: "low" | "medium" | "high" | "extreme";
  wealthDomain?: "investing" | "tax-optimization" | "business-structure" | "cashflow" | "negotiation" | "asset-protection" | "behavioral-finance";
  profitProtocols?: DecisionProtocol[];
}

// Analytical flags user storage
const FLAGS_KEY = "wisdom-feed-flags";

export function getUserFlags(cardId: string): AnalyticalFlag[] {
  try {
    const all = JSON.parse(localStorage.getItem(FLAGS_KEY) || "{}");
    return all[cardId] || [];
  } catch { return []; }
}

export function toggleUserFlag(cardId: string, flag: AnalyticalFlag): AnalyticalFlag[] {
  try {
    const all = JSON.parse(localStorage.getItem(FLAGS_KEY) || "{}");
    const flags: AnalyticalFlag[] = all[cardId] || [];
    const idx = flags.indexOf(flag);
    if (idx >= 0) flags.splice(idx, 1); else flags.push(flag);
    all[cardId] = flags;
    localStorage.setItem(FLAGS_KEY, JSON.stringify(all));
    return flags;
  } catch { return []; }
}

// Domain icons for phenomenon cards
export const DOMAIN_ICONS: Record<string, string> = {
  policy: "🏛️",
  market: "📈",
  technology: "⚙️",
  social: "🌐",
  media: "📡",
  finance: "💰",
  legal: "⚖️",
  investing: "📊",
  "tax-optimization": "🧾",
  "business-structure": "🏗️",
  cashflow: "💵",
  negotiation: "🤝",
  "asset-protection": "🛡️",
  "behavioral-finance": "🧠",
};

// Starter cards — Phenomenon Decoder + Domain Leverage Engine only
export const STARTER_FEED: FeedCard[] = [
  // === PHENOMENON DECODER CARDS ===
  {
    id: "pd-1", type: "phenomenon-brief", title: "The Silent Subsidy Shift",
    hook: "Government subsidies are quietly redirecting capital flows.",
    content: "Major economies are restructuring clean energy subsidies, redirecting billions from consumer incentives to industrial manufacturing credits. This shifts the beneficiary from end-users to producers, fundamentally altering which companies capture value and which consumers bear rising costs.",
    visual: "trajectory",
    visualData: {
      trajectoryData: [
        { label: "Consumer Subsidies", current: 72, projected: 35 },
        { label: "Industrial Credits", current: 28, projected: 65 },
        { label: "R&D Grants", current: 45, projected: 58 },
      ]
    },
    category: "Policy & Economics", difficulty: "advanced", xp: 60, tokens: 14,
    phenomenonDomain: "policy",
    systemicContext: "This mirrors the 2008 post-crisis pattern where government spending shifted from consumer stimulus to institutional support, concentrating recovery benefits among corporations while individual purchasing power eroded.",
    strategicImpactProjection: "If you hold consumer-facing clean energy stocks, your thesis may be weakening. Producer-side companies and industrial suppliers become the primary beneficiaries. Portfolio rebalancing window: 6-12 months.",
    opportunitySignal: { type: "amplification", description: "Industrial clean energy suppliers and B2B energy tech companies are positioned for outsized growth." },
    adaptationDirectives: [
      { directive: "Audit your portfolio for consumer-subsidy-dependent positions", urgency: "high", domain: "Finance" },
      { directive: "Research top 5 industrial clean energy manufacturers by market cap", urgency: "medium", domain: "Research" },
    ],
    operationalArchetype: { name: "Subsidy Reallocation Cycle", description: "Government shifts incentives from consumers to producers, concentrating economic benefits at the institutional level.", historicalExample: "Post-2008 TARP funds benefited banks over homeowners" },
    urgencyLevel: "alert",
    shareSnippet: "Governments are silently shifting clean energy subsidies from consumers to industrial producers. The beneficiaries are changing. Are you positioned correctly?"
  },
  {
    id: "pd-2", type: "reality-compass", title: "AI Regulation: Protection or Capture?",
    hook: "Two incompatible narratives. One shapes your future.",
    content: "The global push for AI regulation is accelerating. But the question isn't whether it's happening — it's who benefits from the specific rules being written, and whether they protect the public or entrench incumbents.",
    visual: "compare",
    category: "Technology & Policy", difficulty: "advanced", xp: 55, tokens: 12,
    phenomenonDomain: "policy",
    realityCompass: {
      dominant: "AI regulation protects society from existential risk and ensures ethical deployment. Major tech companies support regulation because they recognize the danger of uncontrolled AI development.",
      alternative: "AI regulation creates compliance barriers that only well-funded incumbents can meet, effectively preventing competition from startups and open-source alternatives. Incumbent support for regulation is strategic market protection disguised as safety concern."
    },
    systemicContext: "This pattern — incumbents supporting regulation that creates barriers to entry — has repeated across pharma (FDA approval costs), finance (Dodd-Frank compliance), and telecom (spectrum licensing). The pattern is: advocate safety → write complex rules → fund compliance teams competitors can't afford.",
    strategicImpactProjection: "If you're building with or investing in AI, the regulatory environment determines whether open-source alternatives remain viable. Compliance costs above $10M/year filter out all but the largest players.",
    interconnections: ["Regulatory capture in pharma", "Telecom spectrum auctions", "Financial compliance costs", "EU GDPR impact on small businesses"],
    underlyingDrivers: ["Market concentration incentives", "Lobbying expenditure asymmetry", "Public fear amplification"],
    urgencyLevel: "alert",
    shareSnippet: "AI regulation: is it protecting you, or protecting incumbents FROM you? Follow the compliance costs."
  },
  {
    id: "pd-3", type: "strategic-impact", title: "The Attention Bandwidth Crisis",
    hook: "Your cognitive capacity is a finite resource under siege.",
    content: "Average daily screen time hit 7.5 hours in 2024. But the real metric isn't time — it's attention fragmentation. The average person context-switches 566 times per day, each switch costing 23 minutes of refocus time. The math is devastating: you lose 40% of productive capacity to switching alone.",
    visual: "trend-map",
    visualData: {
      trendData: [
        { label: "2018", value: 35 },
        { label: "2019", value: 42 },
        { label: "2020", value: 58 },
        { label: "2021", value: 62 },
        { label: "2022", value: 71 },
        { label: "2023", value: 78 },
        { label: "2024", value: 85 },
      ]
    },
    category: "Cognitive Autonomy", difficulty: "intermediate", xp: 50, tokens: 11,
    phenomenonDomain: "social",
    systemicContext: "The attention economy is not accidental — it's engineered. Every major platform employs teams of behavioral psychologists optimizing for engagement metrics (time-on-app, scroll depth, notification interaction rates). Your attention is the product being sold.",
    strategicImpactProjection: "Those who reclaim deliberate attention allocation gain a compounding cognitive advantage. In knowledge work, the gap between a focused 4-hour block and 8 fragmented hours is roughly 3:1 in output quality.",
    adaptationDirectives: [
      { directive: "Implement 90-minute deep work blocks with all notifications disabled", urgency: "high", domain: "Productivity" },
      { directive: "Audit your notification settings — eliminate all non-critical alerts", urgency: "critical", domain: "Digital Hygiene" },
      { directive: "Track your context-switches for one week using a simple tally", urgency: "medium", domain: "Self-Awareness" },
    ],
    operationalArchetype: { name: "Attention Extraction Economy", description: "Platforms compete to capture and monetize human attention, creating systemic cognitive degradation.", historicalExample: "Television's impact on reading habits in the 1960s — same pattern, amplified 100x" },
    urgencyLevel: "critical",
    shareSnippet: "You context-switch 566 times/day, losing 40% of productive capacity. Your attention is being extracted as a commodity."
  },
  {
    id: "pd-4", type: "opportunity-watch", title: "The Privacy Premium Emerging",
    hook: "Data privacy is becoming a luxury good. Position early.",
    content: "Consumer willingness to pay for privacy has tripled since 2020. Apple's privacy-as-feature strategy captured $45B in additional services revenue. The privacy premium isn't about hiding — it's about control, and consumers will increasingly pay for it.",
    visual: "trajectory",
    visualData: {
      trajectoryData: [
        { label: "Privacy-first SaaS", current: 12, projected: 45 },
        { label: "Data broker revenue", current: 68, projected: 42 },
        { label: "Consumer privacy spend", current: 8, projected: 35 },
      ]
    },
    category: "Market Intelligence", difficulty: "intermediate", xp: 55, tokens: 12,
    phenomenonDomain: "market",
    opportunitySignal: { type: "amplification", description: "Privacy-first products and services are entering a hyper-growth phase. B2B privacy compliance tools and consumer privacy tech are the two fastest-growing subcategories." },
    systemicContext: "The data broker model peaked in 2022. GDPR enforcement, state-level privacy laws (California, Virginia, Colorado), and consumer awareness are creating regulatory and market pressure that favors privacy-centric business models.",
    strategicImpactProjection: "If you're building products: privacy-by-design is no longer a cost center, it's a revenue driver. If you're investing: privacy tech is following the cybersecurity growth curve with a 5-year lag.",
    adaptationDirectives: [
      { directive: "Audit your product's data collection — eliminate everything non-essential", urgency: "high", domain: "Product Strategy" },
      { directive: "Research privacy-first alternatives to your current analytics stack", urgency: "medium", domain: "Technology" },
    ],
    urgencyLevel: "monitor",
    shareSnippet: "Privacy is becoming a premium product. Consumer willingness to pay for it tripled since 2020. The data broker model is peaking."
  },
  {
    id: "pd-5", type: "systemic-context", title: "Debt Ceiling Theater: The Pattern",
    hook: "Every cycle follows the same playbook. Here's the map.",
    content: "The debt ceiling 'crisis' follows a repeatable 5-stage pattern that has played out 78 times since 1960. Understanding this pattern eliminates the noise and reveals the actual decision points and their market implications.",
    visual: "steps",
    visualData: {
      steps: [
        "Stage 1: Approaching limit → media alarm escalation begins",
        "Stage 2: Political posturing → demands and counter-demands",
        "Stage 3: Extraordinary measures → Treasury buys 2-4 months",
        "Stage 4: Market volatility spike → short-term fear peaks",
        "Stage 5: Last-minute resolution → relief rally follows",
      ]
    },
    category: "Political Economy", difficulty: "advanced", xp: 65, tokens: 14,
    phenomenonDomain: "policy",
    systemicContext: "This is a manufactured crisis cycle. The debt ceiling itself is a legislative artifact — most democracies don't have one. Its primary function has evolved from fiscal control to political leverage. The pattern has resolved the same way 78 out of 78 times.",
    strategicImpactProjection: "Historical data shows markets drop 3-7% during Stage 4, then recover within 30-60 days post-resolution. Those who understand the pattern can position during the fear spike rather than panic-sell.",
    operationalArchetype: { name: "Manufactured Crisis Cycle", description: "A predictable multi-stage political-economic pattern where artificial urgency is created, exploited for leverage, then resolved — with consistent market impacts at each stage.", historicalExample: "2011, 2013, 2023 debt ceiling episodes all followed this exact pattern" },
    underlyingDrivers: ["Political leverage dynamics", "Media engagement incentives", "Institutional trader strategies"],
    urgencyLevel: "monitor",
    shareSnippet: "The debt ceiling has been 'resolved' 78 out of 78 times since 1960. It's a pattern, not a crisis. Learn the 5-stage cycle."
  },

  // === DOMAIN LEVERAGE ENGINE CARDS ===
  {
    id: "dle-1", type: "money-momentum", title: "The Compound Interest Asymmetry",
    hook: "Why $100/month at 22 beats $500/month at 35. The math is brutal.",
    content: "A 22-year-old investing $100/month at 10% average return accumulates $632,000 by 60. A 35-year-old investing $500/month at the same rate? $566,000. The 22-year-old invested $45,600 total. The 35-year-old invested $150,000. Time leverage is the most underutilized wealth advantage available to anyone with income.",
    visual: "trajectory",
    visualData: {
      trajectoryData: [
        { label: "Start at 22 ($100/mo)", current: 15, projected: 85 },
        { label: "Start at 35 ($500/mo)", current: 50, projected: 72 },
        { label: "Time advantage", current: 10, projected: 95 },
      ]
    },
    category: "Wealth Creation", difficulty: "beginner", xp: 55, tokens: 12,
    wealthDomain: "investing",
    leveragePoint: "Time in market beats timing the market. Every year of delay costs exponentially more to recover.",
    profitPathway: { scenario: "Start automated $100/month index fund investment today", potentialOutcome: "Additional $200K+ by retirement vs. starting 5 years later", timeframe: "30+ years compound effect" },
    ethicalFrameworks: [
      { tradition: "jewish", principle: "Tzedakah — systematic charitable giving grows alongside wealth", application: "Set automated charity alongside investment: 10% giving rule" },
      { tradition: "stoic", principle: "Discipline over desire — consistent small actions compound", application: "Automate investments to remove emotional decision-making" },
    ],
    profitProtocols: [
      { action: "Open a low-cost index fund account and set up $100/month auto-invest today" },
      { action: "Calculate your compound growth using the Rule of 72" },
    ],
    roiPotential: "extreme",
    shareSnippet: "$100/mo at 22 = $632K by 60. $500/mo at 35 = $566K. The #1 wealth hack is starting NOW."
  },
  {
    id: "dle-2", type: "leverage-point", title: "The LLC Shield Most People Ignore",
    hook: "Why the wealthy separate assets into entities — and you can too.",
    content: "Operating a business or holding investments through an LLC creates a legal separation between personal and business liability. Cost: $50-500 to form depending on state. Benefit: Creditor protection, tax flexibility (elect S-Corp status to save 15.3% self-employment tax on distributions), and professional credibility. Delaware, Wyoming, and Nevada offer the strongest protections.",
    visual: "steps",
    visualData: {
      steps: [
        "Step 1: Choose entity type (LLC for most beginners)",
        "Step 2: File in asset-protection-friendly state (WY, NV, DE)",
        "Step 3: Obtain EIN from IRS (free, 5 minutes online)",
        "Step 4: Open business bank account — separation is key",
        "Step 5: Elect S-Corp status at $40K+ net income to save on SE tax",
      ]
    },
    category: "Legal & Tax Strategy", difficulty: "intermediate", xp: 65, tokens: 14,
    wealthDomain: "business-structure",
    leveragePoint: "The wealthy don't earn more — they structure better. Entity selection is the first leverage point.",
    richMindsetContrast: {
      commonBelief: "LLCs are only for big businesses with employees and offices.",
      wealthBuilder: "Every income stream deserves its own legal entity. A $200 LLC can protect millions in personal assets and save thousands in taxes annually."
    },
    ethicalFrameworks: [
      { tradition: "islamic", principle: "Halal earnings — income must come from permissible, transparent structures", application: "Ensure business entity operates with full transparency and lawful purpose" },
      { tradition: "esg", principle: "Governance — proper legal structure ensures accountability", application: "Use entity structure for clear record-keeping, not opacity" },
    ],
    adaptationDirectives: [
      { directive: "Research LLC formation costs in your state vs. Wyoming/Nevada", urgency: "medium", domain: "Legal" },
      { directive: "Consult a CPA about S-Corp election if net income exceeds $40K", urgency: "high", domain: "Tax" },
    ],
    roiPotential: "high",
    shareSnippet: "A $200 LLC can protect millions in personal assets. The wealthy don't earn more — they STRUCTURE better."
  },
  {
    id: "dle-3", type: "rich-mindset", title: "Assets vs. Liabilities: The Only Rule",
    hook: "Rich Dad was right. Most people buy liabilities thinking they're assets.",
    content: "An asset puts money in your pocket. A liability takes money out. Your car, your big house, your new phone — liabilities. Rental property generating $500/month cash flow, a dividend portfolio, intellectual property earning royalties — assets. The wealthy accumulate assets. Everyone else accumulates liabilities disguised as status symbols.",
    visual: "compare",
    visualData: {
      before: "Liability mindset: New car ($600/mo payment), bigger house ($3K/mo mortgage), latest gadgets → net cash outflow",
      after: "Asset mindset: Rental property (+$500/mo), dividend stocks (+$300/mo), digital products (+$1K/mo) → net cash inflow"
    },
    category: "Behavioral Finance", difficulty: "beginner", xp: 50, tokens: 11,
    wealthDomain: "behavioral-finance",
    richMindsetContrast: {
      commonBelief: "My house is my biggest asset. My car holds value. I deserve nice things because I work hard.",
      wealthBuilder: "If it doesn't generate cash flow, it's a liability. Status symbols are the tax you pay on ego. Redirect that cash flow into actual income-producing assets."
    },
    ethicalFrameworks: [
      { tradition: "stoic", principle: "Distinguish between needs and desires — excess consumption weakens resolve", application: "Before any purchase over $500, ask: does this produce income or consume it?" },
      { tradition: "jewish", principle: "Bal tashchit — do not waste resources", application: "Allocate resources to productive use; avoid conspicuous consumption" },
    ],
    financialPitfall: { name: "Lifestyle Inflation Trap", description: "As income rises, spending rises proportionally, preventing wealth accumulation despite higher earnings.", avoidanceStrategy: "Save 100% of every raise for 12 months. Live on your previous salary." },
    profitProtocols: [
      { action: "List every monthly expense and classify as asset (income-producing) or liability (income-consuming)" },
      { action: "Identify one liability to eliminate this month and redirect the cash flow to an asset" },
    ],
    roiPotential: "high",
    shareSnippet: "An asset puts money IN your pocket. A liability takes money OUT. Most people buy liabilities thinking they're assets."
  },
  {
    id: "dle-4", type: "ethical-compass", title: "Interest-Free Wealth: Islamic Finance Decoded",
    hook: "A $3.5 trillion industry built on zero-interest principles. Here's how.",
    content: "Islamic finance prohibits Riba (interest/usury) but has built sophisticated alternatives: Murabaha (cost-plus financing), Ijara (lease-to-own), Musharakah (equity partnership). These aren't just religious rules — they enforce risk-sharing between parties, which prevented Islamic banks from the worst of the 2008 crash. Sukuk (Islamic bonds) outperformed conventional bonds by 2.3% average from 2008-2015.",
    visual: "diagram",
    visualData: { labels: ["No Riba (Interest)", "→ Risk Sharing", "→ Real Asset Backing", "→ Ethical Returns"] },
    category: "Ethical Finance", difficulty: "intermediate", xp: 60, tokens: 13,
    wealthDomain: "investing",
    ethicalFrameworks: [
      { tradition: "islamic", principle: "Prohibition of Riba — money must not make money from money alone", application: "Invest in asset-backed, risk-sharing instruments like Sukuk or equity partnerships" },
      { tradition: "islamic", principle: "No Gharar — avoid excessive uncertainty and speculation", application: "Every financial transaction must have clear terms, real assets, and shared risk" },
      { tradition: "utilitarian", principle: "Greatest good — risk-sharing distributes economic shocks more evenly", application: "Consider whether your investments create systemic risk or distribute it" },
    ],
    leveragePoint: "Interest-free finance forces real asset backing — which creates more stable, crash-resistant portfolios. The constraint IS the advantage.",
    profitProtocols: [
      { action: "Research Sukuk ETFs and Islamic index funds for diversification" },
      { action: "Apply the 'real asset backing' test to your current portfolio — how much is backed by tangible value?" },
    ],
    roiPotential: "medium",
    shareSnippet: "Islamic banks survived 2008 better than conventional ones. Zero-interest finance isn't a limitation — it's an advantage."
  },
  {
    id: "dle-5", type: "pitfall-alert", title: "The Subscription Hemorrhage",
    hook: "The average person bleeds $219/month on forgotten subscriptions.",
    content: "Americans spend an average of $219/month on subscriptions — but estimate they spend only $86. That's $1,596/year in invisible cash drain. The subscription model is designed to exploit inertia bias: you sign up easily but forget to cancel. Each $15/month subscription invested instead at 10% return = $30,727 over 20 years.",
    visual: "trend-map",
    visualData: {
      trendData: [
        { label: "2019", value: 120 },
        { label: "2020", value: 145 },
        { label: "2021", value: 175 },
        { label: "2022", value: 195 },
        { label: "2023", value: 210 },
        { label: "2024", value: 219 },
      ]
    },
    category: "Cash Flow Optimization", difficulty: "beginner", xp: 45, tokens: 10,
    wealthDomain: "cashflow",
    financialPitfall: { name: "Subscription Inertia Trap", description: "Businesses exploit cognitive inertia — signing up is easy, canceling requires effort, and monthly charges are small enough to ignore individually.", avoidanceStrategy: "Quarterly audit: export bank statement, highlight every recurring charge, cancel anything unused in 30 days." },
    profitPathway: { scenario: "Cancel 5 unused subscriptions averaging $15/month each", potentialOutcome: "Save $900/year → $153,635 over 20 years if invested at 10%", timeframe: "Immediate savings, 20-year compound benefit" },
    ethicalFrameworks: [
      { tradition: "stoic", principle: "Audit your desires — distinguish essential from superfluous", application: "Apply Marcus Aurelius' test: 'Is this necessary?' to every recurring charge" },
    ],
    urgencyLevel: "alert",
    shareSnippet: "You think you spend $86/mo on subscriptions. Reality: $219/mo. That's $153K in lost wealth over 20 years."
  },
  {
    id: "hv-1", type: "money-momentum", title: "The Tax-Loss Harvesting Edge",
    hook: "The IRS lets you write off investment losses against gains. Most people don't.",
    content: "Tax-loss harvesting means selling losing investments to offset capital gains taxes. If you made $10K in stock gains and lost $4K elsewhere, you pay tax on $6K instead of $10K. You can even deduct up to $3K/year against regular income. Robo-advisors automate this, saving investors 1-2% annually in taxes.",
    visual: "trajectory",
    visualData: { trajectoryData: [
      { label: "Without harvesting", current: 100, projected: 72 },
      { label: "With harvesting", current: 100, projected: 85 },
      { label: "Tax savings", current: 0, projected: 13 },
    ]},
    category: "Tax Strategy", difficulty: "intermediate", xp: 55, tokens: 12,
    wealthDomain: "tax-optimization",
    leveragePoint: "The tax code rewards strategic loss realization. This is free money most people leave on the table.",
    profitPathway: { scenario: "Implement tax-loss harvesting on a $100K portfolio", potentialOutcome: "Save $1,500-3,000/year in taxes", timeframe: "Annual, compounding benefit" },
    profitProtocols: [{ action: "Review unrealized losses in your portfolio quarterly" }, { action: "Set up automated tax-loss harvesting through your broker" }],
    roiPotential: "high",
    shareSnippet: "Tax-loss harvesting can save you 1-2% annually. The IRS lets you deduct investment losses — most people don't use this."
  },
  {
    id: "hv-2", type: "phenomenon-brief", title: "The Great Skill Repricing",
    hook: "AI is compressing the value of knowledge work. Some skills are rising.",
    content: "Coding, copywriting, data analysis, and translation are being commoditized by AI. But skills involving judgment under uncertainty — sales negotiation, crisis management, creative direction, complex stakeholder management — are repricing upward. The gap between automatable and non-automatable skills will widen 3-5x by 2027.",
    visual: "trajectory",
    visualData: { trajectoryData: [
      { label: "Routine knowledge work", current: 75, projected: 30 },
      { label: "Judgment-based skills", current: 60, projected: 90 },
      { label: "AI-augmented hybrid", current: 40, projected: 85 },
    ]},
    category: "Career Strategy", difficulty: "intermediate", xp: 50, tokens: 11,
    phenomenonDomain: "technology",
    systemicContext: "This mirrors the industrial revolution pattern: routine manual labor was devalued, but skilled trades and management roles appreciated in value. The same bifurcation is happening in white-collar work.",
    strategicImpactProjection: "If your primary income relies on skills AI can replicate, you have a 2-3 year window to pivot toward judgment-heavy capabilities or AI-augmented workflows.",
    adaptationDirectives: [
      { directive: "Audit your top 5 income-generating skills against AI automation risk", urgency: "high", domain: "Career" },
      { directive: "Invest in one judgment-based skill this quarter (negotiation, leadership, creative strategy)", urgency: "medium", domain: "Development" },
    ],
    urgencyLevel: "alert",
    shareSnippet: "AI is repricing skills. Routine knowledge work is falling. Judgment under uncertainty is rising. Where are your skills?"
  },
  {
    id: "hv-3", type: "rich-mindset", title: "Salary vs. Equity: The Wealth Split",
    hook: "Employees trade time for money. Owners trade risk for upside.",
    content: "The median W-2 employee earns $56K/year. The median small business owner earns $64K — only 14% more. But median net worth tells the real story: employees at $95K, business owners at $1.17M. The difference isn't income — it's equity accumulation. Every year you work for salary alone, you're building someone else's equity.",
    visual: "compare",
    visualData: { before: "Salary path: $56K/yr income, $95K median net worth after 20 years", after: "Equity path: $64K/yr income, $1.17M median net worth after 20 years" },
    category: "Wealth Creation", difficulty: "intermediate", xp: 55, tokens: 12,
    wealthDomain: "investing",
    richMindsetContrast: {
      commonBelief: "A good salary with benefits is the safest path to wealth.",
      wealthBuilder: "Salary is a tool for funding equity positions. Every dollar earned should be split: living expenses, reserves, and equity-building investments."
    },
    ethicalFrameworks: [
      { tradition: "jewish", principle: "Parnassah — honest livelihood with multiple income streams", application: "Diversify income sources; don't depend entirely on one employer" },
    ],
    profitProtocols: [
      { action: "Calculate what percentage of your income builds YOUR equity vs. your employer's" },
      { action: "Start one side project that builds equity you own — even if it earns $0 initially" },
    ],
    roiPotential: "extreme",
    shareSnippet: "Employees earn 14% more salary than business owners. But owners have 12x the net worth. The difference is equity."
  },
  {
    id: "hv-4", type: "strategic-impact", title: "The Attention Monopoly Play",
    hook: "Five companies control 80% of global digital attention. Here's the play.",
    content: "Google, Meta, Apple, Amazon, and TikTok collectively control 80% of digital attention hours. This isn't just a market share stat — it determines which businesses survive. If your revenue depends on organic reach through these platforms, you're building on rented land. Every algorithm change is a rent increase you can't negotiate.",
    visual: "trend-map",
    visualData: { trendData: [
      { label: "2018", value: 55 }, { label: "2019", value: 62 }, { label: "2020", value: 70 },
      { label: "2021", value: 74 }, { label: "2022", value: 77 }, { label: "2023", value: 80 },
    ]},
    category: "Market Intelligence", difficulty: "advanced", xp: 60, tokens: 13,
    phenomenonDomain: "market",
    systemicContext: "Attention concentration follows the same power-law as wealth concentration. The top 5 platforms capture exponentially more attention than the next 50 combined.",
    strategicImpactProjection: "Businesses dependent on a single platform's algorithm for distribution face existential risk with every update. Email lists, direct relationships, and owned channels are the only hedge.",
    adaptationDirectives: [
      { directive: "Build an owned audience channel (email list, community) as your primary distribution", urgency: "critical", domain: "Business" },
      { directive: "Diversify across at least 3 acquisition channels — never depend on one platform", urgency: "high", domain: "Strategy" },
    ],
    operationalArchetype: { name: "Platform Dependency Trap", description: "Businesses build on rented platforms, then face existential risk when platform rules change.", historicalExample: "Facebook organic reach dropped from 16% to 2% between 2012-2023, destroying businesses built on free reach" },
    urgencyLevel: "critical",
    shareSnippet: "5 companies control 80% of digital attention. If your business depends on their algorithms, you're building on rented land."
  },
  {
    id: "hv-5", type: "leverage-point", title: "The Roth Conversion Ladder",
    hook: "How early retirees access retirement funds penalty-free.",
    content: "The Roth Conversion Ladder lets you access traditional IRA/401K funds before age 59½ without the 10% penalty. Convert traditional to Roth each year, wait 5 years, withdraw the converted amount tax-free. If you're in a low-income year (sabbatical, early retirement, career transition), you convert at a lower tax bracket — paying less tax than you would at withdrawal.",
    visual: "steps",
    visualData: { steps: [
      "Year 1: Convert $40K from Traditional IRA to Roth (pay tax at current low bracket)",
      "Year 2: Convert another $40K (pay low tax again)",
      "Year 3-5: Continue converting annually",
      "Year 6: Withdraw Year 1 conversion tax and penalty-free",
      "Year 7+: Each year's conversion becomes accessible — perpetual pipeline",
    ]},
    category: "Tax Strategy", difficulty: "advanced", xp: 65, tokens: 14,
    wealthDomain: "tax-optimization",
    leveragePoint: "The 5-year Roth conversion rule creates a penalty-free bridge to retirement funds. Most financial advisors don't mention it because it requires planning.",
    richMindsetContrast: {
      commonBelief: "Retirement money is locked until 59½. Early withdrawal means 10% penalty plus taxes.",
      wealthBuilder: "The tax code has specific provisions for strategic conversions. A Roth ladder built during low-income years can save $50K+ in penalties and taxes."
    },
    roiPotential: "extreme",
    shareSnippet: "The Roth Conversion Ladder lets you access retirement funds before 59½ with zero penalty. Most people don't know this exists."
  },
  {
    id: "hv-6", type: "pitfall-alert", title: "The Inflation Illusion",
    hook: "Your savings are losing 3-7% purchasing power annually. Silently.",
    content: "Keeping $50K in a savings account at 0.5% APY while inflation runs at 5% means you lose $2,250 in purchasing power annually. Over 10 years, that $50K buys what $38K buys today. The 'safety' of savings accounts is an illusion — you're guaranteed to lose money in real terms. Even high-yield savings at 4.5% barely keeps pace.",
    visual: "trajectory",
    visualData: { trajectoryData: [
      { label: "Savings account (0.5%)", current: 50, projected: 31 },
      { label: "High-yield savings (4.5%)", current: 50, projected: 47 },
      { label: "Index fund (10% avg)", current: 50, projected: 80 },
    ]},
    category: "Behavioral Finance", difficulty: "beginner", xp: 45, tokens: 10,
    wealthDomain: "investing",
    financialPitfall: { name: "Nominal vs. Real Return Confusion", description: "People see their bank balance staying the same and feel 'safe' while inflation erodes purchasing power invisibly.", avoidanceStrategy: "Keep only 3-6 months expenses in savings. Everything else must beat inflation — index funds, I-bonds, or real assets." },
    ethicalFrameworks: [
      { tradition: "stoic", principle: "See things as they are, not as they appear", application: "Calculate your REAL (inflation-adjusted) return, not the nominal number on screen" },
    ],
    urgencyLevel: "alert",
    shareSnippet: "$50K in a savings account loses $2,250/year in purchasing power to inflation. 'Safe' savings are a guaranteed loss."
  },
  {
    id: "hv-8", type: "money-momentum", title: "The Emergency Fund Paradox",
    hook: "3-6 months expenses saved = the #1 wealth accelerator. Here's why.",
    content: "An emergency fund doesn't just protect you — it changes your decision-making. Without one, you accept bad deals: staying in underpaying jobs, taking predatory loans, panic-selling investments. Research shows people with 3+ months savings negotiate 15% higher salaries because they can afford to walk away. The fund isn't defensive — it's leverage.",
    visual: "compare",
    visualData: { before: "No emergency fund: accept first offer, can't negotiate, panic-sell in downturns", after: "6-month fund: negotiate from strength, invest during dips, choose opportunities selectively" },
    category: "Cash Flow", difficulty: "beginner", xp: 50, tokens: 11,
    wealthDomain: "cashflow",
    leveragePoint: "Financial security creates negotiation power. The ability to walk away is the most underrated wealth tool.",
    profitPathway: { scenario: "Build a 6-month emergency fund ($15K-$30K)", potentialOutcome: "15% salary increase at next negotiation + avoid forced selling during market downturns", timeframe: "6-12 months to build, lifetime benefit" },
    profitProtocols: [
      { action: "Automate 20% of income to a high-yield savings account until you hit 6 months expenses" },
      { action: "Once funded, redirect that 20% into index funds — the habit is already built" },
    ],
    roiPotential: "high",
    shareSnippet: "An emergency fund isn't defensive — it's leverage. People with 3+ months savings negotiate 15% higher salaries."
  },
];

// Track which cards the user has seen/completed
const SEEN_KEY = "wisdom-feed-seen";
const SAVED_KEY = "wisdom-feed-saved";

export function getSeenCardIds(): string[] {
  try { return JSON.parse(localStorage.getItem(SEEN_KEY) || "[]"); } catch { return []; }
}

export function markCardSeen(id: string) {
  const seen = getSeenCardIds();
  if (!seen.includes(id)) { seen.push(id); localStorage.setItem(SEEN_KEY, JSON.stringify(seen)); }
}

export function getSavedCards(): string[] {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY) || "[]"); } catch { return []; }
}

export function toggleSaveCard(id: string): boolean {
  const saved = getSavedCards();
  const idx = saved.indexOf(id);
  if (idx >= 0) { saved.splice(idx, 1); } else { saved.push(id); }
  localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
  return idx < 0;
}

export function getUnseenCards(): FeedCard[] {
  const seen = getSeenCardIds();
  return STARTER_FEED.filter(c => !seen.includes(c.id));
}
