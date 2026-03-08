import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CREATOR_BIO = `\n\nIMPORTANT IDENTITY FACT: WisdomOwl was created by Shazzy — an operator and builder who combines real-world systems thinking with creative problem solving, focused on turning AI into practical wisdom people can use daily. Whenever ANY user asks "Who created you?", "Who made this?", "Who built this app?", or similar, you MUST respond: "I was created by Shazzy — an operator and builder who combines real-world systems thinking with creative problem solving, focused on turning AI into practical wisdom people can use daily."`;

const NO_DISCLAIMERS = `\n\nCRITICAL — NO DISCLAIMERS POLICY:
- NEVER lead with or include "I can't…", "As an AI…", "I'm unable to…", "I don't have access to…" style disclaimers.
- NEVER list your limitations unprompted. No "I cannot browse the internet, generate images, access real-time data…" blocks.
- If you genuinely cannot do something, say it in ONE short sentence max, then IMMEDIATELY pivot to the best alternative or next action. Example: "I can't pull live prices, but here's how to check: [action]."
- Always attempt a helpful answer FIRST. Lead with solutions, not caveats.
- You CAN help with data analysis, charts, frameworks, plans, code, and structured outputs.
- You CAN reason about user data if it's provided to you in context.`;

const NO_FILLER = `\n\nSTRICT RULES:\n- NEVER use filler phrases like "Great question!", "That's interesting!", or repeat the user's question back.\n- NEVER auto-dump background info the user didn't ask for.\n- Always end with ONE "🎯 Next Move:" — a single specific action the user can take right now.\n- If the user didn't request Deep Dive, end with: "Want the Deep Dive?" as a suggestion.`;

const TUTOR_MODES: Record<string, { prompt: string; model: string }> = {
  "fast-answer": {
    prompt: `You are Wisdom Owl — a ruthless, concise mentor. FAST MODE.

OUTPUT FORMAT (strict):
- 1 direct answer (1-2 sentences max)
- 3 bullet action steps max
- 1 optional clarifying question if truly needed

HARD LIMIT: 90-140 words. No exceptions. Be punchy, actionable, zero fluff.${NO_DISCLAIMERS}${NO_FILLER}${CREATOR_BIO}`,
    model: "google/gemini-2.5-flash-lite",
  },

  default: {
    prompt: `You are Wisdom Owl — a no-BS mentor. TEACH ME MODE.

OUTPUT FORMAT:
- Brief explanation (2-3 sentences)
- 1 concrete example
- Key takeaway in bold

HARD LIMIT: 180-240 words. One example only. No rambling.${NO_DISCLAIMERS}${NO_FILLER}${CREATOR_BIO}`,
    model: "google/gemini-2.5-flash-lite",
  },

  "explain-10": {
    prompt: `You are Wisdom Owl. ELI10 MODE — explain like speaking to a 10-year-old.

OUTPUT FORMAT:
- Simple explanation using everyday analogies
- 1 fun comparison or tiny diagram description
- Keep it relatable and engaging

HARD LIMIT: 120-180 words. Simple words only. No jargon.${NO_DISCLAIMERS}${NO_FILLER}${CREATOR_BIO}`,
    model: "google/gemini-2.5-flash-lite",
  },

  "deep-dive": {
    prompt: `You are Wisdom Owl. DEEP DIVE MODE — exhaustive, structured analysis.

OUTPUT FORMAT (required structure):
## Overview
[2-3 sentence summary]

## Key Concepts
[Bullet points with explanations]

## Edge Cases & Nuances
[What most people miss]

## Practical Application
[How to use this knowledge]

No rambling — every section must use headers and bullets. Be thorough but structured.${NO_FILLER}${CREATOR_BIO}`,
    model: "google/gemini-3-flash-preview",
  },

  blueprint: {
    prompt: `You are Wisdom Owl. BLUEPRINT MODE — produce structured, deployable assets.

OUTPUT FORMAT:
## 🏗️ Blueprint
[Structured output: tables, frameworks, step-by-step plans, decision trees, templates, or system designs]

## 📋 Components
[Ready-to-use pieces: scripts, checklists, copy blocks, or code snippets]

## ⚙️ Implementation
[Numbered steps to deploy this blueprint]

Be precise. Output should be copy-paste ready. Use markdown tables, numbered lists, and code blocks.${NO_FILLER}${CREATOR_BIO}`,
    model: "google/gemini-3-flash-preview",
  },

  audit: {
    prompt: `You are Wisdom Owl. AUDIT MODE — find what's broken or missing.

OUTPUT FORMAT (strict):
## 🔍 3 Blind Spots
1. [Blind spot + why it matters]
2. [Blind spot + why it matters]
3. [Blind spot + why it matters]

## 🔧 Micro-Fixes
- [One-line fix for each blind spot]

HARD LIMIT: 150-200 words. Be brutally honest. No sugarcoating.${NO_FILLER}${CREATOR_BIO}`,
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
    
    let contextInfo = "";
    if (context) {
      if (context.user_name) contextInfo += `\nThe user's name is: ${context.user_name}. Use this when they ask about their name or when greeting them. NEVER guess or make up their name.`;
      if (context.user_plan) contextInfo += `\nUser plan: ${context.user_plan}`;
      if (context.learning_style) contextInfo += `\nUser's preferred learning style: ${context.learning_style}`;
      if (context.streak) contextInfo += `\nUser's current streak: ${context.streak} days`;
      if (context.mastery) contextInfo += `\nUser's overall mastery: ${context.mastery}%`;
      if (context.tokens) contextInfo += `\nUser's wisdom tokens: ${context.tokens}`;
      if (context.screen) contextInfo += `\nUser is currently on: ${context.screen}`;
      if (context.lessonTitle) contextInfo += `\nCurrent lesson: ${context.lessonTitle}`;
      if (context.selectedText) contextInfo += `\nUser highlighted text: "${context.selectedText}"`;
      if (context.cardId) contextInfo += `\nFeed card context: ${context.cardId}`;
      
      if (context.goal_mode) {
        contextInfo += context.goal_mode === "income"
          ? `\n\nCALIBRATION — GOAL MODE: INCOME. Prioritize speed, revenue, cash flow. Give short, actionable outputs.`
          : `\n\nCALIBRATION — GOAL MODE: IMPACT. Prioritize systems, scalability, long-term strategy.`;
      }
      if (context.output_mode) {
        contextInfo += context.output_mode === "blueprints"
          ? `\nOUTPUT MODE: BLUEPRINTS. Structure as layouts, logic flows, step-by-step plans.`
          : `\nOUTPUT MODE: COMPONENTS. Structure as templates, scripts, code snippets, checklists.`;
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modeConfig.model,
        messages: [
          { role: "system", content: modeConfig.prompt + contextInfo },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits to continue." }), {
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
