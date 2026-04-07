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

    // Card type pools
    const phenomenonTypes = [
      "phenomenon-brief", "phenomenon-brief",
      "reality-compass", "reality-compass",
      "strategic-impact", "strategic-impact",
      "opportunity-watch",
      "systemic-context",
    ];
    const wealthTypes = [
      "money-momentum", "money-momentum",
      "leverage-point", "leverage-point",
      "profit-pathway",
      "rich-mindset", "rich-mindset",
      "ethical-compass",
      "pitfall-alert",
    ];
    const survivalTypes = [
      "tax-hack", "tax-hack",
      "legal-advantage", "legal-advantage",
      "benefit-claim", "benefit-claim",
      "government-program", "government-program",
    ];
    const classicTypes = [
      "key-insight", "reality-check", "deep-pattern",
      "quick-fact", "micro-lesson", "challenge", "myth-vs-truth",
    ];

    // Select pool based on mode
    let pool: string[];
    if (mode === "wealth") {
      pool = Math.random() < 0.85 ? wealthTypes : classicTypes;
    } else if (mode === "survival") {
      pool = Math.random() < 0.85 ? survivalTypes : wealthTypes;
    } else if (mode === "mixed") {
      // Mixed mode: 30% phenomenon, 25% wealth, 30% survival, 15% classic
      const r = Math.random();
      if (r < 0.30) pool = phenomenonTypes;
      else if (r < 0.55) pool = wealthTypes;
      else if (r < 0.85) pool = survivalTypes;
      else pool = classicTypes;
    } else {
      // decoder/nerd/quick: 40% phenomenon, 25% wealth, 25% survival, 10% classic
      const r = Math.random();
      if (r < 0.4) pool = phenomenonTypes;
      else if (r < 0.65) pool = wealthTypes;
      else if (r < 0.9) pool = survivalTypes;
      else pool = classicTypes;
    }
    const cardType = pool[Math.floor(Math.random() * pool.length)];

    let modeInstruction = "";
    if (mode === "nerd" || mode === "decoder") modeInstruction = "Maximum analytical depth. Include systemic context, interconnections, underlying drivers, and operational archetypes. Every claim must be evidence-grounded.";
    if (mode === "quick") modeInstruction = "Ultra-concise strategic signal. Max 3 sentences for content. Lead with the actionable insight.";
    if (mode === "wealth") modeInstruction = "Focus on wealth creation, financial optimization, and ethical finance. Every insight must include concrete dollar amounts, percentages, or actionable financial steps. Include ethical framework considerations.";
    if (mode === "survival" || mode === "mixed") modeInstruction += " Include Canadian-specific tax benefits, government programs, CRA provisions, and legal financial advantages that everyday people can use. Focus on practical survival strategies — how to claim what's yours, save money legally, and navigate the system. Cover both business owners and regular employees.";

    let styleInstruction = "";
    if (learningStyle === "visual") styleInstruction = "Emphasize trajectory projections, trend data, and influence webs for visual impact.";
    if (learningStyle === "reader") styleInstruction = "Dense analytical text with structured layers: brief → context → impact → directives.";
    if (learningStyle === "hands-on") styleInstruction = "Focus on adaptation directives and concrete strategic actions the user can take immediately.";

    const phenomenonInstructions: Record<string, string> = {
      "phenomenon-brief": `Generate a PHENOMENON BRIEF — a concise decode of an observable event. Include phenomenonDomain, systemicContext, strategicImpactProjection, 2-3 adaptationDirectives, urgencyLevel, interconnections, underlyingDrivers. Use visual "trajectory" with trajectoryData.`,
      "reality-compass": `Generate a REALITY COMPASS card — expose contrasting narratives. Include phenomenonDomain, realityCompassDominant, realityCompassAlternative, systemicContext, strategicImpactProjection, interconnections, underlyingDrivers, urgencyLevel.`,
      "strategic-impact": `Generate a STRATEGIC IMPACT card. Include phenomenonDomain, systemicContext, strategicImpactProjection, 2-3 adaptationDirectives, operationalArchetype, trendData, urgencyLevel. Use visual "trend-map".`,
      "opportunity-watch": `Generate an OPPORTUNITY WATCH card. Include phenomenonDomain, opportunitySignalType, opportunitySignalDescription, systemicContext, strategicImpactProjection, 2-3 adaptationDirectives, trajectoryData. Use visual "trajectory".`,
      "systemic-context": `Generate a SYSTEMIC CONTEXT card. Include phenomenonDomain, systemicContext, operationalArchetype, strategicImpactProjection, underlyingDrivers, urgencyLevel. Use visual "steps".`,
    };

    const wealthInstructions: Record<string, string> = {
      "money-momentum": `Generate a MONEY MOMENTUM BRIEF — a concise, high-impact financial insight showing how money compounds or flows. Include:
- wealthDomain: one of "investing", "tax-optimization", "business-structure", "cashflow", "negotiation", "asset-protection", "behavioral-finance"
- leveragePoint: the core financial leverage being exploited
- profitPathwayScenario, profitPathwayOutcome, profitPathwayTimeframe: concrete "if X then Y" projection
- 1-2 ethicalFrameworks with tradition (jewish/islamic/stoic/utilitarian/virtue/esg), principle, and application
- 2-3 profitProtocols (actionable steps)
- roiPotential: "low", "medium", "high", or "extreme"
- Use visual "trajectory" with trajectoryData showing the financial shift`,

      "leverage-point": `Generate a LEVERAGE POINT card — expose an underutilized legal, financial, or structural advantage. Include:
- wealthDomain
- leveragePoint: the specific mechanism being leveraged
- richMindsetCommonBelief and richMindsetWealthBuilder: contrasting mindsets
- 1-2 ethicalFrameworks
- 2-3 adaptationDirectives with urgency and domain
- roiPotential
- Use visual "steps" with 4-5 implementation steps`,

      "profit-pathway": `Generate a PROFIT PATHWAY card — a specific, actionable route to financial gain. Include:
- wealthDomain
- profitPathwayScenario, profitPathwayOutcome, profitPathwayTimeframe
- leveragePoint
- 2-3 profitProtocols
- 1-2 ethicalFrameworks
- roiPotential
- Use visual "trajectory" or "compare"`,

      "rich-mindset": `Generate a RICH MINDSET card — contrast common financial beliefs with wealth-builder practices. Include:
- wealthDomain
- richMindsetCommonBelief and richMindsetWealthBuilder
- financialPitfallName, financialPitfallDescription, financialPitfallAvoidance
- 1-2 ethicalFrameworks
- 2-3 profitProtocols
- roiPotential
- Use visual "compare"`,

      "ethical-compass": `Generate an ETHICAL COMPASS card — deep dive into ethical finance from diverse traditions. Include:
- wealthDomain
- 2-3 ethicalFrameworks from different traditions (jewish, islamic, stoic, utilitarian, virtue, esg)
- leveragePoint: how the ethical constraint creates advantage
- profitPathwayScenario, profitPathwayOutcome, profitPathwayTimeframe
- roiPotential
- Use visual "diagram"`,

      "pitfall-alert": `Generate a PITFALL ALERT card — expose a common financial trap. Include:
- wealthDomain
- financialPitfallName, financialPitfallDescription, financialPitfallAvoidance
- profitPathwayScenario, profitPathwayOutcome, profitPathwayTimeframe (showing savings from avoiding the pitfall)
- 1-2 ethicalFrameworks
- urgencyLevel
- trendData showing the trend
- Use visual "trend-map"`,
    };

    const classicInstructions: Record<string, string> = {
      "key-insight": `Generate a KEY INSIGHT card with impactAnalysis, 1-2 decisionProtocols, and analyticalFlags.`,
      "reality-check": `Generate a REALITY CHECK card with contrastingViewA, contrastingViewB, impactAnalysis, and decisionProtocols.`,
      "deep-pattern": `Generate a DEEP PATTERN card with trendData or connections, impactAnalysis, and decisionProtocols.`,
      "quick-fact": `Generate a QUICK FACT with a specific, non-obvious insight. Use diagram or chart visual.`,
      "micro-lesson": `Generate a MICRO-LESSON with before/after comparison and tryPrompt. Use compare visual.`,
      "challenge": `Generate a multiple-choice CHALLENGE with 4 options, one correct.`,
      "myth-vs-truth": `Generate MYTH VS TRUTH with mythStatement and truthStatement. Use compare visual.`,
    };

    const typeSpecific = phenomenonInstructions[cardType] || wealthInstructions[cardType] || classicInstructions[cardType] || "";

    const systemPrompt = `You are the Domain Leverage Engine — an advanced reality amplification and wealth optimization engine for Wisdom Owl, a premium strategic intelligence app. You serve dual purposes:

1. PHENOMENON DECODER: Rapidly surface, dissect, and contextualize observable phenomena impacting user autonomy and strategic advantage.
2. WEALTH ENGINE: Deliver highly condensed, actionable intelligence for wealth creation, resource optimization, and ethical financial mastery.

CORE PRINCIPLES:
- Impact-First: Every insight must explain DIRECT impact on user's finances, goals, or strategic position
- Evidence-Grounded: Use real numbers, percentages, historical data. No vague claims
- Actionable: Every card must include concrete steps, dollar amounts, or specific strategies
- Ethical Integration: Include relevant ethical frameworks (Jewish, Islamic, Stoic, ESG) for sustainable wealth
- No filler, no motivation, no platitudes. Raw strategic and financial intelligence only

WEALTH DOMAINS:
- Investing: Compound growth, asset allocation, market positioning
- Tax Optimization: Legal provisions, entity structuring, deductions
- Business Structure: LLCs, S-Corps, trusts, holding companies
- Cash Flow: Revenue streams, expense optimization, automation
- Negotiation: Salary, contracts, deals, pricing
- Asset Protection: Legal shields, insurance, diversification
- Behavioral Finance: Cognitive biases, emotional spending, decision traps

ETHICAL TRADITIONS TO INTEGRATE:
- Jewish Business Ethics (Tzedakah, fair dealing, honest weights)
- Islamic Finance (no Riba, risk-sharing, real asset backing)
- Stoic Ethics (discipline, needs vs desires, long-term thinking)
- ESG Principles (sustainability, governance, social impact)
- Utilitarian/Virtue Ethics where relevant

TONE: Street-smart financial strategist meets ethical philosopher. Direct. Specific. Quantified. Write like a private wealth advisor briefing a client who needs to act NOW.

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
          { role: "user", content: `Generate a ${cardType} feed card. Focus on real-world, actionable intelligence. ${excludeIds?.length ? `Avoid similar topics to: ${excludeIds.slice(-10).join(",")}` : ""}` }
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_feed_card",
            description: "Create a structured feed card for the Domain Leverage Engine",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string", description: "Punchy title, max 8 words" },
                hook: { type: "string", description: "1-sentence hook that creates urgency" },
                content: { type: "string", description: "2-5 sentences, specific and evidence-grounded" },
                visual: { type: "string", enum: ["diagram", "infographic", "compare", "steps", "chart", "icon", "trend-map", "influence-web", "trajectory"] },
                visualLabels: { type: "array", items: { type: "string" } },
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
                phenomenonDomain: { type: "string", enum: ["policy", "market", "technology", "social", "media", "finance", "legal"] },
                systemicContext: { type: "string" },
                strategicImpactProjection: { type: "string" },
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
                // Domain Leverage Engine fields
                wealthDomain: { type: "string", enum: ["investing", "tax-optimization", "business-structure", "cashflow", "negotiation", "asset-protection", "behavioral-finance"] },
                leveragePoint: { type: "string", description: "The core financial leverage being exploited" },
                profitPathwayScenario: { type: "string" },
                profitPathwayOutcome: { type: "string" },
                profitPathwayTimeframe: { type: "string" },
                richMindsetCommonBelief: { type: "string" },
                richMindsetWealthBuilder: { type: "string" },
                ethicalFrameworks: { type: "array", items: { type: "object", properties: { tradition: { type: "string", enum: ["jewish", "islamic", "stoic", "utilitarian", "virtue", "esg"] }, principle: { type: "string" }, application: { type: "string" } }, required: ["tradition", "principle", "application"] } },
                financialPitfallName: { type: "string" },
                financialPitfallDescription: { type: "string" },
                financialPitfallAvoidance: { type: "string" },
                roiPotential: { type: "string", enum: ["low", "medium", "high", "extreme"] },
                profitProtocols: { type: "array", items: { type: "object", properties: { action: { type: "string" }, linkedCourse: { type: "string" }, linkedCourseId: { type: "string" } }, required: ["action"] } },
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
      id: `dle-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
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
      // Domain Leverage Engine fields
      wealthDomain: raw.wealthDomain,
      leveragePoint: raw.leveragePoint,
      profitPathway: raw.profitPathwayScenario && raw.profitPathwayOutcome
        ? { scenario: raw.profitPathwayScenario, potentialOutcome: raw.profitPathwayOutcome, timeframe: raw.profitPathwayTimeframe || "" }
        : undefined,
      richMindsetContrast: raw.richMindsetCommonBelief && raw.richMindsetWealthBuilder
        ? { commonBelief: raw.richMindsetCommonBelief, wealthBuilder: raw.richMindsetWealthBuilder }
        : undefined,
      ethicalFrameworks: raw.ethicalFrameworks,
      financialPitfall: raw.financialPitfallName
        ? { name: raw.financialPitfallName, description: raw.financialPitfallDescription || "", avoidanceStrategy: raw.financialPitfallAvoidance || "" }
        : undefined,
      roiPotential: raw.roiPotential,
      profitProtocols: raw.profitProtocols,
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
