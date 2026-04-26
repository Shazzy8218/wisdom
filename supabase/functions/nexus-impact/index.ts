// IMPACT PROJECTION MATRIX — AI-computed projection for the user's active goal.
// Returns goalContributionPct, skillAmplification, opportunityCost, rationale.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnon, { global: { headers: { Authorization: authHeader } } });

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const mod = body.module || {};
    if (!mod.id || !mod.title) {
      return new Response(JSON.stringify({ error: "module {id,title,pillar,difficulty,tags,outcomes?} required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const goalsR = await supabase
      .from("user_goals")
      .select("title, why, target_metric, current_value, target_value, deadline")
      .eq("user_id", user.id).eq("completed", false)
      .order("updated_at", { ascending: false }).limit(1);

    const goal = goalsR.data?.[0] || null;
    if (!goal) {
      return new Response(JSON.stringify({ error: "no_active_goal" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) throw new Error("LOVABLE_API_KEY not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are the Predictive Manifestation Engine of Wisdom Owl.
For a single learning MODULE and a user's ACTIVE GOAL, return a quantified impact projection:
- goalContributionPct (0-50): predictive lift in probability of achieving the goal if mastered.
- skillAmplification (0-100): composite skill proficiency boost.
- opportunityCost: numeric loss (in the goal's metric units) if knowledge is NOT acquired.
- opportunityCostUnit: label for that number ("$", "$ / yr", "hrs / mo", etc.).
- rationale: one operator-grade sentence — no marketing.

Be conservative but credible. Honor the goal's remaining-distance and the module's difficulty.`,
          },
          {
            role: "user",
            content: `MODULE:\n${JSON.stringify(mod, null, 2)}\n\nACTIVE GOAL:\n${JSON.stringify(goal, null, 2)}\n\nReturn the projection.`,
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_impact",
            description: "Return the impact projection for the module against the active goal.",
            parameters: {
              type: "object",
              properties: {
                goalContributionPct: { type: "number" },
                skillAmplification: { type: "number" },
                opportunityCost: { type: "number" },
                opportunityCostUnit: { type: "string" },
                rationale: { type: "string" },
              },
              required: ["goalContributionPct", "skillAmplification", "opportunityCost", "opportunityCostUnit", "rationale"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_impact" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Workspace credits required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const errText = await aiResponse.text();
      console.error("Impact gateway error:", status, errText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiJson = await aiResponse.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall ? JSON.parse(toolCall.function.arguments) : null;
    if (!args) throw new Error("Invalid AI response");

    const projection = {
      goalContributionPct: Math.max(0, Math.min(50, Math.round(Number(args.goalContributionPct) || 0))),
      skillAmplification: Math.max(0, Math.min(100, Math.round(Number(args.skillAmplification) || 0))),
      opportunityCost: Math.max(0, Math.round(Number(args.opportunityCost) || 0)),
      opportunityCostUnit: String(args.opportunityCostUnit || "units"),
      rationale: String(args.rationale || ""),
      source: "ai" as const,
      goalTitle: goal.title,
    };

    return new Response(JSON.stringify(projection), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Impact error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
