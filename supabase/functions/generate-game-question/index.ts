import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { gameType, difficulty } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const gamePrompts: Record<string, string> = {
      "hallucination-hunter": "Generate a short AI-generated paragraph (3-4 sentences) about a real topic. Include exactly 2 subtle hallucinations (false facts that sound plausible). Also provide: the list of hallucinated claims, explanations of why they're false, and what the correct facts are.",
      "output-duel": "Generate two AI outputs for the same prompt. One should be clearly better (more specific, actionable, well-structured). Provide the prompt, both outputs, which is better (A or B), and why.",
      "prompt-surgery": "Generate a bloated, wordy prompt (3-4 sentences) that has good intent but too much fluff. Also provide the ideal trimmed version and explain what was removed and why.",
    };

    const prompt = gamePrompts[gameType] || gamePrompts["hallucination-hunter"];

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://wisdom-owl.app",
        "X-Title": "Wisdom Owl",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a game content generator for Wisdom AI. Generate engaging, educational game questions." },
          { role: "user", content: `${prompt}\nDifficulty: ${difficulty || "beginner"}` }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_game_question",
              description: "Create a structured game question",
              parameters: {
                type: "object",
                properties: {
                  passage: { type: "string", description: "The main text/passage for the question" },
                  claims: { type: "array", items: { type: "object", properties: { text: { type: "string" }, isHallucination: { type: "boolean" }, explanation: { type: "string" } }, required: ["text", "isHallucination", "explanation"] }, description: "Individual claims to evaluate" },
                  correctFeedback: { type: "string", description: "Feedback for correct answer" },
                  incorrectFeedback: { type: "string", description: "Feedback for incorrect answer" },
                  topic: { type: "string", description: "Topic category" },
                },
                required: ["passage", "claims", "correctFeedback", "incorrectFeedback", "topic"],
                additionalProperties: false,
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "create_game_question" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Credits required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI generation failed");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No question generated");

    const question = JSON.parse(toolCall.function.arguments);
    question.id = `gq-${Date.now()}`;

    return new Response(JSON.stringify(question), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-game-question error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

