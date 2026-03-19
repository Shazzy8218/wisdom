// Core AI Mastery Tracks — the guided learning paths for AI mastery + money

// CategoryTrack type is in categories.ts — no circular import needed

export interface CoreTrackMeta {
  id: string;
  name: string;
  icon: string;
  tagline: string;
  description: string;
  whoFor: string;
  outcome: string;
  moneyAngle: string;
  color: string;
  modules: string[];
  valueProp: string;
  outcomes: string[];
  advancedExamples: string[];
}

export const CORE_TRACKS: CoreTrackMeta[] = [
  {
    id: "ai-basics",
    name: "AI Basics",
    icon: "🧠",
    tagline: "Understand AI before you use it.",
    description: "Learn what AI actually is, how LLMs work, their real limitations, and how to think WITH AI — not just ask random questions.",
    whoFor: "Total beginners, curious learners, anyone confused by AI hype.",
    outcome: "You'll understand how AI thinks, where it fails, and how to verify every output.",
    moneyAngle: "People who understand AI make better decisions — and better decisions = more money saved and earned.",
    color: "from-blue-500/20 to-blue-600/5",
    valueProp: "Build an unshakable AI foundation that separates you from 95% of users who blindly trust outputs — giving you the critical thinking edge that prevents costly mistakes and unlocks strategic AI deployment.",
    outcomes: [
      "Instantly identify AI hallucinations and verify any output in under 60 seconds",
      "Structure conversations with AI that produce expert-level results on the first attempt",
      "Evaluate when AI is the right tool vs. when it will waste your time",
      "Explain AI capabilities and limitations to stakeholders with authority and confidence",
    ],
    advancedExamples: [
      "A marketing director used hallucination detection skills to catch a $200k campaign built on fabricated competitor data — saving the company from a PR disaster",
      "An entrepreneur leveraged AI thinking frameworks to validate 3 business ideas in one weekend, launching the winner to $8k/month within 90 days",
    ],
    modules: [
      "What AI Actually Is (And Isn't)",
      "How LLMs Generate Answers",
      "AI Limitations & Hallucinations",
      "Prompting Basics — Your First Good Prompt",
      "How to Verify AI Answers",
      "Thinking With AI, Not Just Asking",
      "AI vs Search — When to Use Which",
      "Context Windows & Memory",
    ],
  },
  {
    id: "prompting",
    name: "Prompting & Communication",
    icon: "✍️",
    tagline: "Ask better. Get better.",
    description: "Master the art of communicating with AI — structure prompts, control output, and get exactly what you need on the first try.",
    whoFor: "Anyone who uses AI but gets mediocre results.",
    outcome: "You'll write prompts that produce usable, high-quality output every time.",
    moneyAngle: "Better prompts = faster work = more output per hour = more earning potential.",
    color: "from-primary/20 to-primary/5",
    valueProp: "Transform AI from a mediocre assistant into a precision instrument — mastering the communication layer that determines whether you get generic filler or client-ready, revenue-generating output.",
    outcomes: [
      "Write prompts that produce publication-ready content requiring zero editing",
      "Control AI output format, tone, length, and complexity with surgical precision",
      "Build reusable prompt templates that save 10+ hours per week across all workflows",
      "Chain multi-step prompts that accomplish complex tasks no single prompt can handle",
    ],
    advancedExamples: [
      "A freelance copywriter built a prompt library that reduced client deliverable time from 4 hours to 25 minutes — tripling their effective hourly rate to $450/hr",
      "A sales team implemented few-shot prompt templates for proposals, achieving a 300% increase in close rate within one quarter",
    ],
    modules: [
      "The Role + Goal + Context Formula",
      "Constraint Prompting",
      "Follow-Up Questioning",
      "Rewriting & Refining Outputs",
      "Concise vs Deep Responses",
      "Chain-of-Thought & Step-by-Step",
      "Few-Shot Learning",
      "Business Messaging With AI",
    ],
  },
  {
    id: "productivity",
    name: "Productivity & Business",
    icon: "⚡",
    tagline: "Work smarter. Ship faster.",
    description: "Use AI to plan, organize, build SOPs, handle meetings, clean up processes, and run your work life like a machine.",
    whoFor: "Freelancers, employees, managers, and founders.",
    outcome: "You'll automate the boring stuff and focus on high-value work.",
    moneyAngle: "Every hour saved is an hour you can bill, sell, or invest in growth.",
    color: "from-amber-500/20 to-amber-600/5",
    valueProp: "Reclaim 15–20 hours per week by deploying AI across planning, documentation, meetings, and process management — converting saved time directly into revenue or strategic advantage.",
    outcomes: [
      "Build complete SOPs and process documentation in minutes instead of days",
      "Automate meeting summaries, action items, and follow-ups end-to-end",
      "Design AI-powered workflow systems that run your operations with minimal oversight",
      "Create offers, proposals, and business plans at 10x the speed of manual work",
    ],
    advancedExamples: [
      "A solo consultant automated their entire client delivery pipeline with AI SOPs, scaling from 3 to 12 clients without hiring — generating $25k/month in profit",
      "A project manager used AI meeting automation to eliminate 8 hours of weekly admin, redirecting that time to land a $150k contract expansion",
    ],
    modules: [
      "AI-Powered Planning & Scheduling",
      "Task Systems & Prioritization",
      "SOP Creation With AI",
      "Research Summaries in Minutes",
      "Meeting Notes to Action Items",
      "Business Process Cleanup",
      "Offer Building & Positioning",
      "Workflow Creation & Automation",
    ],
  },
  {
    id: "creativity",
    name: "Creativity",
    icon: "🎨",
    tagline: "Create more. Create faster.",
    description: "Use AI for brainstorming, naming, scripts, image prompting, content ideas, visual storytelling, and branding.",
    whoFor: "Creators, marketers, designers, writers, and entrepreneurs.",
    outcome: "You'll generate 10x more creative ideas and turn them into real content.",
    moneyAngle: "Creative output is sellable — learn to produce it at scale and you create revenue streams.",
    color: "from-purple-500/20 to-purple-600/5",
    valueProp: "Unlock an inexhaustible creative engine — producing more high-quality content, brand assets, and creative deliverables in one day than most teams produce in a month.",
    outcomes: [
      "Generate 50+ usable creative concepts in a single brainstorming session",
      "Produce scroll-stopping visual content with AI image prompting mastery",
      "Build complete brand identities — name, voice, visuals, messaging — in hours",
      "Repurpose one piece of content into 15+ platform-specific assets automatically",
    ],
    advancedExamples: [
      "A brand strategist used AI-powered naming and identity creation to launch a DTC brand that hit $50k in first-month revenue with zero prior audience",
      "A content creator built a repurposing pipeline producing 120 social posts per month from 4 blog articles — growing to 100k followers in 6 months",
    ],
    modules: [
      "Brainstorming at Scale",
      "Naming & Brand Ideation",
      "Scripts & Storytelling",
      "Image Prompting Mastery",
      "Content Ideas That Convert",
      "Visual Storytelling With AI",
      "Branding & Identity Ideation",
      "Repurposing Content Across Platforms",
    ],
  },
  {
    id: "daily-life",
    name: "AI for Daily Life",
    icon: "🏠",
    tagline: "Make life easier, one prompt at a time.",
    description: "Use AI to handle life admin, communication, personal finance, health habits, learning, home tasks, travel, and creative hobbies.",
    whoFor: "Anyone who wants to save time in daily life.",
    outcome: "You'll use AI as a personal assistant for everything outside of work.",
    moneyAngle: "Time saved in daily life = time you can invest in earning, learning, or resting.",
    color: "from-green-500/20 to-green-600/5",
    valueProp: "Deploy AI as your personal chief of staff — handling life logistics, financial planning, health optimization, and daily decisions so you operate at peak efficiency in every area of life.",
    outcomes: [
      "Automate personal finance tracking, budgeting, and expense optimization",
      "Build AI-powered health and habit systems with accountability frameworks",
      "Handle complex travel planning, home maintenance, and life admin in minutes",
      "Accelerate personal learning by 3–5x using AI-enhanced memory and study techniques",
    ],
    advancedExamples: [
      "A busy executive used AI life admin automation to reclaim 12 hours per week, investing that time in a side project that now generates $5k/month passively",
      "A family used AI-powered financial planning to identify $14k in annual savings and optimize investments for a 40% improvement in portfolio returns",
    ],
    modules: [
      "Life Admin & Organization",
      "Communication Templates",
      "Personal Money Management",
      "Health & Habit Tracking",
      "Learning & Memory Techniques",
      "Home & Maintenance Help",
      "Travel & Errands Planning",
      "Creativity at Home",
    ],
  },
  {
    id: "ai-money",
    name: "AI for Money",
    icon: "💵",
    tagline: "Turn AI skills into income.",
    description: "Learn realistic, skill-based ways AI can help you earn more — from freelancing to offers to productizing your knowledge.",
    whoFor: "Anyone who wants to use AI to make money — without hype or fake promises.",
    outcome: "You'll have real, actionable paths to earn income using AI skills.",
    moneyAngle: "This IS the money track. Every module connects directly to income.",
    color: "from-emerald-500/20 to-emerald-600/5",
    valueProp: "Build a concrete, step-by-step income system using AI skills — from identifying your highest-value offering to landing clients and scaling to $5k–$20k/month without fake promises or get-rich schemes.",
    outcomes: [
      "Identify your most marketable AI-enhanced skill and package it as a sellable service",
      "Build a portfolio and professional presence that attracts high-paying clients",
      "Write outreach sequences and proposals that convert at 3–5x industry averages",
      "Productize your knowledge into scalable digital assets generating passive income",
      "Recognize and avoid AI money scams while maintaining realistic income expectations",
    ],
    advancedExamples: [
      "A laid-off accountant used AI to launch an automated bookkeeping service, reaching $12k/month recurring revenue within 4 months with zero employees",
      "A teacher productized their curriculum expertise into an AI-powered course creation service, generating $8k/month in passive income from digital products",
    ],
    modules: [
      "Finding a Skill to Sell",
      "Service Ideas Using AI",
      "Freelancing Profiles & Proposals",
      "Portfolio Building With AI",
      "Outreach & Follow-Ups",
      "Offer Building & Pricing",
      "Scam Avoidance & Realistic Thinking",
      "Saving Time = Earning More",
      "Productize Your Knowledge",
    ],
  },
  {
    id: "ai-business",
    name: "AI for Business",
    icon: "🏢",
    tagline: "Run your business on AI rails.",
    description: "Use AI to handle customer support, reviews, SOPs, scheduling, marketing, sales pipelines, proposals, and onboarding.",
    whoFor: "Business owners, operators, and managers.",
    outcome: "You'll build AI-powered systems that run your business more efficiently.",
    moneyAngle: "Efficient operations = higher margins = more profit with less effort.",
    color: "from-cyan-500/20 to-cyan-600/5",
    valueProp: "Transform your business into an AI-powered operation where customer support, marketing, sales, and onboarding run on intelligent systems — cutting operational costs by 40% while improving quality and speed.",
    outcomes: [
      "Build AI-powered customer support that resolves 80% of inquiries without human intervention",
      "Create automated marketing calendars and sales pipeline messaging at enterprise quality",
      "Design client onboarding and proposal systems that close deals faster with less manual work",
      "Deploy review response and reputation management systems that build trust at scale",
    ],
    advancedExamples: [
      "A service business owner automated their entire sales pipeline with AI — from lead qualification to proposal generation — increasing close rate by 250% and adding $30k/month in new revenue",
      "A restaurant chain deployed AI-powered review responses and marketing systems across 8 locations, saving $4k/month in staffing while improving customer satisfaction scores by 35%",
    ],
    modules: [
      "Customer Support With AI",
      "Review & Feedback Responses",
      "SOP Creation & Documentation",
      "Scheduling & Follow-Up Systems",
      "Marketing Calendar Building",
      "Sales Pipeline Messaging",
      "Lead Qualification & CRM",
      "Proposal & Client Onboarding",
    ],
  },
  {
    id: "ai-survival",
    name: "AI Survival Basics",
    icon: "🔥",
    tagline: "Think clearly. Act decisively.",
    description: "Use AI for emergency prep, budgeting under pressure, decision-making frameworks, negotiation, and clear thinking.",
    whoFor: "Everyone. These are life skills powered by AI.",
    outcome: "You'll handle high-pressure situations with AI as your backup brain.",
    moneyAngle: "Clear thinking under pressure prevents costly mistakes — in business and life.",
    color: "from-orange-500/20 to-orange-600/5",
    valueProp: "Build an unshakable decision-making toolkit for high-stakes moments — using AI to think clearly under pressure, negotiate effectively, and prevent the costly mistakes that derail careers and finances.",
    outcomes: [
      "Deploy AI decision frameworks that eliminate panic-driven choices in crisis situations",
      "Build emergency budgets and financial contingency plans in under 30 minutes",
      "Prepare AI-powered negotiation strategies that consistently secure better outcomes",
      "Navigate difficult conversations with AI-generated scripts that maintain relationships while achieving objectives",
    ],
    advancedExamples: [
      "A startup founder used AI decision frameworks during a funding crisis to restructure operations in 48 hours — saving the company and securing a $2M bridge round",
      "A homeowner used AI-powered negotiation prep to reduce a contractor dispute from $45k to $12k — saving $33k in a single conversation",
    ],
    modules: [
      "Emergency Preparedness Checklists",
      "Basic First-Aid Info Organization",
      "Emergency Budgeting",
      "Decision-Making Frameworks",
      "Negotiation With AI Support",
      "Safe Troubleshooting",
      "Thinking Clearly Under Pressure",
      "Difficult Conversations",
    ],
  },
  {
    id: "ai-markets",
    name: "AI for Market Research & Trading Discipline",
    icon: "📈",
    tagline: "Research smarter. Trade with discipline.",
    description: "Use AI to summarize market info, organize trading journals, compare scenarios, review patterns, and build discipline — NOT for financial advice or guaranteed trades.",
    whoFor: "Aspiring traders, investors, and anyone interested in markets.",
    outcome: "You'll use AI as a research and discipline tool — never as a crystal ball.",
    moneyAngle: "Better research and discipline reduce costly mistakes in any market activity.",
    color: "from-yellow-500/20 to-yellow-600/5",
    valueProp: "Build institutional-grade research and discipline systems using AI — transforming how you analyze markets, journal trades, and manage risk to minimize losses and maximize informed decision-making.",
    outcomes: [
      "Build AI-assisted trade journals that surface patterns across hundreds of entries automatically",
      "Create pre-trade checklists that enforce discipline and eliminate emotional decision-making",
      "Summarize market news and research into actionable thesis documents in minutes",
      "Design personal risk frameworks that protect capital during volatile conditions",
    ],
    advancedExamples: [
      "A part-time trader used AI journaling analysis to identify a recurring emotional pattern costing them $800/month in losses — eliminating it improved annual returns by 23%",
      "An investor built AI-powered news summarization and thesis tracking that reduced research time from 3 hours to 20 minutes daily while improving coverage of relevant catalysts",
    ],
    modules: [
      "Market Vocabulary With AI",
      "AI-Assisted Trade Journaling",
      "Pre-Trade Checklist Building",
      "Post-Trade Review Framework",
      "Risk Framework Basics",
      "News & Thesis Summarization",
      "Pattern Review & Note Organization",
    ],
  },
];

export const MONEY_TRACK_IDS = ["ai-money", "ai-business", "ai-markets"];

export function getCoreTrack(id: string): CoreTrackMeta | undefined {
  return CORE_TRACKS.find(t => t.id === id);
}

export function getRecommendedTracks(goalMode: string, _outputMode: string): CoreTrackMeta[] {
  const priority: Record<string, string[]> = {
    income: ["ai-money", "prompting", "productivity", "ai-business", "ai-markets"],
    impact: ["ai-basics", "productivity", "creativity", "ai-business", "prompting"],
  };
  const ids = priority[goalMode] || priority.income;
  return ids.map(id => CORE_TRACKS.find(t => t.id === id)!).filter(Boolean);
}
