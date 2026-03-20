import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { mode, learningStyle, excludeIds } = await req.json();
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not configured");

    const types = [
      "quick-fact", "micro-lesson", "challenge", "myth-vs-truth", "news",
      "key-insight", "reality-check", "source-comparison", "deep-pattern",
    ];
    const cardType = types[Math.floor(Math.random() * types.length)];

    let modeInstruction = "";
    if (mode === "nerd") modeInstruction = "Make it more technical, include statistics, data, and detailed diagrams. Target intermediate+ learners.";
    if (mode === "quick") modeInstruction = "Make it ultra-concise. Max 2 sentences for content. Quick fact, instant takeaway.";

    let styleInstruction = "";
    if (learningStyle === "visual") styleInstruction = "Emphasize visual elements: diagrams, before/after comparisons, labeled steps.";
    if (learningStyle === "reader") styleInstruction = "Use structured bullets, cheat-sheet format, dense but clear text.";
    if (learningStyle === "hands-on") styleInstruction = "Focus on practical drills, 'try it now' prompts, and real scenarios.";

    const cognitiveInstructions: Record<string, string> = {
      "key-insight": `Generate a KEY INSIGHT card. This should expose a critical data pattern, relationship, or non-obvious truth that affects decision-making. Include:
- A concise factual summary as the hook
- Evidence-based contextual analysis as content
- An 'impactAnalysis' explaining how this affects the user's decisions
- 1-2 'decisionProtocols' with actionable steps
- Suggest relevant analyticalFlags from: source-comparison, logical-chain, correlation-observation, narrative-framing, data-verification, bias-detected`,

      "reality-check": `Generate a REALITY CHECK card. Present contrasting perspectives on a topic to help users evaluate independently. Include:
- Two contrasting views as 'contrastingViewA' and 'contrastingViewB'
- An 'impactAnalysis' explaining what this means for the user
- 1-2 'decisionProtocols' with concrete actions
- Set visual to 'compare'`,

      "source-comparison": `Generate a SOURCE COMPARISON card. Show how different information sources present the same topic differently. Include:
- 2-3 'sourceStreams' each with a 'name' (source type) and 'perspective' (how they frame it)
- An 'impactAnalysis' about information literacy
- Suggest analyticalFlags like 'source-comparison' and 'narrative-framing'`,

      "deep-pattern": `Generate a DEEP PATTERN card. Identify a systemic trend or influence pattern across multiple domains. Include:
- 'trendData' with 3-5 data points (label + value pairs) for visualization
- OR 'connections' with 3-5 influence connections (from, to, strength 1-100)
- Set visual to 'trend-map' or 'influence-web' accordingly
- An 'impactAnalysis'
- 2-3 'decisionProtocols' with actionable intelligence
- Suggest analyticalFlags`,
    };

    const typeSpecific = cognitiveInstructions[cardType] || "";

    const systemPrompt = `You generate feed cards for Wisdom AI, a premium cognitive augmentation app. Each card is a 15-60 second learning drop that enhances information literacy and critical thinking.

Rules:
- NEVER use filler or vague motivation. Every sentence must contain a specific insight.
- Content must be practical, actionable, and intellectually rigorous.
- Write at a "street-smart textbook" level — not academic, not dumbed down.
- For cognitive augmentation cards (key-insight, reality-check, source-comparison, deep-pattern): focus on enhancing the user's ability to analyze, discern, and make autonomous decisions.
${modeInstruction}
${styleInstruction}

Card type to generate: ${cardType}

${typeSpecific}
${cardType === "myth-vs-truth" ? "Include a mythStatement (the common misconception) and truthStatement (the reality with evidence)." : ""}
${cardType === "news" ? "Generate an EVERGREEN tech/AI concept explainer. Label source as 'General Update — Evergreen Concept'. Set confidence 85-95. Do NOT pretend it's current news." : ""}
${cardType === "challenge" ? "Create a multiple-choice challenge where only one option is correct. Make wrong answers plausible but clearly wrong to someone who knows the material." : ""}`;

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
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate a ${cardType} feed card. ${excludeIds?.length ? `Avoid similar topics to: ${excludeIds.slice(-10).join(",")}` : ""}` }
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_feed_card",
            description: "Create a structured feed card for cognitive augmentation",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string", description: "Catchy title, max 8 words" },
                hook: { type: "string", description: "1-sentence hook" },
                content: { type: "string", description: "Main content, 2-5 sentences, specific and actionable" },
                visual: { type: "string", enum: ["diagram", "infographic", "compare", "steps", "chart", "icon", "trend-map", "influence-web"] },
                visualLabels: { type: "array", items: { type: "string" }, description: "Labels for visual elements (3-5 items)" },
                visualBefore: { type: "string", description: "Before text for compare visual" },
                visualAfter: { type: "string", description: "After text for compare visual" },
                trendData: { type: "array", items: { type: "object", properties: { label: { type: "string" }, value: { type: "number" } }, required: ["label", "value"] }, description: "For trend-map visual" },
                connections: { type: "array", items: { type: "object", properties: { from: { type: "string" }, to: { type: "string" }, strength: { type: "number" } }, required: ["from", "to", "strength"] }, description: "For influence-web visual" },
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
                // New cognitive augmentation fields
                impactAnalysis: { type: "string", description: "How this affects the user's decision-making, health, finances, or autonomy" },
                analyticalFlags: { type: "array", items: { type: "string", enum: ["source-comparison", "logical-chain", "correlation-observation", "narrative-framing", "data-verification", "bias-detected"] }, description: "Suggested analytical flags for this card" },
                sourceStreams: { type: "array", items: { type: "object", properties: { name: { type: "string" }, perspective: { type: "string" } }, required: ["name", "perspective"] }, description: "Different source perspectives for source-comparison cards" },
                decisionProtocols: { type: "array", items: { type: "object", properties: { action: { type: "string" }, linkedCourse: { type: "string" }, linkedCourseId: { type: "string" } }, required: ["action"] }, description: "Actionable steps for decision support" },
                contrastingViewA: { type: "string", description: "First contrasting perspective for reality-check" },
                contrastingViewB: { type: "string", description: "Second contrasting perspective for reality-check" },
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
        trendData: raw.trendData,
        connections: raw.connections,
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
      // New cognitive augmentation fields
      impactAnalysis: raw.impactAnalysis,
      analyticalFlags: raw.analyticalFlags,
      sourceStreams: raw.sourceStreams,
      decisionProtocols: raw.decisionProtocols,
      contrastingViews: raw.contrastingViewA && raw.contrastingViewB
        ? { viewA: raw.contrastingViewA, viewB: raw.contrastingViewB }
        : undefined,
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
