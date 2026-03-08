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
