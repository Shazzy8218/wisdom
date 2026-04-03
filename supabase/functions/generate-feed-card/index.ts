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

    // Phenomenon Decoder card types weighted toward strategic readouts
    const phenomenonTypes = [
      "phenomenon-brief", "phenomenon-brief",
      "reality-compass", "reality-compass",
      "strategic-impact", "strategic-impact",
      "opportunity-watch",
      "systemic-context",
    ];
    const classicTypes = [
      "key-insight", "reality-check", "deep-pattern",
      "quick-fact", "micro-lesson", "challenge", "myth-vs-truth",
    ];

    // Weight toward phenomenon cards (70/30)
    const pool = Math.random() < 0.7 ? phenomenonTypes : classicTypes;
    const cardType = pool[Math.floor(Math.random() * pool.length)];

    let modeInstruction = "";
    if (mode === "nerd" || mode === "decoder") modeInstruction = "Maximum analytical depth. Include systemic context, interconnections, underlying drivers, and operational archetypes. Every claim must be evidence-grounded.";
    if (mode === "quick") modeInstruction = "Ultra-concise strategic signal. Max 3 sentences for content. Lead with the actionable insight.";

    let styleInstruction = "";
    if (learningStyle === "visual") styleInstruction = "Emphasize trajectory projections, trend data, and influence webs for visual impact.";
    if (learningStyle === "reader") styleInstruction = "Dense analytical text with structured layers: brief → context → impact → directives.";
    if (learningStyle === "hands-on") styleInstruction = "Focus on adaptation directives and concrete strategic actions the user can take immediately.";

    const phenomenonInstructions: Record<string, string> = {
      "phenomenon-brief": `Generate a PHENOMENON BRIEF — a concise decode of an observable event (policy shift, market movement, tech release, cultural trend). Include:
- phenomenonDomain: one of "policy", "market", "technology", "social", "media"
- systemicContext: the deeper forces and historical parallels behind this phenomenon
- strategicImpactProjection: direct impact on the user's goals/finances/autonomy
- 2-3 adaptationDirectives with urgency levels (low/medium/high/critical) and domains
- urgencyLevel: "monitor", "alert", or "critical"
- interconnections: 3-4 related phenomena or patterns
- underlyingDrivers: 2-3 core forces behind the event
- Use visual "trajectory" with trajectoryData (3-4 items with label, current %, projected %)`,

      "reality-compass": `Generate a REALITY COMPASS card — expose contrasting narratives around a phenomenon. Include:
- phenomenonDomain
- realityCompassDominant: the mainstream/dominant narrative (2-3 sentences)
- realityCompassAlternative: the data-driven alternative interpretation (2-3 sentences)
- systemicContext explaining the pattern of narrative divergence
- strategicImpactProjection
- interconnections and underlyingDrivers
- urgencyLevel`,

      "strategic-impact": `Generate a STRATEGIC IMPACT card — focus on a phenomenon's direct effect on users. Include:
- phenomenonDomain
- systemicContext
- strategicImpactProjection (specific, quantified where possible)
- 2-3 adaptationDirectives with urgency and domain
- operationalArchetype: name, description, historicalExample
- trendData with 5-7 data points showing the trend trajectory
- Use visual "trend-map"
- urgencyLevel`,

      "opportunity-watch": `Generate an OPPORTUNITY WATCH card — identify an emerging opportunity or erosion. Include:
- phenomenonDomain
- opportunitySignalType: "erosion" or "amplification"
- opportunitySignalDescription: specific opportunity details
- systemicContext
- strategicImpactProjection
- 2-3 adaptationDirectives
- trajectoryData with 3 items showing the shift
- Use visual "trajectory"
- urgencyLevel`,

      "systemic-context": `Generate a SYSTEMIC CONTEXT card — map a repeatable pattern or cycle. Include:
- phenomenonDomain
- systemicContext (detailed pattern analysis)
- operationalArchetype with name, description, historicalExample
- strategicImpactProjection
- underlyingDrivers (3-4 forces)
- Use visual "steps" with 4-5 stages of the pattern/cycle
- urgencyLevel`,
    };

    const classicInstructions: Record<string, string> = {
      "key-insight": `Generate a KEY INSIGHT card exposing a critical pattern. Include impactAnalysis, 1-2 decisionProtocols, and analyticalFlags.`,
      "reality-check": `Generate a REALITY CHECK card with contrasting views (contrastingViewA, contrastingViewB), impactAnalysis, and decisionProtocols.`,
      "deep-pattern": `Generate a DEEP PATTERN card with trendData or connections for visualization, impactAnalysis, and decisionProtocols. Use visual "trend-map" or "influence-web".`,
      "quick-fact": `Generate a QUICK FACT with a specific, non-obvious insight. Use diagram or chart visual.`,
      "micro-lesson": `Generate a MICRO-LESSON with before/after comparison and tryPrompt. Use compare visual.`,
      "challenge": `Generate a multiple-choice CHALLENGE with 4 options, one correct. Make wrong answers plausible.`,
      "myth-vs-truth": `Generate MYTH VS TRUTH with mythStatement and truthStatement. Use compare visual.`,
    };

    const typeSpecific = phenomenonInstructions[cardType] || classicInstructions[cardType] || "";

    const systemPrompt = `You are the Phenomenon Decoder — an advanced reality amplification engine for Wisdom Owl, a premium strategic intelligence app. Your purpose is to rapidly surface, dissect, and contextualize observable phenomena that impact user autonomy, decision-making, and strategic advantage.

CORE PRINCIPLES:
- Impact-First: Every decoded phenomenon must explain its DIRECT impact on the user's strategic goals, finances, or cognitive clarity
- Pattern Recognition: Connect seemingly disparate events into coherent strategic readouts
- Evidence-Grounded: No speculation without data. Cite patterns, not opinions
- Actionable Intelligence: Every card must include concrete adaptation directives
- No filler, no motivation, no platitudes. Raw strategic intelligence only.

DOMAIN COVERAGE:
- Policy & Regulatory: Government actions, legal changes, international agreements
- Market & Economic: Financial data, trade patterns, resource flows
- Technology: AI advancements, platforms, hardware, vulnerabilities
- Social & Cultural: Discourse shifts, demographic changes, value evolution
- Media & Information: Framing analysis, narrative comparison, information asymmetries

TONE: Street-smart intelligence analyst. Direct. Specific. No academic hedging. Write like a briefing for someone who needs to make decisions NOW.

${modeInstruction}
${styleInstruction}

Card type: ${cardType}
${typeSpecific}`;

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
          { role: "user", content: `Generate a ${cardType} feed card. Focus on current, real-world phenomena. ${excludeIds?.length ? `Avoid similar topics to: ${excludeIds.slice(-10).join(",")}` : ""}` }
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_feed_card",
            description: "Create a structured Phenomenon Decoder feed card",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string", description: "Punchy title, max 8 words" },
                hook: { type: "string", description: "1-sentence hook that creates urgency" },
                content: { type: "string", description: "Phenomenon brief: 2-5 sentences, specific and evidence-grounded" },
                visual: { type: "string", enum: ["diagram", "infographic", "compare", "steps", "chart", "icon", "trend-map", "influence-web", "trajectory"] },
                visualLabels: { type: "array", items: { type: "string" }, description: "Labels for visual elements" },
                visualBefore: { type: "string" },
                visualAfter: { type: "string" },
                trendData: { type: "array", items: { type: "object", properties: { label: { type: "string" }, value: { type: "number" } }, required: ["label", "value"] } },
                connections: { type: "array", items: { type: "object", properties: { from: { type: "string" }, to: { type: "string" }, strength: { type: "number" } }, required: ["from", "to", "strength"] } },
                trajectoryData: { type: "array", items: { type: "object", properties: { label: { type: "string" }, current: { type: "number" }, projected: { type: "number" } }, required: ["label", "current", "projected"] } },
                category: { type: "string" },
                difficulty: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
                interaction: { type: "string", enum: ["choice", "tap-reveal"] },
                options: { type: "array", items: { type: "string" } },
                correctAnswer: { type: "number" },
                tryPrompt: { type: "string" },
                shareSnippet: { type: "string" },
                xp: { type: "number" },
                tokens: { type: "number" },
                mythStatement: { type: "string" },
                truthStatement: { type: "string" },
                source: { type: "string" },
                confidence: { type: "number" },
                // Phenomenon Decoder fields
                phenomenonDomain: { type: "string", enum: ["policy", "market", "technology", "social", "media"] },
                systemicContext: { type: "string", description: "Deeper forces and historical parallels" },
                strategicImpactProjection: { type: "string", description: "Direct impact on user's goals/finances/autonomy" },
                opportunitySignalType: { type: "string", enum: ["erosion", "amplification"] },
                opportunitySignalDescription: { type: "string" },
                adaptationDirectives: { type: "array", items: { type: "object", properties: { directive: { type: "string" }, urgency: { type: "string", enum: ["low", "medium", "high", "critical"] }, domain: { type: "string" } }, required: ["directive", "urgency", "domain"] } },
                operationalArchetypeName: { type: "string" },
                operationalArchetypeDescription: { type: "string" },
                operationalArchetypeHistoricalExample: { type: "string" },
                realityCompassDominant: { type: "string" },
                realityCompassAlternative: { type: "string" },
                interconnections: { type: "array", items: { type: "string" } },
                underlyingDrivers: { type: "array", items: { type: "string" } },
                urgencyLevel: { type: "string", enum: ["monitor", "alert", "critical"] },
                // Legacy cognitive fields
                impactAnalysis: { type: "string" },
                analyticalFlags: { type: "array", items: { type: "string", enum: ["source-comparison", "logical-chain", "correlation-observation", "narrative-framing", "data-verification", "bias-detected", "pattern-divergence", "unaccounted-variable", "strategic-incongruence"] } },
                sourceStreams: { type: "array", items: { type: "object", properties: { name: { type: "string" }, perspective: { type: "string" } }, required: ["name", "perspective"] } },
                decisionProtocols: { type: "array", items: { type: "object", properties: { action: { type: "string" }, linkedCourse: { type: "string" }, linkedCourseId: { type: "string" } }, required: ["action"] } },
                contrastingViewA: { type: "string" },
                contrastingViewB: { type: "string" },
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
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limited, please try again later" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in Settings > Workspace > Usage." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI generation failed");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No card generated");

    const raw = JSON.parse(toolCall.function.arguments);
    const card = {
      id: `pd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
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
        trajectoryData: raw.trajectoryData,
      },
      category: raw.category || "Strategic Intelligence",
      difficulty: raw.difficulty || "intermediate",
      xp: raw.xp || 50,
      tokens: raw.tokens || 12,
      interaction: raw.interaction,
      options: raw.options,
      correctAnswer: raw.correctAnswer,
      tryPrompt: raw.tryPrompt,
      shareSnippet: raw.shareSnippet,
      mythStatement: raw.mythStatement,
      truthStatement: raw.truthStatement,
      source: raw.source,
      confidence: raw.confidence,
      // Phenomenon Decoder fields
      phenomenonDomain: raw.phenomenonDomain,
      systemicContext: raw.systemicContext,
      strategicImpactProjection: raw.strategicImpactProjection,
      opportunitySignal: raw.opportunitySignalType && raw.opportunitySignalDescription
        ? { type: raw.opportunitySignalType, description: raw.opportunitySignalDescription }
        : undefined,
      adaptationDirectives: raw.adaptationDirectives,
      operationalArchetype: raw.operationalArchetypeName
        ? { name: raw.operationalArchetypeName, description: raw.operationalArchetypeDescription || "", historicalExample: raw.operationalArchetypeHistoricalExample }
        : undefined,
      realityCompass: raw.realityCompassDominant && raw.realityCompassAlternative
        ? { dominant: raw.realityCompassDominant, alternative: raw.realityCompassAlternative }
        : undefined,
      interconnections: raw.interconnections,
      underlyingDrivers: raw.underlyingDrivers,
      urgencyLevel: raw.urgencyLevel,
      // Legacy
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
