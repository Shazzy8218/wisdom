// COGNITIVE STATE CALIBRATION — AI fallback for ambiguous states.
// Called only when client-side heuristics return "ambiguous".

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
    const localInput = body.input || {};

    const [profileR, progressR, goalsR] = await Promise.all([
      supabase.from("profiles").select("primary_desire, goal_mode, intensity, learning_style").eq("id", user.id).maybeSingle(),
      supabase.from("user_progress").select("mastery_scores, streak, lessons_today, tokens, completed_lessons").eq("user_id", user.id).maybeSingle(),
      supabase.from("user_goals").select("title, target_metric, current_value, target_value, deadline").eq("user_id", user.id).eq("completed", false).order("updated_at", { ascending: false }).limit(3),
    ]);

    const profile = profileR.data || {};
    const progress = progressR.data || {};
    const goals = goalsR.data || [];

    const ctx = {
      local_signals: localInput,
      goals: goals.map((g: any) => ({ title: g.title, metric: g.target_metric, progress_pct: g.target_value > 0 ? Math.round((Number(g.current_value) / Number(g.target_value)) * 100) : 0, deadline: g.deadline })),
      streak: progress.streak || 0,
      lessons_today: progress.lessons_today || 0,
      total_lessons: ((progress.completed_lessons as string[]) || []).length,
      mastery_top: Object.entries((progress.mastery_scores as Record<string, number>) || {}).sort(([, a], [, b]) => (b as number) - (a as number)).slice(0, 3),
      intensity: profile.intensity || "normal",
      goal_mode: profile.goal_mode || "income",
      primary_desire: profile.primary_desire || "",
    };

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
            content: `You are the Cognitive State Calibrator for Wisdom Owl's Knowledge Nexus.
Decide which of three entry paths fits the user RIGHT NOW:
- "peak": deep, multi-step learning module (best when fresh, focused, goal-active).
- "recharge": short cognitive reset (best when fatigue / saturation signals).
- "impact": 30-second compressed insight (best when low momentum or seeking quick win).

Return STRICT JSON via the tool. The "reason" field is one operator-grade sentence Shazzy-Owl will speak — no marketing.`,
          },
          { role: "user", content: `USER STATE:\n${JSON.stringify(ctx, null, 2)}\n\nChoose the optimal path.` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_calibration",
            description: "Return chosen cognitive path and reason.",
            parameters: {
              type: "object",
              properties: {
                path: { type: "string", enum: ["peak", "recharge", "impact"] },
                reason: { type: "string", description: "One sentence — why this path, why now." },
              },
              required: ["path", "reason"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_calibration" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Workspace credits required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const errText = await aiResponse.text();
      console.error("Calibrate gateway error:", status, errText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiJson = await aiResponse.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall ? JSON.parse(toolCall.function.arguments) : null;
    if (!args || !args.path) throw new Error("Invalid AI response");

    const path = ["peak", "recharge", "impact"].includes(args.path) ? args.path : "impact";

    return new Response(JSON.stringify({ path, reason: String(args.reason || ""), source: "ai" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Calibrate error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
