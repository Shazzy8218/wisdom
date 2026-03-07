// Sample data for Wisdom AI

export const QUOTES = [
  "The best way to predict the future is to create it with intelligence.",
  "AI doesn't replace thinking — it amplifies it.",
  "A well-crafted prompt is worth a thousand searches.",
  "Mastery isn't about knowing everything. It's about knowing what to ask.",
  "The gap between you and AI mastery is one lesson a day.",
  "Intelligence is not fixed. It compounds with every question you ask.",
  "Verify everything. Trust nothing blindly. That's real AI literacy.",
  "The future belongs to those who learn to collaborate with machines.",
  "Your prompts are your superpower. Sharpen them daily.",
  "Every expert was once a beginner who refused to stop learning.",
  "The quality of your AI output is the quality of your input.",
  "Don't just use AI — understand it. That's the real advantage.",
];

export interface MicroLesson {
  id: string;
  title: string;
  hook: string;
  track: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  xp: number;
  tokens: number;
  visual: string;
  interaction: "tap-reveal" | "choice" | "fill-in" | "drag-drop";
  content: string;
  tryPrompt: string;
  options?: string[];
  correctAnswer?: number;
}

export const MICRO_LESSONS: MicroLesson[] = [
  {
    id: "l1",
    title: "The 3-Part Prompt Formula",
    hook: "Most people write vague prompts. Here's the formula pros use.",
    track: "Prompting & Communication",
    category: "Computer & math",
    difficulty: "beginner",
    xp: 50,
    tokens: 10,
    visual: "formula",
    interaction: "choice",
    content: "Every great prompt has 3 parts: Role + Task + Format. Example: 'You are a senior copywriter (Role). Write 3 email subject lines for a SaaS launch (Task). Keep each under 50 characters (Format).'",
    tryPrompt: "Try writing a prompt using Role + Task + Format for your own use case.",
    options: ["Role + Task + Format", "Question + Answer + Follow-up", "Topic + Length + Style", "Input + Process + Output"],
    correctAnswer: 0,
  },
  {
    id: "l2",
    title: "Spotting AI Hallucinations",
    hook: "AI lies confidently. Here's how to catch it every time.",
    track: "AI Basics",
    category: "Computer & math",
    difficulty: "beginner",
    xp: 60,
    tokens: 12,
    visual: "warning",
    interaction: "tap-reveal",
    content: "Hallucinations are when AI generates false information that sounds real. Red flags: specific dates without sources, invented citations, confident tone about uncertain topics. Always verify: names, dates, statistics, and legal/medical claims.",
    tryPrompt: "Ask AI a factual question and then verify the answer using a second source.",
  },
  {
    id: "l3",
    title: "AI for Email Templates",
    hook: "Write professional emails 10x faster with this template.",
    track: "Productivity & Business",
    category: "Office & admin",
    difficulty: "beginner",
    xp: 45,
    tokens: 8,
    visual: "template",
    interaction: "choice",
    content: "Prompt: 'Write a professional email to [recipient] about [topic]. Tone: [formal/friendly]. Include: greeting, main point in 2 sentences, clear call-to-action, sign-off.' This template works for 90% of business emails.",
    tryPrompt: "Use this template to draft an email you've been putting off.",
    options: ["Include greeting + main point + CTA", "Write everything in one paragraph", "Start with 'Dear Sir/Madam'", "Make it as long as possible"],
    correctAnswer: 0,
  },
  {
    id: "l4",
    title: "Constraint Prompting",
    hook: "The secret to getting exactly what you want from AI.",
    track: "Prompting & Communication",
    category: "Computer & math",
    difficulty: "intermediate",
    xp: 70,
    tokens: 15,
    visual: "constraints",
    interaction: "choice",
    content: "Constraints narrow AI output. Instead of 'Write a blog post', try: 'Write a 300-word blog post for small business owners about email marketing. Use simple language. Include 3 actionable tips. No jargon.' More constraints = more precise output.",
    tryPrompt: "Add 3 constraints to a prompt you've used before and compare the outputs.",
    options: ["Add word count, audience, and format constraints", "Just say 'be specific'", "Write longer prompts", "Use technical language"],
    correctAnswer: 0,
  },
  {
    id: "l5",
    title: "AI Budget Planner",
    hook: "Create a personal budget in 60 seconds with AI.",
    track: "AI for Daily Life",
    category: "Business & finance",
    difficulty: "beginner",
    xp: 55,
    tokens: 10,
    visual: "money",
    interaction: "fill-in",
    content: "Prompt: 'I earn $[X]/month. My fixed expenses are [list]. Create a 50/30/20 budget breakdown with specific dollar amounts. Include 3 areas where I might be overspending.' AI can't access your bank — but it can structure your thinking.",
    tryPrompt: "Use AI to create your own 50/30/20 budget right now.",
  },
  {
    id: "l6",
    title: "Tone Control Mastery",
    hook: "Same message, completely different impact. Tone is everything.",
    track: "Prompting & Communication",
    category: "Arts & media",
    difficulty: "intermediate",
    xp: 65,
    tokens: 12,
    visual: "tone",
    interaction: "choice",
    content: "Adding tone instructions transforms output. Compare: 'Write about productivity' vs 'Write about productivity in a witty, conversational tone as if explaining to a friend over coffee.' Tone options: professional, casual, academic, empathetic, urgent, humorous.",
    tryPrompt: "Rewrite the same message in 3 different tones and see how the meaning shifts.",
    options: ["Specify the exact tone you want", "AI always picks the right tone", "Tone doesn't matter for business", "Use ALL CAPS for emphasis"],
    correctAnswer: 0,
  },
  {
    id: "l7",
    title: "SOP Generator",
    hook: "Turn any process into a documented SOP in minutes.",
    track: "Productivity & Business",
    category: "Management",
    difficulty: "intermediate",
    xp: 75,
    tokens: 15,
    visual: "document",
    interaction: "choice",
    content: "Prompt: 'Create a step-by-step Standard Operating Procedure for [process]. Include: purpose, scope, required tools, numbered steps with details, common mistakes to avoid, and a checklist summary.' Perfect for onboarding, training, and consistency.",
    tryPrompt: "Generate an SOP for a process you repeat weekly at work.",
    options: ["Purpose + Steps + Checklist + Mistakes", "Just list the steps", "Write it as a paragraph", "Keep it to 3 bullet points"],
    correctAnswer: 0,
  },
  {
    id: "l8",
    title: "AI Safety Red Flags",
    hook: "These 5 signs mean you should NOT trust the AI output.",
    track: "AI Basics",
    category: "Protective service",
    difficulty: "beginner",
    xp: 50,
    tokens: 10,
    visual: "shield",
    interaction: "tap-reveal",
    content: "Never trust AI when it: 1) Cites specific studies you can't find, 2) Gives medical/legal advice, 3) Claims real-time data without web access, 4) Provides exact statistics without sources, 5) Says 'always' or 'never' about complex topics. Verify everything.",
    tryPrompt: "Ask AI a medical question and practice identifying which parts need professional verification.",
  },
  {
    id: "l9",
    title: "Brainstorm Multiplier",
    hook: "Get 10x more creative ideas with this one technique.",
    track: "Creativity",
    category: "Arts & media",
    difficulty: "beginner",
    xp: 55,
    tokens: 10,
    visual: "lightbulb",
    interaction: "choice",
    content: "Instead of 'Give me ideas for X', use: 'Give me 20 ideas for X. Make the first 10 practical and the last 10 wildly creative. Then combine the best practical idea with the best creative idea into a hybrid concept.' This forces AI past generic suggestions.",
    tryPrompt: "Use this technique to brainstorm ideas for a project you're working on.",
    options: ["Ask for 20 ideas split practical/creative", "Ask for 'some ideas'", "Ask for exactly 3 ideas", "Ask for the best single idea"],
    correctAnswer: 0,
  },
  {
    id: "l10",
    title: "Negotiation Script Builder",
    hook: "AI can write your negotiation script. Here's how.",
    track: "AI for Money",
    category: "Sales",
    difficulty: "intermediate",
    xp: 70,
    tokens: 14,
    visual: "handshake",
    interaction: "choice",
    content: "Prompt: 'I need to negotiate [situation]. My position: [details]. Their likely position: [guess]. Write a negotiation script with: opening statement, 3 key arguments, 2 concession points I can offer, responses to likely objections, and a closing ask.' Practice before the real conversation.",
    tryPrompt: "Build a negotiation script for your next salary review or vendor discussion.",
    options: ["Include arguments + concessions + objection handling", "Just state what you want", "Be aggressive and firm only", "Wing it and see what happens"],
    correctAnswer: 0,
  },
];

export const MASTERY_CATEGORIES = [
  { id: "management", name: "Management", icon: "👔", score: 12 },
  { id: "business-finance", name: "Business & Finance", icon: "💰", score: 8 },
  { id: "computer-math", name: "Computer & Math", icon: "💻", score: 25 },
  { id: "architecture", name: "Architecture & Engineering", icon: "🏗️", score: 3 },
  { id: "life-sciences", name: "Life & Social Sciences", icon: "🔬", score: 5 },
  { id: "social-services", name: "Social Services", icon: "🤝", score: 0 },
  { id: "legal", name: "Legal", icon: "⚖️", score: 2 },
  { id: "education", name: "Education & Library", icon: "📚", score: 7 },
  { id: "arts-media", name: "Arts & Media", icon: "🎨", score: 15 },
  { id: "healthcare-pract", name: "Healthcare Practitioners", icon: "⚕️", score: 1 },
  { id: "healthcare-support", name: "Healthcare Support", icon: "🏥", score: 0 },
  { id: "protective", name: "Protective Service", icon: "🛡️", score: 4 },
  { id: "food-serving", name: "Food & Serving", icon: "🍽️", score: 0 },
  { id: "grounds", name: "Grounds Maintenance", icon: "🌿", score: 0 },
  { id: "personal-care", name: "Personal Care", icon: "💆", score: 0 },
  { id: "sales", name: "Sales", icon: "📊", score: 10 },
  { id: "office-admin", name: "Office & Admin", icon: "📋", score: 18 },
  { id: "agriculture", name: "Agriculture", icon: "🌾", score: 0 },
  { id: "construction", name: "Construction", icon: "🔨", score: 0 },
  { id: "installation", name: "Installation & Repair", icon: "🔧", score: 0 },
  { id: "production", name: "Production", icon: "🏭", score: 0 },
  { id: "transportation", name: "Transportation", icon: "🚛", score: 0 },
];

export const TRACKS = [
  { id: "basics", name: "AI Basics", icon: "🧠", lessons: 12, completed: 3, color: "from-blue-500/20 to-blue-600/5" },
  { id: "prompting", name: "Prompting & Communication", icon: "✍️", lessons: 15, completed: 5, color: "from-primary/20 to-primary/5" },
  { id: "productivity", name: "Productivity & Business", icon: "⚡", lessons: 10, completed: 2, color: "from-amber-500/20 to-amber-600/5" },
  { id: "creativity", name: "Creativity", icon: "🎨", lessons: 8, completed: 1, color: "from-purple-500/20 to-purple-600/5" },
  { id: "daily-life", name: "AI for Daily Life", icon: "🏠", lessons: 14, completed: 0, color: "from-green-500/20 to-green-600/5" },
  { id: "money", name: "AI for Money", icon: "💵", lessons: 10, completed: 0, color: "from-emerald-500/20 to-emerald-600/5" },
  { id: "business", name: "AI for Business", icon: "🏢", lessons: 12, completed: 0, color: "from-cyan-500/20 to-cyan-600/5" },
  { id: "survival", name: "AI Survival Basics", icon: "🔥", lessons: 8, completed: 0, color: "from-orange-500/20 to-orange-600/5" },
];

export const GAMES = [
  { id: "prompt-puzzle", name: "Prompt Puzzle", description: "Drag prompt blocks into the correct order", icon: "🧩", level: 1, bestScore: 0 },
  { id: "hallucination-hunter", name: "Hallucination Hunter", description: "Spot the AI-generated false claims", icon: "🔍", level: 1, bestScore: 0 },
  { id: "output-duel", name: "Output Duel", description: "Compare outputs and pick the winner", icon: "⚔️", level: 1, bestScore: 0 },
  { id: "workflow-builder", name: "Workflow Builder", description: "Connect the workflow steps correctly", icon: "🔗", level: 1, bestScore: 0 },
  { id: "time-trial", name: "Time Trial", description: "Pick the best prompt in 60 seconds", icon: "⏱️", level: 1, bestScore: 0 },
  { id: "prompt-surgery", name: "Prompt Surgery", description: "Remove the fluff, keep the intent", icon: "✂️", level: 1, bestScore: 0 },
  { id: "context-builder", name: "Context Builder", description: "Choose which context matters most", icon: "🎯", level: 1, bestScore: 0 },
  { id: "risk-check", name: "Risk & Privacy Check", description: "Find and fix privacy issues in prompts", icon: "🛡️", level: 1, bestScore: 0 },
];

export function getLevelLabel(score: number): string {
  if (score >= 90) return "Master";
  if (score >= 75) return "Architect";
  if (score >= 60) return "Strategist";
  if (score >= 40) return "Operator";
  if (score >= 20) return "Builder";
  return "Novice";
}

export function getLevelColor(score: number): string {
  if (score >= 90) return "text-gradient-gold";
  if (score >= 75) return "text-accent-red";
  if (score >= 40) return "text-foreground";
  return "text-muted-foreground";
}
