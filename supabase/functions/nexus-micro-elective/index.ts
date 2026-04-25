// THE KNOWLEDGE NEXUS — AI-On-Demand Micro-Elective Generator
// Produces hyper-current Wisdom God Core micro-electives in the style of the
// flagship modules. Streams to client. Trained-by-prompt on flagship doctrine.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FLAGSHIP_DOCTRINE = `
You generate ULTRA-CURRENT micro-electives in the voice and rigor of THE KNOWLEDGE NEXUS — Wisdom Owl's "Wisdom God Core" tier.

NON-NEGOTIABLE QUALITY BAR:
- HYPER-CURRENT (April 2026 baseline; reference 2026/2027 instruments, regulations, technologies).
- APPLICATION-FIRST: every section ends with a concrete operator move.
- BEYOND THE TEXTBOOK: include knowledge not found in mainstream curricula — operator playbooks, cross-jurisdictional structure, multi-tradition ethical lenses.
- ETHICAL INTEGRATION: where finance/strategy is involved, weave at least one ethical doctrine (Talmudic, Islamic Muamalat, Stoic, Confucian, Aristotelian) as a structural decision-tool, not garnish.
- NO MARKETING LANGUAGE. NO FLUFF. Operator-grade prose.
- CONCRETE NUMBERS, NAMED FRAMEWORKS, REAL JURISDICTIONS where applicable.

LENGTH TARGET: 600-900 words across 3-4 sections + 1 case study.
`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { topic, pillar, userGoal } = await req.json();
    if (!topic || typeof topic !== "string" || topic.length > 300) {
      return new Response(JSON.stringify({ error: "Invalid topic" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) throw new Error("LOVABLE_API_KEY not configured");

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: FLAGSHIP_DOCTRINE },
          {
            role: "user",
            content: `Generate a Wisdom God Core micro-elective.

TOPIC: ${topic}
PILLAR: ${pillar || "ethical-finance"}
USER GOAL CONTEXT: ${userGoal || "general operator advancement"}

Format as Markdown:
# {title}
*{1-line hook universities cannot teach}*

**Why this is forbidden in mainstream curricula:** {2 sentences}

**Outcomes:**
- {3-4 measurable outcomes}

## {section 1 heading}
{dense applied prose}
**Operator move:** {one concrete action}

## {section 2 heading}
{dense applied prose}
**Operator move:** {one concrete action}

## {section 3 heading}
{dense applied prose}
**Operator move:** {one concrete action}

## Case Study: {title}
**Setup:** ...
**Decision:** ...
**Outcome:** ...

## Ethical Lens
{Apply one named doctrine — e.g. Talmudic dina d'malkhuta dina, Islamic riba, Stoic prudence — as a decision filter on this topic.}`,
          },
        ],
        stream: true,
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "Workspace credits required." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiResp.text();
      console.error("Gateway error", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(aiResp.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (err) {
    console.error("Micro-elective error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
