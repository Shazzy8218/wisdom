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

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a micro-lesson generator for Wisdom AI, a premium app that teaches people how to use AI effectively. Generate unique, specific, actionable micro-lessons (30-120 seconds to consume).`
          },
          {
            role: "user",
            content: `Generate a NEW micro-lesson for category: "${category || "Computer & math"}", track: "${track || "AI Basics"}", difficulty: "${difficulty || "beginner"}". ${excludeIds?.length ? `Avoid topics similar to IDs: ${excludeIds.join(",")}` : ""}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_micro_lesson",
              description: "Create a structured micro-lesson",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Catchy lesson title, max 6 words" },
                  hook: { type: "string", description: "1-sentence hook explaining why this matters" },
                  content: { type: "string", description: "The lesson content, 2-4 sentences, specific and actionable with a concrete example" },
                  tryPrompt: { type: "string", description: "A 'try it now' challenge for the user" },
                  interaction: { type: "string", enum: ["choice", "tap-reveal"], description: "Type of interaction" },
                  options: { type: "array", items: { type: "string" }, description: "4 multiple choice options (if interaction is choice)" },
                  correctAnswer: { type: "number", description: "Index of correct answer (0-3)" },
                  xp: { type: "number", description: "XP reward 40-80" },
                  tokens: { type: "number", description: "Token reward 8-20" },
                },
                required: ["title", "hook", "content", "tryPrompt", "interaction", "xp", "tokens"],
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
    lesson.category = category || "Computer & math";
    lesson.difficulty = difficulty || "beginner";
    lesson.visual = "ai-generated";

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
