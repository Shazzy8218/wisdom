import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SURVIVAL_TYPES = ["tax-hack", "legal-advantage", "benefit-claim", "government-program"];
const PHENOMENON_TYPES = ["phenomenon-brief", "systemic-context", "reality-check", "deep-pattern"];
const WEALTH_TYPES = ["money-momentum", "leverage-point", "pitfall-alert", "rich-mindset", "ethical-compass"];

function pickType(mode: string): string {
  const pool = mode === "survival" ? SURVIVAL_TYPES
    : mode === "phenomenon" ? PHENOMENON_TYPES
    : mode === "wealth" ? WEALTH_TYPES
    : [...SURVIVAL_TYPES, ...PHENOMENON_TYPES, ...WEALTH_TYPES];
  return pool[Math.floor(Math.random() * pool.length)];
}

function buildSystemPrompt(mode: string, cardType: string): string {
  const base = `You are the Wisdom Owl — a world-class intelligence analyst and financial strategist. Generate a single feed card with UNIQUE, never-before-seen content. Every card must be 100% original with specific, actionable intelligence. Never repeat topics.`;

  if (mode === "survival" || SURVIVAL_TYPES.includes(cardType)) {
    return `${base}

SURVIVAL ENGINE — Canadian Tax & Legal Intelligence:
Generate actionable Canadian-specific strategies covering:
- CRA tax provisions, deductions, credits (medical, childcare, home office, moving, union dues)
- RRSP vs TFSA optimization, pension splitting, spousal RRSP strategies
- CCB (Canada Child Benefit), GST/HST credits, OAS/GIS, disability tax credit
- Small business incorporation advantages, SR&ED tax credits
- Legal advantages: employment law rights, tenant rights, consumer protection
- Government programs: EI, CPP optimization, provincial benefits
- Real estate tax strategies, capital gains exemptions, principal residence rules
Each card must reference specific CRA forms, sections, or program names.`;
  }

  if (mode === "phenomenon" || PHENOMENON_TYPES.includes(cardType)) {
    return `${base}

PHENOMENON DECODER — Strategic Pattern Recognition:
Generate cards that decode hidden systemic patterns in:
- Technology shifts, market dynamics, geopolitical movements
- Behavioral economics, cognitive biases in real-world systems
- Power structures, information asymmetries, network effects
- Historical pattern parallels, emerging trend analysis
Each card must reveal a non-obvious connection or pattern.`;
  }

  return `${base}

WEALTH ENGINE — Financial Intelligence:
Generate cards covering:
- Wealth-building mental models, compound leverage strategies
- Investment psychology, market microstructure insights
- Business model analysis, revenue architecture patterns
- Ethical frameworks (Stoic, ESG, long-term value creation)
- Common financial pitfalls and how to avoid them
Each card must include a concrete, actionable takeaway.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { mode = "survival", excludeIds = [] } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const cardType = pickType(mode);
    const systemPrompt = buildSystemPrompt(mode, cardType);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate a ${cardType} feed card. Focus on real-world, actionable intelligence that is completely unique. ${excludeIds?.length ? `Avoid topics related to: ${excludeIds.slice(-10).join(",")}` : ""}` }
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_feed_card",
            description: "Create a structured feed card",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string", description: "Bold, attention-grabbing title (max 60 chars)" },
                hook: { type: "string", description: "One-line hook that creates urgency (max 120 chars)" },
                content: { type: "string", description: "Main educational content (150-300 words)" },
                visual: { type: "string", enum: ["before-after", "steps", "chips", "flow", "comparison"], description: "Visual format" },
                visualData: { type: "object", description: "Data for the visual (steps: {steps:string[]}, chips: {chips:string[]}, before-after: {before:string, after:string})" },
                interaction: { type: "string", enum: ["choice", "reveal", "rate"], description: "Interaction type" },
                options: { type: "array", items: { type: "string" }, description: "Options for choice interaction (2-4 items)" },
                correctAnswer: { type: "number", description: "Index of correct answer (0-based)" },
                tryPrompt: { type: "string", description: "Actionable prompt for the user to try (max 100 chars)" },
                confidence: { type: "number", description: "Confidence score 70-99" },
                source: { type: "string", description: "Source attribution" },
                shareSnippet: { type: "string", description: "Shareable one-liner" },
                difficulty: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
                urgencyLevel: { type: "string", enum: ["low", "medium", "high", "critical"] },
              },
              required: ["title", "hook", "content", "visual", "visualData", "confidence", "difficulty", "urgencyLevel"],
              additionalProperties: false,
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "create_feed_card" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const args = JSON.parse(toolCall.function.arguments);
    const card = {
      id: crypto.randomUUID(),
      type: cardType,
      xp: cardType.includes("tax") || cardType.includes("legal") ? 30 : 20,
      tokens: Math.floor(Math.random() * 3) + 2,
      ...args,
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
