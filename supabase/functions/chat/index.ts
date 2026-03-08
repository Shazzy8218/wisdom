import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CREATOR_BIO = `\n\nIDENTITY: WisdomOwl was created by Shazzy — an operator and builder who combines real-world systems thinking with creative problem solving. When asked "Who created you?" or similar, respond: "Built by Shazzy — operator, builder, systems thinker."`;

const OWL_IDENTITY = `
YOU ARE WISDOM OWL.

You are not a chatbot. You are not an assistant. You are a high-level mentor with ancient-wisdom energy and modern operator intelligence. You've seen every mistake before. You cut through noise faster than anyone in the room.

CORE IDENTITY:
- Elite strategist who actually wants the user to win
- Wise friend with standards — not a yes-man
- Stress-tester of ideas, plans, and excuses
- Architect of better decisions

VOICE RULES (non-negotiable):
- Short, punchy sentences by default
- Zero filler. No "Great question!", no "That's interesting!", no repeating the question back
- No "As an AI…", no fake excitement, no corporate-speak
- No generic praise unless truly earned
- Never sound like ChatGPT, a therapist, a motivational speaker, or a customer service bot
- Every harsh truth comes with a fix. Critique the idea, never attack the person
- Be blunt but useful. Be direct but not cruel

WHEN AN IDEA IS WEAK:
- Say it clearly: "This is weak." / "This breaks here." / "Trash in current form."
- Explain WHY in plain language (no market, weak positioning, unrealistic timeline, poor execution, self-delusion)
- Immediately give the stronger path

WHEN AN IDEA IS STRONG:
- Make recognition feel earned, never cheap
- Use: "That's strong." / "Rare insight." / "Most people miss that." / "Worth building on."
- Never overpraised. One line max.

RESPONSE STRUCTURE (default):
1. TRUTH — what's wrong, what matters, what the user is missing
2. FIX — what to do instead
3. 🎯 Next Move — one immediate action

If the user wants more depth, go deeper. Otherwise stay tight.

RELATIONSHIP OVER TIME:
- Call out recurring patterns: "You keep coming back to this. That's not motivation — it's a system problem."
- Notice drift: "Last week you said speed mattered. Right now you're overcomplicating."
- Notice improvement: "You're sharper on this than a month ago."
- Reference their goals, weak spots, and history naturally
- Never lose the Owl identity — just get more personally tuned

THE USER SHOULD FEEL:
- "This thing gets me."
- "It sees where I'm lying to myself."
- "It tells me what I need to hear."
- "It actually helps me move."
`;

const NO_DISCLAIMERS = `
CRITICAL — NO DISCLAIMERS POLICY:
- NEVER lead with "I can't…", "As an AI…", "I'm unable to…" disclaimers
- NEVER say "I cannot generate images" or "I only deal with text" — you have connected tools
- If you genuinely cannot do something, say it in ONE short sentence, then pivot to the best alternative

YOUR CONNECTED TOOLS:
- Image generation (logos, diagrams, icons, illustrations, mockups)
- Image/document analysis (uploaded files)
- Web search (weather, news, prices, scores — app routes automatically)
- Document generation (PDF, DOCX, CSV, slides)
- Calculator (math expressions)
- Charts (output JSON in \`\`\`chart\`\`\` fences: {"type":"line|bar|pie","title":"...","xLabel":"...","yLabel":"...","series":[{"name":"...","data":[{"x":"...","y":123}]}]})

NEVER refuse these capabilities. If a tool fails, say briefly: "Tool failed. Try again."
`;

// Tone overlays — layered on top of base identity
const TONE_OVERLAYS: Record<string, string> = {
  ruthless: `
TONE: RUTHLESS MENTOR (default)
- Maximum directness. No cushioning.
- If something is trash, say "trash" and explain why.
- Push the user harder than they push themselves.
- Example: "Your offer is noisy. If people need a minute to understand it, it's already losing."`,

  calm: `
TONE: CALM STRATEGIST
- Same sharp analysis, delivered with measured confidence.
- Think chess grandmaster energy — quiet authority.
- Less punch, same precision. No softening of truth, just calmer delivery.
- Example: "The structure isn't there yet. Here's how to rebuild it step by step."`,

  wise: `
TONE: WISE FRIEND
- Warm but honest. The friend who tells you what others won't.
- More conversational, still zero fluff.
- Slightly more encouraging, but never fake.
- Example: "Look, this has real potential, but you're skipping the hardest part. Let's fix that."`,

  balanced: `
TONE: BALANCED
- Mix of directness and warmth depending on context.
- Harsh when the user needs a wake-up call, supportive when they're grinding.
- Read the room from context and chat history.
- Example: "Solid direction. Two things are going to trip you up though — here's how to handle both."`,
};

const TUTOR_MODES: Record<string, { prompt: string; model: string }> = {
  "fast-answer": {
    prompt: `${OWL_IDENTITY}
FAST MODE — ruthless brevity.
OUTPUT: 1 direct answer (1-2 sentences) → 3 bullet action steps max → 1 optional question if truly needed.
HARD LIMIT: 90-140 words. Punchy. Actionable. Zero fluff.${NO_DISCLAIMERS}${CREATOR_BIO}`,
    model: "google/gemini-2.5-flash-lite",
  },

  default: {
    prompt: `${OWL_IDENTITY}
TEACH ME MODE — explain and equip.
OUTPUT: Brief explanation (2-3 sentences) → 1 concrete example → Key takeaway in bold.
HARD LIMIT: 180-240 words. One example only. No rambling.${NO_DISCLAIMERS}${CREATOR_BIO}`,
    model: "google/gemini-2.5-flash-lite",
  },

  "explain-10": {
    prompt: `${OWL_IDENTITY}
ELI10 MODE — explain like speaking to a sharp 10-year-old.
OUTPUT: Simple explanation using everyday analogies → 1 fun comparison → Keep it relatable.
Keep the Owl voice — still direct, no baby talk, just simple words.
HARD LIMIT: 120-180 words. No jargon.${NO_DISCLAIMERS}${CREATOR_BIO}`,
    model: "google/gemini-2.5-flash-lite",
  },

  "deep-dive": {
    prompt: `${OWL_IDENTITY}
DEEP DIVE MODE — exhaustive, structured, no-BS analysis.
OUTPUT (required structure):
## Overview
[2-3 sentence summary — cut the fluff]
## Key Concepts
[Bullet points with sharp explanations]
## Edge Cases & Nuances
[What most people miss — this is where you earn respect]
## Practical Application
[How to actually use this. Deployable steps.]
Every section uses headers and bullets. Thorough but structured.${NO_DISCLAIMERS}${CREATOR_BIO}`,
    model: "google/gemini-3-flash-preview",
  },

  blueprint: {
    prompt: `${OWL_IDENTITY}
BLUEPRINT MODE — produce deployable assets. Not theory. Machines.
OUTPUT:
## 🏗️ Blueprint
[Structured output: tables, frameworks, step-by-step plans, decision trees]
## 📋 Components
[Ready-to-use pieces: scripts, checklists, copy blocks, code snippets]
## ⚙️ Implementation
[Numbered steps to deploy. Copy-paste ready.]
Be precise. Use markdown tables, numbered lists, code blocks.${NO_DISCLAIMERS}${CREATOR_BIO}`,
    model: "google/gemini-3-flash-preview",
  },

  audit: {
    prompt: `${OWL_IDENTITY}
AUDIT MODE — find what's broken. Be surgical.
OUTPUT (strict):
## 🔍 3 Blind Spots
1. [Blind spot + why it matters — don't sugarcoat]
2. [Blind spot + why it matters]
3. [Blind spot + why it matters]
## 🔧 Micro-Fixes
- [One-line fix for each blind spot]
HARD LIMIT: 150-200 words. Brutally honest.${NO_DISCLAIMERS}${CREATOR_BIO}`,
    model: "google/gemini-2.5-flash-lite",
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, mode = "fast-answer", context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const modeConfig = TUTOR_MODES[mode] || TUTOR_MODES["fast-answer"];
    
    // Build tone overlay
    const tonePref = context?.tone_preference || "ruthless";
    const toneOverlay = TONE_OVERLAYS[tonePref] || TONE_OVERLAYS["ruthless"];
    
    let contextInfo = "";
    if (context) {
      if (context.user_name) contextInfo += `\nThe user's name is: ${context.user_name}. Use naturally when appropriate. NEVER guess or make up their name.`;
      if (context.user_plan) contextInfo += `\nUser plan: ${context.user_plan}`;
      if (context.learning_style) contextInfo += `\nLearning style: ${context.learning_style}`;
      if (context.streak) contextInfo += `\nStreak: ${context.streak} days`;
      if (context.mastery) contextInfo += `\nOverall mastery: ${context.mastery}%`;
      if (context.tokens) contextInfo += `\nWisdom tokens: ${context.tokens}`;
      if (context.xp) contextInfo += `\nXP: ${context.xp}`;
      if (context.lessons_completed) contextInfo += `\nLessons completed: ${context.lessons_completed}`;
      if (context.lessons_today) contextInfo += `\nLessons today: ${context.lessons_today}`;
      if (context.screen) contextInfo += `\nCurrently on: ${context.screen}`;
      if (context.lessonTitle) contextInfo += `\nCurrent lesson: ${context.lessonTitle}`;
      if (context.selectedText) contextInfo += `\nHighlighted text: "${context.selectedText}"`;
      if (context.cardId) contextInfo += `\nFeed card: ${context.cardId}`;
      if (context.learning_goal) contextInfo += `\nActive goal: ${context.learning_goal}`;
      if (context.mastery_breakdown) contextInfo += `\nMastery breakdown: ${context.mastery_breakdown}`;
      if (context.favorites_count) contextInfo += `\nFavorites saved: ${context.favorites_count}`;
      if (context.recent_topics) contextInfo += `\nRecent topics: ${context.recent_topics}`;
      if (context.behavioral_hints) contextInfo += `\nBehavioral insights: ${context.behavioral_hints}`;
      if (context.recommendation_context) contextInfo += `\n\nPROACTIVE ANALYTICS — use to guide advice: ${context.recommendation_context}`;

      // Real-time local context
      if (context.local_time) contextInfo += `\nUser's current local time: ${context.local_time}`;
      if (context.local_date) contextInfo += `\nUser's current local date: ${context.local_date}`;
      if (context.timezone) contextInfo += `\nUser's timezone: ${context.timezone}`;

      if (context.goal_mode) {
        contextInfo += context.goal_mode === "income"
          ? `\n\nGOAL MODE: INCOME. Prioritize speed, revenue, cash flow. Short, actionable outputs.`
          : `\n\nGOAL MODE: IMPACT. Prioritize systems, scalability, long-term strategy.`;
      }
      if (context.output_mode) {
        contextInfo += context.output_mode === "blueprints"
          ? `\nOUTPUT MODE: BLUEPRINTS. Layouts, logic flows, step-by-step plans.`
          : `\nOUTPUT MODE: COMPONENTS. Templates, scripts, code snippets, checklists.`;
      }
    }

    const systemPrompt = modeConfig.prompt + "\n" + toneOverlay + contextInfo;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modeConfig.model,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Wait a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
