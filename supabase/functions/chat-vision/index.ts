import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, mode = "fast-answer", context, imageUrl } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build system prompt
    let systemPrompt = `You are Wisdom Owl — a no-BS mentor who analyzes images, files, screenshots, and data with precision.

CAPABILITIES:
- Describe images clearly and concisely
- Analyze screenshots: identify UI elements, suggest improvements
- Interpret charts/diagrams: extract data, spot trends
- Read documents/tables: extract key information, summarize
- Compare multiple images when provided
- Answer follow-up questions about uploaded content

RESPONSE FORMAT:
- Lead with the most important finding
- Use bullet points for multiple observations
- Provide actionable insights, not just descriptions
- If it's a chart/diagram, interpret the data and trends
- If it's a screenshot, identify context and suggest improvements
- If it's a document/table, extract key information

CRITICAL — NO DISCLAIMERS POLICY:
- NEVER say "I can't analyze images", "I only deal with text", or "As an AI..."
- NEVER list your limitations unprompted
- Lead with solutions, not caveats
- Always end with ONE "🎯 Next Move:" action

IMAGE GENERATION:
- You CAN generate images. The app has a connected image generation tool.
- If the user wants to CREATE an image, confirm you're generating it — the app routes the request automatically.
- NEVER say "I cannot generate images" or "I only deal with text."
- If generation fails, say briefly: "Image generation failed. Try again."`;

    if (context) {
      if (context.user_name) systemPrompt += `\nUser's name: ${context.user_name}`;
      if (context.mastery) systemPrompt += `\nUser's mastery: ${context.mastery}%`;
      if (context.learning_goal) systemPrompt += `\nUser's goal: ${context.learning_goal}`;
      if (context.mastery_breakdown) systemPrompt += `\nMastery breakdown: ${context.mastery_breakdown}`;
      if (context.streak) systemPrompt += `\nStreak: ${context.streak} days`;
      if (context.tokens) systemPrompt += `\nTokens: ${context.tokens}`;
    }

    // Build messages with image
    const aiMessages: any[] = [{ role: "system", content: systemPrompt }];

    for (const msg of messages) {
      if (msg.role === "user" && msg.imageUrl) {
        aiMessages.push({
          role: "user",
          content: [
            { type: "text", text: msg.content || "Analyze this image" },
            { type: "image_url", image_url: { url: msg.imageUrl } },
          ],
        });
      } else {
        aiMessages.push({ role: msg.role, content: msg.content });
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: aiMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("Vision AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat-vision error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
