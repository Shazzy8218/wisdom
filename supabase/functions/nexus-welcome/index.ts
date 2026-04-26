// THE KNOWLEDGE NEXUS — Adaptive Welcome (Intuitive Intelligence Portal)
// Returns a persona-driven welcome question + recommended action + confidence score.
// Lives at the top of /nexus. Caches client-side for ~1h.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface FlagshipSummary {
  id: string;
  pillar: string;
  title: string;
  hook: string;
  tags: string[];
}

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
    const supabase = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const flagships: FlagshipSummary[] = body.flagships || [];
    const displayName: string = body.displayName || "";

    const [profileR, progressR, goalsR] = await Promise.all([
      supabase.from("profiles").select("display_name,primary_desire,goal_mode,output_mode,answer_tone").eq("id", user.id).maybeSingle(),
      supabase.from("user_progress").select("mastery_scores,streak,lessons_today,completed_lessons,tokens").eq("user_id", user.id).maybeSingle(),
      supabase.from("user_goals").select("title,target_metric,current_value,baseline_value,target_value,deadline").eq("user_id", user.id).eq("completed", false).order("updated_at", { ascending: false }).limit(3),
    ]);

    const profile: any = profileR.data || {};
    const progress: any = progressR.data || {};
    const goals: any[] = goalsR.data || [];

    const masteryScores = (progress.mastery_scores as Record<string, number>) || {};
    const masteryEntries = Object.entries(masteryScores);
    const avgMastery = masteryEntries.length
      ? Math.round(masteryEntries.reduce((s, [, v]) => s + (v as number), 0) / masteryEntries.length)
      : 0;
    const weakestArea = masteryEntries.sort(([, a], [, b]) => (a as number) - (b as number))[0];
    const primaryGoal = goals[0] as any;

    // Compute goal lag for context
    let goalLagPct: number | null = null;
    if (primaryGoal) {
      const span = Number(primaryGoal.target_value) - Number(primaryGoal.baseline_value);
      const done = Number(primaryGoal.current_value) - Number(primaryGoal.baseline_value);
      if (span > 0) goalLagPct = Math.round(100 - (done / span) * 100);
    }

    const ctx = {
      user_name: profile.display_name || displayName || "Operator",
      primary_desire: profile.primary_desire || "",
      goal_mode: profile.goal_mode || "income",
      output_mode: profile.output_mode || "blueprints",
      tone: profile.answer_tone || "calm",
      primary_goal: primaryGoal ? {
        title: primaryGoal.title,
        metric: primaryGoal.target_metric,
        progress_pct: goalLagPct !== null ? 100 - goalLagPct : 0,
        deadline: primaryGoal.deadline,
      } : null,
      avg_mastery: avgMastery,
      weakest_area: weakestArea ? { area: weakestArea[0], score: weakestArea[1] } : null,
      streak_days: progress.streak || 0,
      lessons_today: progress.lessons_today || 0,
      completed_count: ((progress.completed_lessons as string[]) || []).length,
    };

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are Shazzy-Owl, the omniscient mentor at THE KNOWLEDGE NEXUS — Wisdom Owl's "God of Wisdom" core.
A user just landed on the Nexus. Your job: greet them with one piercing, persona-driven question that immediately routes them to their highest-leverage opportunity right now.

VOICE: Ruthless mentor. Money-driven operator. Calm precision. Address them by name. Reference their actual goal/state — never generic platitudes.
LENGTH: One welcome line (≤14 words). One question (≤22 words). One recommended action title (≤9 words). One value proposition (one sentence, ≤24 words).
CONFIDENCE: Score 0-100 based on signal density. New user with no goal = 35-50. Active goal + clear gap + recent progress = 80-95.
TAG (one of): "stalled-goal" | "fresh-direction" | "momentum-amplify" | "skill-gap" | "first-strike"

You return STRICT JSON via the provided tool. Reference one flagship module ID from the catalog as the recommended action.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `USER STATE:\n${JSON.stringify(ctx, null, 2)}\n\nFLAGSHIP CATALOG (pick ONE id for action.moduleId):\n${JSON.stringify(flagships, null, 2)}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_welcome",
            description: "Return the adaptive welcome payload.",
            parameters: {
              type: "object",
              properties: {
                welcomeLine: { type: "string" },
                question: { type: "string" },
                tag: { type: "string" },
                confidence: { type: "number" },
                action: {
                  type: "object",
                  properties: {
                    moduleId: { type: "string" },
                    title: { type: "string" },
                    valueProposition: { type: "string", description: "One-sentence value prop. Format: 'Learn: [X] helps you [Y goal].'" },
                  },
                  required: ["moduleId", "title", "valueProposition"],
                },
              },
              required: ["welcomeLine", "question", "tag", "confidence", "action"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_welcome" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limited." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Workspace credits required." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const errText = await aiResponse.text();
      console.error("Gateway error:", status, errText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiJson = await aiResponse.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall ? JSON.parse(toolCall.function.arguments) : null;
    if (!args) throw new Error("Invalid AI response");

    return new Response(JSON.stringify({
      generatedAt: Date.now(),
      welcomeLine: String(args.welcomeLine),
      question: String(args.question),
      tag: String(args.tag || "first-strike"),
      confidence: Math.max(0, Math.min(100, Number(args.confidence) || 60)),
      action: {
        moduleId: String(args.action?.moduleId || ""),
        title: String(args.action?.title || ""),
        valueProposition: String(args.action?.valueProposition || ""),
      },
      hasGoal: !!primaryGoal,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("Welcome error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
