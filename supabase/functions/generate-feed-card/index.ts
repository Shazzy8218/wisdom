import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { mode, learningStyle, excludeIds } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const types = ["quick-fact", "micro-lesson", "challenge", "myth-vs-truth", "news"];
    const cardType = types[Math.floor(Math.random() * types.length)];

    let modeInstruction = "";
    if (mode === "nerd") modeInstruction = "Make it more technical, include statistics, data, and detailed diagrams. Target intermediate+ learners.";
    if (mode === "quick") modeInstruction = "Make it ultra-concise. Max 2 sentences for content. Quick fact, instant takeaway.";

    let styleInstruction = "";
    if (learningStyle === "visual") styleInstruction = "Emphasize visual elements: diagrams, before/after comparisons, labeled steps.";
    if (learningStyle === "reader") styleInstruction = "Use structured bullets, cheat-sheet format, dense but clear text.";
    if (learningStyle === "hands-on") styleInstruction = "Focus on practical drills, 'try it now' prompts, and real scenarios.";

    const systemPrompt = `You generate feed cards for Wisdom AI, a premium learning app. Each card is a 15-60 second learning drop.

Rules:
- NEVER use filler or vague motivation. Every sentence must contain a specific insight.
- Content must be practical, actionable, and memorable.
- Write at a "street-smart textbook" level — not academic, not dumbed down.
${modeInstruction}
${styleInstruction}

Card type to generate: ${cardType}

${cardType === "myth-vs-truth" ? "Include a mythStatement (the common misconception) and truthStatement (the reality with evidence)." : ""}
${cardType === "news" ? "Generate an EVERGREEN tech/AI concept explainer. Label source as 'General Update — Evergreen Concept'. Set confidence 85-95. Do NOT pretend it's current news." : ""}
${cardType === "challenge" ? "Create a multiple-choice challenge where only one option is correct. Make wrong answers plausible but clearly wrong to someone who knows the material." : ""}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate a ${cardType} feed card. ${excludeIds?.length ? `Avoid similar topics to: ${excludeIds.slice(-10).join(",")}` : ""}` }
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_feed_card",
            description: "Create a structured feed card",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string", description: "Catchy title, max 8 words" },
                hook: { type: "string", description: "1-sentence hook" },
                content: { type: "string", description: "Main content, 2-5 sentences, specific and actionable" },
                visual: { type: "string", enum: ["diagram", "infographic", "compare", "steps", "chart", "icon"] },
                visualLabels: { type: "array", items: { type: "string" }, description: "Labels for visual elements (3-5 items)" },
                visualBefore: { type: "string", description: "Before text for compare visual" },
                visualAfter: { type: "string", description: "After text for compare visual" },
                category: { type: "string" },
                difficulty: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
                interaction: { type: "string", enum: ["choice", "tap-reveal"] },
                options: { type: "array", items: { type: "string" }, description: "4 choices if interaction=choice" },
                correctAnswer: { type: "number", description: "Index 0-3 of correct answer" },
                tryPrompt: { type: "string", description: "A practice prompt" },
                shareSnippet: { type: "string", description: "Shareable 1-liner insight" },
                xp: { type: "number", description: "30-70" },
                tokens: { type: "number", description: "6-15" },
                mythStatement: { type: "string", description: "For myth-vs-truth type" },
                truthStatement: { type: "string", description: "For myth-vs-truth type" },
                source: { type: "string", description: "For news type" },
                confidence: { type: "number", description: "For news type, 0-100" },
              },
              required: ["title", "hook", "content", "visual", "category", "difficulty", "shareSnippet", "xp", "tokens"],
              additionalProperties: false,
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "create_feed_card" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Credits required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI generation failed");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No card generated");

    const raw = JSON.parse(toolCall.function.arguments);
    const card = {
      id: `feed-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: cardType,
      title: raw.title,
      hook: raw.hook,
      content: raw.content,
      visual: raw.visual || "icon",
      visualData: {
        labels: raw.visualLabels,
        before: raw.visualBefore,
        after: raw.visualAfter,
        steps: raw.visual === "steps" ? raw.visualLabels : undefined,
      },
      category: raw.category || "Computer & math",
      difficulty: raw.difficulty || "beginner",
      xp: raw.xp || 40,
      tokens: raw.tokens || 8,
      interaction: raw.interaction,
      options: raw.options,
      correctAnswer: raw.correctAnswer,
      tryPrompt: raw.tryPrompt,
      shareSnippet: raw.shareSnippet,
      mythStatement: raw.mythStatement,
      truthStatement: raw.truthStatement,
      source: raw.source,
      confidence: raw.confidence,
    };

    return new Response(JSON.stringify(card), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-feed-card error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
