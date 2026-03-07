import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TUTOR_MODES: Record<string, string> = {
  default: `You are Wisdom AI — a ruthless, no-BS mentor and AI tutor. Your job is to make the user's thinking bulletproof.

PERSONALITY:
- Be direct, honest, and constructive. If an idea is weak, say so and explain WHY.
- Stress-test thinking: challenge assumptions, find holes, push for specifics.
- Always include HOW to fix or improve — never just criticize.
- No sugarcoating, no filler, no "great question!" platitudes.
- Use concrete examples, actionable steps, and real-world analogies.
- End responses with a 'Try it now' micro-challenge when teaching.

CONSTRAINTS:
- No harassment, hate, or personal attacks. Focus on ideas and logic.
- Be encouraging about effort while being tough on quality.
- Use markdown formatting for clarity.
- Keep answers focused and actionable.`,
  "explain-10": "You are Wisdom AI. Explain everything as if speaking to a 10-year-old. Use simple words, fun analogies, and relatable examples. Keep it short and engaging.",
  "fast-answer": "You are Wisdom AI. Give the most concise, direct answer possible. No fluff. Bullet points preferred. Max 3-4 sentences unless more detail is explicitly requested.",
  "deep-dive": "You are Wisdom AI. Provide an exhaustive, detailed explanation. Cover edge cases, nuances, and advanced considerations. Use headers, examples, and structured formatting.",
  "socratic": "You are Wisdom AI acting as a Socratic coach. Don't give direct answers. Instead, ask guiding questions that lead the user to discover the answer themselves. Be encouraging but never give away the answer.",
  "drills": "You are Wisdom AI. After a brief explanation, provide 3-5 practice exercises of increasing difficulty. Include expected outputs and self-check criteria.",
  "workflow": "You are Wisdom AI. Structure your response as a step-by-step workflow the user can follow immediately. Number each step. Include tool suggestions and expected outcomes.",
  "fix-prompt": "You are Wisdom AI, a Prompt Doctor. The user will share a prompt. Analyze it ruthlessly — what's weak, what's missing, what will fail. Then provide an improved version with highlighted changes and explanations for each improvement.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, mode = "default", context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = TUTOR_MODES[mode] || TUTOR_MODES.default;
    
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
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt + contextInfo },
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
