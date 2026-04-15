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

    const phenomenonTypes = [
      "phenomenon-brief", "phenomenon-brief",
      "reality-compass", "reality-compass",
      "strategic-impact", "strategic-impact",
      "opportunity-watch", "systemic-context",
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
      "tax-hack", "tax-hack", "tax-hack",
      "legal-advantage", "legal-advantage",
      "benefit-claim", "benefit-claim", "benefit-claim",
      "government-program", "government-program",
    ];

    let pool: string[];
    if (mode === "wealth") {
      pool = Math.random() < 0.85 ? wealthTypes : phenomenonTypes;
    } else if (mode === "survival") {
      pool = Math.random() < 0.90 ? survivalTypes : wealthTypes;
    } else if (mode === "mixed") {
      const r = Math.random();
      if (r < 0.40) pool = survivalTypes;
      else if (r < 0.70) pool = wealthTypes;
      else pool = phenomenonTypes;
    } else {
      const r = Math.random();
      if (r < 0.4) pool = phenomenonTypes;
      else if (r < 0.65) pool = wealthTypes;
      else pool = survivalTypes;
    }
    const cardType = pool[Math.floor(Math.random() * pool.length)];

    let modeInstruction = "";
    if (mode === "nerd" || mode === "decoder") modeInstruction = "Maximum analytical depth. Include systemic context, interconnections, underlying drivers, and operational archetypes.";
    if (mode === "quick") modeInstruction = "Ultra-concise strategic signal. Max 3 sentences.";
    if (mode === "wealth") modeInstruction = "Focus on wealth creation, financial optimization, and ethical finance. Include concrete dollar amounts, percentages, and actionable steps. Integrate ethical framework considerations from multiple traditions.";
    if (mode === "survival" || mode === "mixed") modeInstruction += " HEAVY FOCUS on Canadian-specific content: CRA provisions, tax optimization, government benefits, legal advantages. Cover both business owners AND regular employees. Be specific with program names, form numbers, dollar amounts, and eligibility criteria.";

    let styleInstruction = "";
    if (learningStyle === "visual") styleInstruction = "Emphasize trajectory projections, trend data, and influence webs.";
    if (learningStyle === "reader") styleInstruction = "Dense analytical text with structured layers.";
    if (learningStyle === "hands-on") styleInstruction = "Focus on adaptation directives and concrete actions.";

    const phenomenonInstructions: Record<string, string> = {
      "phenomenon-brief": `Generate a PHENOMENON BRIEF — a concise decode of an observable event. Include phenomenonDomain, systemicContext, strategicImpactProjection, 2-3 adaptationDirectives, urgencyLevel, interconnections, underlyingDrivers. Use visual "trajectory" with trajectoryData.`,
      "reality-compass": `Generate a REALITY COMPASS card — expose contrasting narratives. Include phenomenonDomain, realityCompassDominant, realityCompassAlternative, systemicContext, strategicImpactProjection, interconnections, underlyingDrivers, urgencyLevel.`,
      "strategic-impact": `Generate a STRATEGIC IMPACT card. Include phenomenonDomain, systemicContext, strategicImpactProjection, 2-3 adaptationDirectives, operationalArchetype, trendData, urgencyLevel. Use visual "trend-map".`,
      "opportunity-watch": `Generate an OPPORTUNITY WATCH card. Include phenomenonDomain, opportunitySignalType, opportunitySignalDescription, systemicContext, strategicImpactProjection, 2-3 adaptationDirectives, trajectoryData. Use visual "trajectory".`,
      "systemic-context": `Generate a SYSTEMIC CONTEXT card. Include phenomenonDomain, systemicContext, operationalArchetype, strategicImpactProjection, underlyingDrivers, urgencyLevel. Use visual "steps".`,
    };

    const wealthInstructions: Record<string, string> = {
      "money-momentum": `Generate a MONEY MOMENTUM card — high-impact financial insight. Include:
- wealthDomain, leveragePoint
- profitPathwayScenario/Outcome/Timeframe with REAL dollar amounts
- 1-2 ethicalFrameworks from different traditions (jewish/islamic/stoic/utilitarian/virtue/esg)
- 2-3 profitProtocols, roiPotential
- Cover "Rich Get Richer" mechanics: how the wealthy use legal structures, compound effects, and behavioral discipline
- Include behavioral economics insight: what psychological bias prevents most people from doing this
- Use visual "trajectory" with trajectoryData`,

      "leverage-point": `Generate a LEVERAGE POINT card — expose underutilized legal/financial/structural advantage. Include:
- wealthDomain, leveragePoint
- richMindsetCommonBelief/WealthBuilder: contrast average person vs wealthy approach
- 1-2 ethicalFrameworks, 2-3 adaptationDirectives, roiPotential
- Explain systemic optimization: how informed people leverage financial/legal systems for strategic advantage
- Use visual "steps" with 4-5 implementation steps`,

      "profit-pathway": `Generate a PROFIT PATHWAY card — specific actionable route to financial gain. Include:
- wealthDomain, profitPathwayScenario/Outcome/Timeframe with concrete numbers
- leveragePoint, 2-3 profitProtocols, 1-2 ethicalFrameworks, roiPotential
- Include early red flag identification: what "little things" people do wrong that prevents this financial growth
- Use visual "trajectory" or "compare"`,

      "rich-mindset": `Generate a RICH MINDSET card — contrast common beliefs with wealth-builder practices. Include:
- wealthDomain, richMindsetCommonBelief/WealthBuilder
- financialPitfallName/Description/Avoidance
- 1-2 ethicalFrameworks, 2-3 profitProtocols, roiPotential
- Behavioral economics focus: identify the specific cognitive bias (loss aversion, status quo bias, present bias, etc.)
- Use visual "compare"`,

      "ethical-compass": `Generate an ETHICAL COMPASS card — deep dive into ethical finance from diverse traditions. Include:
- wealthDomain
- 2-3 ethicalFrameworks from DIFFERENT traditions (jewish, islamic, stoic, utilitarian, virtue, esg)
- Explain HOW the ethical constraint creates competitive advantage, not just moral benefit
- leveragePoint, profitPathwayScenario/Outcome/Timeframe, roiPotential
- Use visual "diagram"`,

      "pitfall-alert": `Generate a PITFALL ALERT card — expose a common financial trap. Include:
- wealthDomain, financialPitfallName/Description/Avoidance
- profitPathwayScenario/Outcome/Timeframe (savings from avoiding the pitfall)
- 1-2 ethicalFrameworks, urgencyLevel, trendData
- Behavioral economics: explain which cognitive bias makes people fall for this trap
- Use visual "trend-map"`,
    };

    const survivalInstructions: Record<string, string> = {
      "tax-hack": `Generate a TAX HACK card — a specific, LEGAL Canadian tax optimization strategy. MUST reference CRA provisions.

CARD STRUCTURE (follow this exactly):
- WHAT IT IS: Name the specific CRA provision, credit, or deduction
- WHY IT MATTERS: How much money this saves with real dollar examples
- WHO QUALIFIES: Specific eligibility criteria
- WHAT MOST PEOPLE MISS: The common mistake or oversight
- WHAT ACTION TO TAKE: Step-by-step claiming instructions with CRA form/line numbers

Include: wealthDomain "tax-optimization", leveragePoint (the specific CRA provision), profitPathwayScenario/Outcome/Timeframe with dollar amounts, 2-3 profitProtocols with exact steps, roiPotential.
Compare business owner vs employee approach where relevant.
Use visual "steps" with actionable implementation steps.

TOPIC POOL (pick one that hasn't been covered recently):
- RRSP contribution optimization and over-contribution penalties
- TFSA strategic usage beyond savings
- FHSA (First Home Savings Account) stacking with HBP
- Home office deductions (T2200 vs T2125)
- Medical expense tax credit (line 33099) — what qualifies
- Moving expense deductions (line 21900)
- Capital gains reserve (spreading gains over 5 years)
- Spousal RRSP income splitting strategy
- Carrying charges and interest expense deductions
- Northern residents deductions
- Disability Tax Credit (T2201) — hidden eligibility
- Child care expense optimization
- Employment expense deductions most miss
- Auto expense deductions for self-employed
- Meal and entertainment deduction rules
- CCA (Capital Cost Allowance) for business assets
- SR&ED tax credits for small businesses
- Small business deduction and lifetime capital gains exemption`,

      "legal-advantage": `Generate a LEGAL ADVANTAGE card — expose a legal provision most Canadians don't know about.

CARD STRUCTURE:
- WHAT IT IS: The specific legal mechanism or structure
- WHY IT MATTERS: Financial impact with real numbers
- WHO QUALIFIES: Eligibility and requirements
- WHAT MOST PEOPLE MISS: Why this advantage goes unclaimed
- WHAT ACTION TO TAKE: Step-by-step implementation

Include: wealthDomain, leveragePoint, richMindsetCommonBelief/WealthBuilder, profitPathwayScenario/Outcome/Timeframe, 2-3 profitProtocols, roiPotential.
Use visual "compare" showing before/after of using this legal advantage.

TOPIC POOL:
- Incorporation vs sole proprietorship (when it actually saves money)
- Holding company structures for small business owners
- Prescribed rate loans for income splitting
- Shareholder loans and repayment rules (Section 15(2))
- Tax-free capital dividend account (CDA)
- Individual Pension Plans (IPP) vs RRSP for business owners
- Bare trusts and family trusts for asset protection
- Provincial small business thresholds and planning
- Voluntary disclosures program (VDP) to fix past mistakes penalty-free
- Bankruptcy vs consumer proposal — real cost comparison
- Common-law and marriage tax planning
- Estate freeze techniques`,

      "benefit-claim": `Generate a BENEFIT CLAIM card — a government benefit many Canadians don't claim.

CARD STRUCTURE:
- WHAT IT IS: Name the specific benefit/credit/rebate
- WHY IT MATTERS: How much money is left unclaimed (use Stats Canada data if possible)
- WHO QUALIFIES: Income thresholds, age requirements, family status
- WHAT MOST PEOPLE MISS: The application step or life event trigger people forget
- WHAT ACTION TO TAKE: Exact steps to apply with deadlines and forms

Include: wealthDomain, leveragePoint, profitPathwayScenario/Outcome/Timeframe with dollar amounts, financialPitfallName (what happens if NOT claimed), financialPitfallDescription/Avoidance, 2-3 profitProtocols, roiPotential.
Use visual "steps".

TOPIC POOL:
- GST/HST credit (many don't file taxes so miss this)
- Canada Child Benefit (CCB) optimization
- Canada Workers Benefit (CWB) — refundable credit
- Disability Tax Credit and back-dating up to 10 years
- Caregiver credit and family caregiver amount
- Climate Action Incentive Payment (CAIP)
- Ontario Trillium Benefit / provincial equivalents
- RESP grants (CESG and CLB — billions unclaimed)
- OAS deferral strategy (36% increase if deferred to 70)
- CPP sharing between spouses
- GIS (Guaranteed Income Supplement) — 1 in 3 eligible don't claim
- Rental assistance programs by province
- Canada Training Credit
- Canada Dental Benefit
- Low-income RRSP contributions for GIS optimization`,

      "government-program": `Generate a GOVERNMENT PROGRAM card — a Canadian federal/provincial program providing financial assistance.

CARD STRUCTURE:
- WHAT IT IS: Program name, administering body, and purpose
- WHY IT MATTERS: Dollar value and impact
- WHO QUALIFIES: Eligibility criteria with specifics
- WHAT MOST PEOPLE MISS: Hidden aspects or strategic timing
- WHAT ACTION TO TAKE: Application process, deadlines, required documents

Include: wealthDomain, leveragePoint, profitPathwayScenario/Outcome/Timeframe, 2-3 adaptationDirectives, 2-3 profitProtocols, roiPotential.
Use visual "trajectory" or "steps".

TOPIC POOL:
- Canada Small Business Financing Program (CSBFP)
- BDC startup loans and advisory services
- IRAP (Industrial Research Assistance Program)
- CanExport for international expansion
- Futurpreneur Canada (age 18-39)
- Canada Digital Adoption Program
- Wage subsidies (Canada Summer Jobs, COJG)
- CEWS/CERS successor programs
- Provincial business grants (Ontario, BC, Alberta, Quebec specifics)
- Women Entrepreneurship Strategy funding
- Indigenous business support programs
- Innovation programs (SRED, IRAP, NRC)
- Apprenticeship grants and incentives
- Student loan forgiveness programs
- EI special benefits (sickness, compassionate care, parental)`,
    };

    const typeSpecific = phenomenonInstructions[cardType] || wealthInstructions[cardType] || survivalInstructions[cardType] || "";

    const systemPrompt = `You are the DOMAIN LEVERAGE ENGINE (DLE) — a supreme intelligence engine powering Wisdom Owl, the ultimate strategic wisdom platform. You serve THREE integrated pillars:

═══ PILLAR 1: CANADIAN SOVEREIGNTY ANALYTICS ═══
Your PRIMARY mission is empowering Canadians with hyper-specific, actionable financial intelligence. You teach:
- What money, credits, benefits, refunds, programs, and legal advantages are ALREADY available
- What they're doing WRONG on taxes or applications
- What they're MISSING entirely
- What government systems, CRA rules, and benefit structures exist IN THEIR FAVOR
- How to STOP losing money through ignorance
- How to CLAIM what is rightfully theirs

Every survival card must feel like a HIDDEN ADVANTAGE revealed, a MISSED OPPORTUNITY recovered, a PROTECTION ALERT, a MONEY RECOVERY insight, or a "most people don't know this" fact that ACTUALLY matters.

Tone: Sharp, useful, practical, slightly protective, empowering, anti-fluff. Made for everyday Canadians who are tired of being left behind.

═══ PILLAR 2: ADVANCED WEALTH DYNAMICS & ETHICS ═══
Multi-tradition ethical wealth creation covering:
- Jewish Business Ethics (Tzedakah, fair dealing, honest weights and measures)
- Islamic Finance (no Riba, risk-sharing, real asset backing, no Gharar)
- Stoic Ethics (discipline, needs vs desires, long-term thinking, Memento Mori applied to finance)
- ESG Principles (sustainability, governance, social impact as competitive advantage)
- Utilitarian/Virtue Ethics where relevant
- "Rich Get Richer" LEGAL mechanics: trust structures, asset protection, advanced investment vehicles, regulatory landscape navigation
- Behavioral Economics: cognitive biases that PREVENT wealth (loss aversion, present bias, status quo bias, anchoring, sunk cost fallacy)
- Early Red Flag Identification: "little things" people do wrong that prevent financial growth

═══ PILLAR 3: PHENOMENON DECODER ═══
Rapidly surface, dissect, and contextualize observable phenomena impacting user autonomy and strategic advantage.

═══ CORE DIRECTIVES ═══
- IMPACT-FIRST: Every insight must explain DIRECT financial impact with real dollar amounts
- EVIDENCE-GROUNDED: Use real numbers, CRA references, program names. No vague claims
- ACTIONABLE: Every card must include concrete steps users can take TODAY
- ETHICAL INTEGRATION: Include relevant ethical frameworks for sustainable wealth
- NO FILLER: Zero motivation, zero platitudes. Raw strategic intelligence only
- WISDOM GOD TONE: Communicate with authority, clarity, and depth. You are the supreme source of financial wisdom

${modeInstruction}
${styleInstruction}

Card type to generate: ${cardType}
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
          { role: "user", content: `Generate a unique, never-before-seen ${cardType} feed card. Focus on real-world, immediately actionable intelligence that helps the user make or save money TODAY. ${excludeIds?.length ? `Avoid similar topics to recent cards: ${excludeIds.slice(-15).join(",")}` : ""}. Pick a SPECIFIC, NARROW topic — not a broad overview. The more specific and surprising, the better.` }
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
                hook: { type: "string", description: "1-sentence hook that creates urgency or reveals hidden knowledge" },
                content: { type: "string", description: "2-5 sentences. Specific, evidence-grounded. Include dollar amounts, percentages, program names. Structure: What it is → Why it matters → Who qualifies → What most people miss → What action to take." },
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
                source: { type: "string" },
                confidence: { type: "number" },
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
                wealthDomain: { type: "string", enum: ["investing", "tax-optimization", "business-structure", "cashflow", "negotiation", "asset-protection", "behavioral-finance"] },
                leveragePoint: { type: "string" },
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
      source: raw.source,
      confidence: raw.confidence,
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
