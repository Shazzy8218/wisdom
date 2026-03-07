// Feed card types and starter content for the Nerd Doomscroll

export type FeedCardType = "quick-fact" | "micro-lesson" | "news" | "challenge" | "myth-vs-truth" | "video";

export interface FeedCard {
  id: string;
  type: FeedCardType;
  title: string;
  hook: string;
  content: string;
  visual: "diagram" | "infographic" | "compare" | "steps" | "chart" | "icon";
  visualData?: { labels?: string[]; steps?: string[]; before?: string; after?: string };
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
  confidence?: number; // 0-100 for news
  mythStatement?: string;
  truthStatement?: string;
}

// 30+ starter cards covering all types
export const STARTER_FEED: FeedCard[] = [
  // === QUICK FACTS ===
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
    id: "ff-3", type: "quick-fact", title: "Context Window = Short-Term Memory",
    hook: "AI can only 'see' a fixed amount of text at once.",
    content: "GPT-4 sees ~128K tokens (≈300 pages). Claude sees ~200K. But attention degrades in the middle — put critical info at the START and END of your prompt. This is called the 'lost in the middle' problem.",
    visual: "diagram", visualData: { labels: ["Strong Recall ←", "Middle (weak)", "→ Strong Recall"] },
    category: "Computer & math", difficulty: "intermediate", xp: 45, tokens: 9,
    shareSnippet: "AI forgets what's in the middle of long prompts. Put key info at the start AND end."
  },
  {
    id: "ff-4", type: "quick-fact", title: "Every AI Has a 'Temperature'",
    hook: "One setting controls creativity vs. accuracy.",
    content: "Temperature 0 = robotic, deterministic, same answer every time. Temperature 1+ = creative, varied, sometimes unhinged. For code and data: use 0-0.3. For writing and brainstorming: use 0.7-1.0. Most people never change this.",
    visual: "compare", visualData: { before: "Temp 0.1: 'The capital of France is Paris.'", after: "Temp 1.2: 'Paris! The beating heart of French civilization, where every cobblestone whispers history...'" },
    category: "Computer & math", difficulty: "intermediate", xp: 40, tokens: 8,
    interaction: "choice", options: ["0-0.3 for accuracy, 0.7+ for creativity", "Always max temperature", "Temperature doesn't matter", "Higher = faster"], correctAnswer: 0,
    shareSnippet: "Temperature 0 = robot. Temperature 1 = poet. Most people never change this setting."
  },

  // === MICRO-LESSONS ===
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
    id: "ff-7", type: "micro-lesson", title: "System Prompts: Your Secret Weapon",
    hook: "This is the instruction layer most people don't know exists.",
    content: "A system prompt is a persistent instruction that shapes every AI response. Think of it as the 'personality OS'. Example: 'You are a startup advisor with 20 years of experience. You give direct, no-BS advice. Always include a specific next step. Never use jargon without explaining it.' Now every reply follows these rules.",
    visual: "diagram", visualData: { labels: ["System: Define role + rules", "↓ Shapes every response", "User: Specific question", "↓ Answer follows rules"] },
    category: "Computer & math", difficulty: "intermediate", xp: 60, tokens: 12,
    tryPrompt: "Write a system prompt for an AI assistant tailored to your daily work.",
    shareSnippet: "System prompts are AI's personality OS. Most users don't even know they exist."
  },

  // === CHALLENGES ===
  {
    id: "ff-8", type: "challenge", title: "Pick the Best Prompt",
    hook: "Only one of these will get you a great output.",
    content: "You need AI to help plan a product launch. Which prompt wins?",
    visual: "icon", category: "Management", difficulty: "beginner", xp: 40, tokens: 8,
    interaction: "choice",
    options: [
      "Help me launch my product",
      "You are a product marketing manager. Create a 4-week launch plan for a B2B SaaS tool. Include: timeline, channels, budget allocation, and KPIs.",
      "Write a really detailed plan for launching something",
      "Give me a marketing plan please"
    ], correctAnswer: 1,
    shareSnippet: "The best prompt has a Role, a Task, and specific Constraints. Generic = generic output."
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
    id: "ff-10", type: "challenge", title: "Fix This Output",
    hook: "This AI response is mediocre. Make it great.",
    content: "AI wrote: 'Marketing is important for businesses. You should do social media. Also try email marketing. Content is king.'\n\nWhat's the fix? Add constraints: 'Rewrite for a B2B SaaS startup with $5K/month budget. Prioritize by ROI. Include specific tools and metrics for each channel.'",
    visual: "compare", visualData: { before: "Marketing is important. Do social media. Try email. Content is king.", after: "For $5K/month B2B SaaS: 1) LinkedIn outbound ($1.5K) — target 50 prospects/week, track reply rate. 2) SEO blog ($2K) — 4 posts/month targeting long-tail keywords..." },
    category: "Business & finance", difficulty: "intermediate", xp: 55, tokens: 11,
    tryPrompt: "Take a generic AI output you've gotten recently. Add 3 constraints and regenerate.",
    shareSnippet: "Generic prompts produce generic output. Adding 3 constraints transforms everything."
  },

  // === MYTH VS TRUTH ===
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
    id: "ff-12", type: "myth-vs-truth", title: "Longer Prompts = Better Results",
    hook: "More words ≠ more quality. Here's the real rule.",
    mythStatement: "The longer and more detailed your prompt, the better the AI output.",
    truthStatement: "Prompt quality beats prompt length. A focused 2-sentence prompt with clear constraints often outperforms a rambling paragraph. Key: be specific, not verbose. 'Write a 200-word product description for eco-friendly water bottles targeting college students' beats a 500-word unfocused brief.",
    content: "The sweet spot: enough detail to remove ambiguity, but short enough that every word earns its place. Think of it like a creative brief — the best ones are tight.",
    visual: "compare", visualData: { before: "500 words of vague instructions", after: "2 sentences with clear Role + Task + Format" },
    category: "Computer & math", difficulty: "beginner", xp: 30, tokens: 6,
    shareSnippet: "Prompt quality > prompt length. A focused 2-sentence prompt beats a rambling paragraph."
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

  // === NEWS / EVERGREEN ===
  {
    id: "ff-14", type: "news", title: "RAG: Why AI Can Now Search the Web",
    hook: "Retrieval-Augmented Generation changed everything.",
    content: "RAG lets AI pull real-time information from databases or the web before generating a response. Instead of relying only on training data, RAG-powered AI checks current sources first. This is why newer AI tools can cite actual URLs and provide up-to-date answers.",
    visual: "diagram", visualData: { labels: ["Your Question", "→ Retrieves live data", "→ Combines with AI knowledge", "→ Accurate, sourced answer"] },
    category: "Computer & math", difficulty: "intermediate", xp: 50, tokens: 10,
    source: "General Update — Evergreen Concept", confidence: 95,
    shareSnippet: "RAG = AI that checks real sources before answering. No more outdated responses."
  },
  {
    id: "ff-15", type: "news", title: "Multi-Modal AI: Beyond Text",
    hook: "AI now sees images, hears audio, and generates video.",
    content: "Multi-modal AI processes text, images, audio, and video simultaneously. You can now: upload a photo and ask questions about it, generate images from text, transcribe and summarize audio, and even create short videos from descriptions. This convergence means AI assistants will soon handle any media type natively.",
    visual: "diagram", visualData: { labels: ["Text ←→ Images ←→ Audio ←→ Video", "All in one model"] },
    category: "Computer & math", difficulty: "beginner", xp: 40, tokens: 8,
    source: "General Update — Evergreen Concept", confidence: 90,
    shareSnippet: "AI now processes text, images, audio, and video together. The assistant of the future handles everything."
  },

  // === MORE QUICK FACTS ===
  {
    id: "ff-16", type: "quick-fact", title: "Tokens ≠ Words",
    hook: "AI charges per token, not per word. Here's the conversion.",
    content: "1 token ≈ 0.75 words (or ~4 characters). 'Hamburger' = 3 tokens. 'I love AI' = 3 tokens. A 1,000-word essay ≈ 1,333 tokens. Knowing this helps you estimate costs and stay within context limits. Pro tip: technical jargon and non-English text use MORE tokens per word.",
    visual: "infographic", visualData: { labels: ["1 token ≈ 4 chars", "'Hello world' = 2 tokens", "1000 words ≈ 1333 tokens"] },
    category: "Computer & math", difficulty: "beginner", xp: 30, tokens: 6,
    shareSnippet: "AI charges per token, not per word. 1 token ≈ 4 characters. Know this to control costs."
  },
  {
    id: "ff-17", type: "quick-fact", title: "The Goldilocks Prompt",
    hook: "Not too vague. Not too long. Just right.",
    content: "The ideal prompt length is 30-80 words for most tasks. Under 10 words: too vague, AI guesses your intent. Over 150 words: AI may lose focus or contradict itself. The sweet spot: enough context to remove ambiguity + clear format instructions + one good example.",
    visual: "chart", visualData: { labels: ["Too Short (<10w)", "Sweet Spot (30-80w)", "Too Long (>150w)"] },
    category: "Computer & math", difficulty: "beginner", xp: 35, tokens: 7,
    shareSnippet: "The ideal AI prompt is 30-80 words. Enough to remove ambiguity, short enough to stay focused."
  },

  // === MORE CHALLENGES ===
  {
    id: "ff-18", type: "challenge", title: "Build the Workflow",
    hook: "Arrange these steps to create an AI-powered content pipeline.",
    content: "Put these in the right order for an AI content workflow:\nA) Edit and fact-check output\nB) Define audience and goal\nC) Generate first draft with AI\nD) Create system prompt with role + constraints\nE) Iterate with refinement prompts",
    visual: "steps", visualData: { steps: ["B → D → C → E → A"] },
    category: "Arts & media", difficulty: "intermediate", xp: 55, tokens: 11,
    interaction: "choice", options: ["B → D → C → E → A", "C → A → B → D → E", "A → B → C → D → E", "D → C → B → A → E"], correctAnswer: 0,
    shareSnippet: "AI workflow: Define goal → Set role → Generate → Iterate → Fact-check. Order matters."
  },

  // === MORE MICRO-LESSONS ===
  {
    id: "ff-19", type: "micro-lesson", title: "The Persona Stack",
    hook: "Layer 3 personas for expert-level AI output.",
    content: "Instead of one role, stack three: 'You are a senior copywriter (writing), data analyst (evidence), and behavioral psychologist (persuasion). Write a landing page for a fitness app that uses data-backed claims and psychological triggers.' Each persona contributes a unique strength to the output.",
    visual: "diagram", visualData: { labels: ["Persona 1: Skill", "+ Persona 2: Evidence", "+ Persona 3: Psychology", "= Expert-level output"] },
    category: "Computer & math", difficulty: "advanced", xp: 65, tokens: 13,
    tryPrompt: "Stack 3 relevant personas for your next AI task. Compare with a single-role prompt.",
    shareSnippet: "Stack 3 AI personas (skill + evidence + psychology) for expert-level output."
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
  return idx < 0; // returns true if now saved
}

export function getUnseenCards(): FeedCard[] {
  const seen = getSeenCardIds();
  return STARTER_FEED.filter(c => !seen.includes(c.id));
}
