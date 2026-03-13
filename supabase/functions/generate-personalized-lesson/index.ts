import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { chatTopics, goalMode, outputMode, learningStyle, existingLessonIds } = await req.json();
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not configured");

    const topicsStr = (chatTopics || []).slice(0, 5).join("\n- ");

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
          {
            role: "system",
            content: `You are a personalized micro-lesson generator. Create lessons based on the user's actual chat topics and interests. Each lesson should feel custom-made for THIS specific user based on what they've been asking about. Keep lessons 30-60 seconds to consume. Make them actionable and specific.`
          },
          {
            role: "user",
            content: `Generate 2 personalized micro-lessons based on these recent chat topics:\n- ${topicsStr || "general AI usage"}\n\nUser profile: Goal mode=${goalMode || "income"}, Output preference=${outputMode || "blueprints"}, Learning style=${learningStyle || "visual"}.\n\n${existingLessonIds?.length ? `Avoid duplicating these lesson IDs: ${existingLessonIds.join(",")}` : ""}\n\nCreate lessons that directly relate to what they've been exploring.`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_personalized_lessons",
              description: "Create personalized micro-lessons",
              parameters: {
                type: "object",
                properties: {
                  lessons: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Catchy lesson title, max 8 words" },
                        hook: { type: "string", description: "1-sentence hook why this matters for the user" },
                        content: { type: "string", description: "The lesson content, 3-5 sentences, specific and actionable" },
                        tryPrompt: { type: "string", description: "A 'try it now' challenge" },
                        relatedTopic: { type: "string", description: "Which chat topic this relates to" },
                      },
                      required: ["title", "hook", "content", "tryPrompt", "relatedTopic"],
                      additionalProperties: false,
                    }
                  }
                },
                required: ["lessons"],
                additionalProperties: false,
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "create_personalized_lessons" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error("AI generation failed");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No lessons generated");

    const result = JSON.parse(toolCall.function.arguments);
    const lessons = (result.lessons || []).map((l: any, i: number) => ({
      ...l,
      id: `pl-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
    }));

    return new Response(JSON.stringify({ lessons }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-personalized-lesson error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

