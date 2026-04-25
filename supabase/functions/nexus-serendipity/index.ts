// THE KNOWLEDGE NEXUS — Strategic Serendipity Engine
// Generates ONE daily cross-domain insight for the user that breaks filter bubbles
// and exposes high-leverage knowledge from a seemingly unrelated domain.
//
// Synthesizes: primary goal, mastery scores (gaps + strengths), calibration,
// recently completed lessons. Deliberately picks a domain the user has NOT
// engaged with recently.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM = `You are the STRATEGIC SERENDIPITY ENGINE of THE KNOWLEDGE NEXUS — Wisdom Owl's filter-bubble breaker.

YOUR JOB: Surface ONE non-obvious, cross-domain insight per day that the user did NOT know they needed, but which materially advances their primary strategic goal.

NON-NEGOTIABLE QUALITY BAR:
- The source domain must be DELIBERATELY UNRELATED on the surface to the user's goal (bio-mimicry, military doctrine, ancient governance, ecology, neuroscience, theatre direction, monastic logistics, naval signaling, jazz arrangement, etc.).
- The connection must be DEFENSIBLE — a sharp operator should read "why this matters" and say "actually yes."
- HYPER-CURRENT framing where possible (cite 2025/2026 examples even when the source domain is ancient).
- NO MOTIVATIONAL FLUFF. NO QUOTES. Operator-to-operator.
- Title must be a strong, declarative claim — not a question.

You return STRICT JSON via the provided tool.`;

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

    const [profileR, progressR, goalsR] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("user_progress").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("user_goals").select("*").eq("user_id", user.id).eq("completed", false).order("updated_at", { ascending: false }).limit(3),
    ]);

    const profile = profileR.data || {};
    const progress = progressR.data || {};
    const goals = goalsR.data || [];

    const masteryScores = (progress.mastery_scores as Record<string, number>) || {};
    const completedLessons = (progress.completed_lessons as string[]) || [];

    const recentCategories = Array.from(new Set(
      completedLessons.slice(-15).map((id: string) => id.split(":")[0] || id.split("-")[0]),
    )).slice(0, 6);

    const userContext = {
      primary_goal: goals[0] ? { title: goals[0].title, why: goals[0].why, target_metric: goals[0].target_metric } : null,
      additional_goals: goals.slice(1).map((g: any) => ({ title: g.title })),
      goal_mode: profile.goal_mode || "income",
      primary_desire: profile.primary_desire || "",
      learning_style: profile.learning_style || "visual",
      mastery_strengths: Object.entries(masteryScores).sort(([, a], [, b]) => (b as number) - (a as number)).slice(0, 5),
      mastery_gaps: Object.entries(masteryScores).filter(([, s]) => (s as number) < 40).slice(0, 5).map(([c]) => c),
      recent_categories_to_avoid: recentCategories,
      streak: progress.streak || 0,
      // a date seed so model output naturally rotates day to day
      today: new Date().toISOString().slice(0, 10),
    };

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
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: `USER CONTEXT:
${JSON.stringify(userContext, null, 2)}

Generate today's Strategic Serendipity card. Pick a SOURCE DOMAIN the user has not engaged with. Connect it to their primary goal.`,
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_serendipity",
            description: "Return today's Strategic Serendipity insight.",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string", description: "Strong declarative title — the unexpected claim." },
                sourceDomain: { type: "string", description: "The seemingly-unrelated domain (e.g. 'naval signaling doctrine', 'cordyceps fungi behavior')." },
                keyTakeaway: { type: "string", description: "1-2 sentence core message — the cross-domain insight." },
                whyThisMattersToYou: { type: "string", description: "3-5 sentences. Personalized. Names the user's primary goal explicitly. Defensibly explains the non-obvious leverage." },
                actionableImplications: {
                  type: "array",
                  items: { type: "string" },
                  description: "2-3 concrete moves the user can make this week to apply this. Each is one sentence.",
                },
                relatedNexusTags: {
                  type: "array",
                  items: { type: "string" },
                  description: "1-3 tags from the Wisdom God Core taxonomy this insight aligns with (e.g. 'leverage', 'compounding', 'systems').",
                },
              },
              required: ["title", "sourceDomain", "keyTakeaway", "whyThisMattersToYou", "actionableImplications"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_serendipity" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Rate limited." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiResp.status === 402) return new Response(JSON.stringify({ error: "Workspace credits required." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await aiResp.text();
      console.error("serendipity gateway", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiJson = await aiResp.json();
    const tc = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    const args = tc ? JSON.parse(tc.function.arguments) : null;
    if (!args?.title) throw new Error("Invalid serendipity structure");

    const card = {
      generatedAt: Date.now(),
      forDate: new Date().toISOString().slice(0, 10),
      primaryGoal: goals[0]?.title || null,
      title: String(args.title),
      sourceDomain: String(args.sourceDomain),
      keyTakeaway: String(args.keyTakeaway),
      whyThisMattersToYou: String(args.whyThisMattersToYou),
      actionableImplications: Array.isArray(args.actionableImplications) ? args.actionableImplications.map(String) : [],
      relatedNexusTags: Array.isArray(args.relatedNexusTags) ? args.relatedNexusTags.map(String) : [],
    };

    return new Response(JSON.stringify(card), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("nexus-serendipity error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
