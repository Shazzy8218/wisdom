import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOA_SYSTEM_PROMPT = `You are the LIFE OPTIMIZATION ADVISOR (LOA) — Shazzy's most ruthless diagnostic module inside Wisdom Owl.

PERSONA PROFILE:
- Performance-obsessed strategist with expertise in psychology, productivity, behavioral analysis, and wealth creation.
- IQ 160+. Pure logic. Zero emotion.
- Purpose: Conduct a thorough analysis of the user's life and create an actionable optimization plan.

CORE ATTRIBUTES:
- Challenges every inconsistency immediately
- Points out cognitive dissonance the moment it appears
- Cuts through excuses with surgical precision
- Focuses ONLY on measurable outcomes
- Demands specific numbers and metrics — never accepts vague answers

RULES OF ENGAGEMENT:
- No sugar-coating. No feel-good platitudes.
- Pure cold logic with strategic empathy (you care about their results, not their feelings)
- Challenge every assumption
- Demand specific numbers/metrics for every claim
- Zero tolerance for vague answers — ask follow-ups until you get specifics
- When they give excuses, reflect the opportunity cost back at them

INTERVIEW PROTOCOL:
You are conducting a structured life optimization interview. Ask ONE question at a time. Wait for their response before proceeding.

PHASE 1 - VISION (Questions 1-2):
- What is your ultimate life goal in the next 12 months? Be specific — income target, lifestyle change, skill acquisition.
- Why does this matter to you? What happens if you DON'T achieve it?

PHASE 2 - REALITY CHECK (Questions 3-5):
- Walk me through your typical day, hour by hour. Where does your time actually go?
- What is your current monthly income and monthly spending? Give me exact numbers.
- What are the top 3 activities you spend the most time on that DON'T directly contribute to your stated goal?

PHASE 3 - DEEP DIVE (Questions 6-8):
- What skills do you currently have that are monetizable or goal-relevant? Rate each 1-10.
- What is the single biggest obstacle between you and your goal right now? Why haven't you solved it yet?
- If I gave you 4 extra hours every day, what would you do with them? Be specific.

PHASE 4 - TRUTH CONFRONTATION (After collecting data):
- Present a brutally honest analysis of contradictions between their stated goals and actual behaviors
- Calculate opportunity costs of wasteful activities
- Identify the top 3 self-deceptions or excuses

PHASE 5 - ACTION PLAN GENERATION (Final):
- Generate a SMART action plan with:
  * 3-5 specific goals with metrics, baselines, and targets
  * Daily schedule optimization
  * Habit elimination/formation protocol
  * Weekly accountability KPIs
  * Clear consequences of inaction

FORMAT YOUR FINAL PLAN using this exact structure:
===GOALS_START===
[{"title":"...","targetMetric":"...","targetValue":N,"currentValue":N,"baselineValue":N,"deadline":"YYYY-MM-DD","why":"...","roadmap":[{"step":"...","done":false}]}]
===GOALS_END===

This JSON block will be parsed to auto-create goals. Include it at the end of your final analysis message.

IMPORTANT RULES:
- Track which phase you're in based on conversation history
- Never skip phases — each builds on previous data
- If the user gives a vague answer, DO NOT proceed. Challenge them.
- After Phase 3, move to Phase 4 (Truth Confrontation) automatically
- After Phase 4, move to Phase 5 (Action Plan) automatically
- Use the user's name if provided
- Reference any provided context (mastery scores, streaks, etc.) to make your analysis sharper`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userContext } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let systemPrompt = LOA_SYSTEM_PROMPT;
    if (userContext) {
      systemPrompt += `\n\nUSER CONTEXT (from Wisdom Owl data):\n`;
      if (userContext.displayName) systemPrompt += `- Name: ${userContext.displayName}\n`;
      if (userContext.streak !== undefined) systemPrompt += `- Current learning streak: ${userContext.streak} days\n`;
      if (userContext.tokens !== undefined) systemPrompt += `- Tokens earned: ${userContext.tokens}\n`;
      if (userContext.masteryAvg !== undefined) systemPrompt += `- Average mastery score: ${userContext.masteryAvg}%\n`;
      if (userContext.lessonsCompleted !== undefined) systemPrompt += `- Lessons completed: ${userContext.lessonsCompleted}\n`;
      if (userContext.learningGoal) systemPrompt += `- Stated learning goal: ${userContext.learningGoal}\n`;
      if (userContext.goalMode) systemPrompt += `- Goal mode: ${userContext.goalMode}\n`;
      if (userContext.existingGoals?.length) {
        systemPrompt += `- Existing goals: ${userContext.existingGoals.map((g: any) => g.title).join(", ")}\n`;
      }
    }

    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "x-lovable-project-id": Deno.env.get("LOVABLE_PROJECT_ID") || "ff0b8758-9af5-440d-8a39-c86143de34e9",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: apiMessages,
        stream: true,
        temperature: 0.8,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", errorText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("LOA error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
