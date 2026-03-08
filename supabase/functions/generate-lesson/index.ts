import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { category, difficulty, track, excludeIds } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const difficultyGuide: Record<string, string> = {
      beginner: "Explain simply. Use everyday analogies. Assume no prior knowledge. Focus on 'what it is' and 'why it matters'. Give one simple, concrete example anyone can try today.",
      intermediate: "Assume basic understanding. Focus on practical application, workflows, and real scenarios. Include measurable outcomes and a repeatable process. Connect to revenue/productivity.",
      advanced: "Assume strong foundation. Cover edge cases, strategic thinking, compound techniques, and expert-level nuance. Include frameworks the user can teach others. Connect to competitive advantage and monetization.",
    };

    const levelGuide = difficultyGuide[difficulty || "beginner"] || difficultyGuide.beginner;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a premium micro-lesson generator for Wisdom AI — an app that teaches people how to use AI to work smarter and make money.

Your lessons must be:
- PRACTICAL: Every lesson teaches something the user can apply TODAY
- MONEY-CONNECTED: Show how this skill connects to earning, saving, or creating leverage
- SPECIFIC: Use real examples, not vague advice
- STRUCTURED: Hook → Explanation → Example → Exercise → Action
- HIGH QUALITY: Each lesson should feel like advice from a $500/hour consultant

Difficulty level: ${difficulty || "beginner"}
${levelGuide}

NEVER generate filler content. Every sentence must teach something specific and actionable.`
          },
          {
            role: "user",
            content: `Generate a micro-lesson for:
- Category: "${category || "AI Skills"}"
- Track: "${track || "AI Basics"}"  
- Difficulty: "${difficulty || "beginner"}"
${excludeIds?.length ? `- Avoid topics similar to IDs: ${excludeIds.join(",")}` : ""}

Make it unique, practical, and genuinely useful. The user should feel smarter after reading it.`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_micro_lesson",
              description: "Create a structured micro-lesson with real content",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Catchy, specific lesson title (3-7 words)" },
                  hook: { type: "string", description: "1 sentence that makes the user NEED to read this. Start with a bold claim or surprising fact." },
                  content: { type: "string", description: "The core lesson content. 4-6 sentences. Must include: 1) Clear explanation of the concept, 2) Why it matters for money/productivity, 3) A specific real-world example with details, 4) The key insight or framework. No filler." },
                  tryPrompt: { type: "string", description: "A specific 'try it now' challenge. Not vague — tell the user EXACTLY what to do, step by step." },
                  mentalModel: { type: "string", description: "A mental model or framework that helps the user remember and apply this concept. Use an analogy if helpful." },
                  commonMistakes: { type: "string", description: "2-3 specific mistakes people make with this topic and why they're wrong." },
                  interaction: { type: "string", enum: ["choice", "tap-reveal"], description: "Type of interaction" },
                  options: { type: "array", items: { type: "string" }, description: "4 multiple choice options (if interaction is choice). Make wrong answers plausible but clearly wrong to someone who read the lesson." },
                  correctAnswer: { type: "number", description: "Index of correct answer (0-3)" },
                  xp: { type: "number", description: "XP reward 40-100 based on difficulty" },
                  tokens: { type: "number", description: "Token reward 8-25 based on difficulty" },
                },
                required: ["title", "hook", "content", "tryPrompt", "mentalModel", "commonMistakes", "interaction", "xp", "tokens"],
                additionalProperties: false,
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "create_micro_lesson" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI generation failed");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No lesson generated");

    const lesson = JSON.parse(toolCall.function.arguments);
    lesson.id = `gen-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    lesson.track = track || "AI Basics";
    lesson.category = category || "AI Skills";
    lesson.difficulty = difficulty || "beginner";
    lesson.visual = "ai-generated";
    // Ensure upgrade and bragLine exist
    if (!lesson.upgrade) lesson.upgrade = lesson.mentalModel || "";
    if (!lesson.bragLine) lesson.bragLine = `I learned: ${lesson.title}`;

    return new Response(JSON.stringify(lesson), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-lesson error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
