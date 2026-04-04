// Feed card types and starter content for the Phenomenon Decoder & Domain Leverage Engine

export type FeedCardType =
  | "quick-fact" | "micro-lesson" | "news" | "challenge" | "myth-vs-truth" | "video"
  | "key-insight" | "reality-check" | "source-comparison" | "deep-pattern"
  | "phenomenon-brief" | "systemic-context" | "strategic-impact" | "opportunity-watch" | "reality-compass"
  // Domain Leverage Engine types
  | "money-momentum" | "leverage-point" | "profit-pathway" | "rich-mindset" | "ethical-compass" | "pitfall-alert";

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
  mythStatement?: string;
  truthStatement?: string;
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
  // Wealth domain icons
  investing: "📊",
  "tax-optimization": "🧾",
  "business-structure": "🏗️",
  cashflow: "💵",
  negotiation: "🤝",
  "asset-protection": "🛡️",
  "behavioral-finance": "🧠",
};

// Starter cards — mix of original + phenomenon decoder cards
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

  // === CLASSIC CARDS (kept for variety) ===
  {
    id: "ff-1", type: "quick-fact", title: "AI Doesn't \"Understand\" You",
    hook: "It predicts the next word. That's it.",
    content: "Large Language Models are pattern-matching machines. They don't comprehend meaning — they calculate the statistically most likely next token based on training data. This is why they can write poetry but can't tell you if it's raining outside.",
    visual: "diagram", visualData: { labels: ["Your Prompt", "→ Pattern Match", "→ Probability Calc", "→ Output Token"] },
    category: "Computer & math", difficulty: "beginner", xp: 30, tokens: 6,
    interaction: "tap-reveal", shareSnippet: "AI doesn't understand you — it predicts the next word. Knowing this changes how you prompt."
  },
  {
    id: "ff-2", type: "quick-fact", title: "The 80/20 Rule of Prompting",
    hook: "80% of your AI output quality comes from 20% of your prompt.",
    content: "The most impactful parts of any prompt: 1) Role assignment ('You are a senior editor'), 2) Output format ('Return as a numbered list'), 3) One concrete example. Everything else is refinement.",
    visual: "chart", visualData: { labels: ["Role", "Format", "Example", "Everything Else"] },
    category: "Computer & math", difficulty: "beginner", xp: 35, tokens: 7,
    interaction: "choice", options: ["Role + Format + Example", "Length of prompt", "Using big words", "Asking politely"], correctAnswer: 0,
    shareSnippet: "80% of AI output quality comes from just 3 things: Role, Format, and one Example."
  },
  {
    id: "ff-5", type: "micro-lesson", title: "Before/After: Email Prompts",
    hook: "Watch a vague prompt become a precision tool.",
    content: "BEFORE: 'Write me an email'\nAFTER: 'Write a 3-sentence follow-up email to a client who missed a deadline. Tone: firm but friendly. End with a specific new deadline suggestion.'\n\nThe difference? Constraints. Every constraint you add eliminates 100 bad outputs.",
    visual: "compare", visualData: { before: "Write me an email", after: "Write a 3-sentence follow-up to a client who missed a deadline. Tone: firm but friendly. End with a new deadline." },
    category: "Office & admin", difficulty: "beginner", xp: 50, tokens: 10,
    tryPrompt: "Take an email you sent last week. Rewrite the prompt with Role + Tone + Length + Format constraints.",
    shareSnippet: "Every constraint you add to an AI prompt eliminates 100 bad outputs."
  },
  {
    id: "ff-6", type: "micro-lesson", title: "The Verification Habit",
    hook: "Trust AI? Fine. But verify like a journalist.",
    content: "The 3-Source Rule: For any AI-generated fact, verify with at least 2 independent sources before using it professionally. AI confidently generates fake statistics, nonexistent research papers, and plausible-sounding but wrong legal advice. The cost of one wrong fact > the time to verify.",
    visual: "steps", visualData: { steps: ["1. AI generates claim", "2. Check Source A (official site)", "3. Check Source B (independent)", "4. Cross-reference dates/numbers", "5. Use with confidence"] },
    category: "Protective service", difficulty: "beginner", xp: 55, tokens: 11,
    interaction: "choice", options: ["Verify with 2+ independent sources", "Trust if it sounds confident", "Only verify numbers", "AI is always accurate"], correctAnswer: 0,
    tryPrompt: "Ask AI for 3 statistics about your industry. Then verify each one.",
    shareSnippet: "AI lies confidently. The 3-Source Rule: verify every fact with 2 independent sources."
  },
  {
    id: "ff-9", type: "challenge", title: "Spot the Hallucination",
    hook: "One of these AI 'facts' is completely made up.",
    content: "AI generated these statements. Which one is a hallucination?",
    visual: "icon", category: "Protective service", difficulty: "intermediate", xp: 50, tokens: 10,
    interaction: "choice",
    options: [
      "Python was created by Guido van Rossum in 1991",
      "The Stanford AI Transparency Report 2024 found that 73% of AI models lack adequate documentation",
      "Machine learning is a subset of artificial intelligence",
      "Neural networks are inspired by biological brain structures"
    ], correctAnswer: 1,
    shareSnippet: "AI invents fake studies with real-sounding names. Always verify citations."
  },
  {
    id: "ff-11", type: "myth-vs-truth", title: "AI Will Take All Jobs",
    hook: "The most repeated AI myth — debunked with data.",
    mythStatement: "AI will replace most human jobs within 5 years.",
    truthStatement: "AI will transform jobs, not eliminate them. Historical pattern: ATMs didn't kill bank teller jobs — they shifted them to advisory roles. AI automates tasks, not entire jobs. The World Economic Forum estimates AI will create 97M new roles by 2025 while displacing 85M.",
    content: "Every technology wave creates this fear. The printing press didn't kill scribes — it created publishers, editors, and journalists. The key: workers who learn to use AI tools will replace workers who don't.",
    visual: "compare", visualData: { before: "MYTH: AI replaces all jobs", after: "TRUTH: AI replaces tasks, creates new roles" },
    category: "Management", difficulty: "beginner", xp: 35, tokens: 7,
    shareSnippet: "AI won't take your job. A person using AI will take your job."
  },
  {
    id: "ff-13", type: "myth-vs-truth", title: "AI Is Always Neutral",
    hook: "AI has biases. Here's why and what to do about it.",
    mythStatement: "AI is objective and unbiased because it's a machine.",
    truthStatement: "AI inherits biases from its training data, which reflects human biases. It may favor certain perspectives, demographics, or viewpoints. Always cross-reference sensitive topics and explicitly ask AI to consider multiple perspectives.",
    content: "Training data = internet text written by humans with biases. AI amplifies patterns in data, including stereotypes. Mitigation: ask for 'multiple perspectives', specify 'consider counterarguments', and never use AI alone for hiring, legal, or medical decisions.",
    visual: "diagram", visualData: { labels: ["Human Data (biased)", "→ AI Training", "→ Biased Patterns", "→ Your Output"] },
    category: "Social services", difficulty: "intermediate", xp: 45, tokens: 9,
    shareSnippet: "AI isn't neutral. It inherits biases from training data. Always ask for multiple perspectives."
  },
  {
    id: "ff-20", type: "micro-lesson", title: "The Anti-Fluff Filter",
    hook: "Kill AI waffle with this one prompt addition.",
    content: "Add to any prompt: 'No filler. No generic advice. Every sentence must contain a specific, actionable insight or a concrete example. If you can't be specific, say so.' This eliminates 'In today's fast-paced world...' and 'It's important to remember...' garbage.",
    visual: "compare", visualData: { before: "In today's fast-paced world, marketing is more important than ever...", after: "Allocate 60% of budget to the channel with highest 30-day ROAS. Cut channels under 2x return." },
    category: "Computer & math", difficulty: "beginner", xp: 45, tokens: 9,
    tryPrompt: "Add the anti-fluff filter to your next prompt. Compare before and after.",
    shareSnippet: "'No filler. Every sentence must contain a specific insight or concrete example.' — The anti-fluff filter."
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
