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

function buildPrompt(mode: string, cardType: string): string {
  let context = "";
  if (mode === "survival" || SURVIVAL_TYPES.includes(cardType)) {
    context = `Canadian Tax & Legal Survival: CRA provisions, RRSP/TFSA, CCB, GST/HST credits, disability tax credit, incorporation, SR&ED, employment law, tenant rights, EI, CPP optimization. Reference specific CRA forms or program names.`;
  } else if (mode === "phenomenon" || PHENOMENON_TYPES.includes(cardType)) {
    context = `Systemic Pattern Recognition: technology shifts, behavioral economics, power structures, information asymmetries, historical parallels, emerging trends. Reveal non-obvious connections.`;
  } else {
    context = `Financial Intelligence: wealth-building mental models, investment psychology, business model analysis, ethical frameworks, financial pitfalls. Include concrete actionable takeaway.`;
  }

  return `You are the Wisdom Owl. Generate a ${cardType} feed card about: ${context}

Return ONLY valid JSON with these fields:
{"title":"bold title max 60 chars","hook":"urgency hook max 120 chars","content":"main content 100-200 words","visual":"steps","visualData":{"steps":["step1","step2","step3"]},"confidence":85,"difficulty":"beginner","urgencyLevel":"medium"}

visual must be one of: before-after, steps, chips, flow, comparison
For steps: visualData={steps:[...]}
For chips: visualData={chips:[...]}
For before-after: visualData={before:"...",after:"..."}
difficulty: beginner/intermediate/advanced
urgencyLevel: low/medium/high/critical
confidence: number 70-99

ONLY output the JSON object. No markdown, no backticks.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { mode = "survival" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const cardType = pickType(mode);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "user", content: buildPrompt(mode, cardType) }
        ],
        temperature: 1.0,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const t = await response.text();
      console.error("AI error:", status, t);
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "";
    
    // Parse JSON from response, stripping markdown fences if present
    const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const args = JSON.parse(cleaned);

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
