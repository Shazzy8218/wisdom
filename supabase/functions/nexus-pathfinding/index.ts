// THE KNOWLEDGE NEXUS — Neural Pathfinding Engine
// Synthesizes goals, mastery, calibration, progress, and recent feed engagement
// into a personalized, ranked learning trajectory with reasoning.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface NexusModuleSummary {
  id: string;
  pillar: string;
  title: string;
  hook: string;
  duration: string;
  difficulty: string;
  tags: string[];
}

interface NexusContext {
  flagships: NexusModuleSummary[];
  goalMode?: string;
  outputMode?: string;
  primaryDesire?: string;
}

interface PathStep {
  moduleId: string;
  title: string;
  pillar: string;
  reasoning: string;            // why this, why now
  leverageScore: number;        // 0-100
  estimatedMinutes: number;
  highestLeverage?: boolean;    // the "next move"
}

interface PathPlan {
  generatedAt: number;
  primaryGoal: string | null;
  trajectory: PathStep[];
  thesis: string;               // one-paragraph strategic framing
  nextMove: PathStep | null;
}

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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const context: NexusContext = body.context || { flagships: [] };

    // Pull user signals in parallel
    const [profileR, progressR, goalsR] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("user_progress").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("user_goals").select("*").eq("user_id", user.id).eq("completed", false).order("updated_at", { ascending: false }).limit(5),
    ]);

    const profile = profileR.data || {};
    const progress = progressR.data || {};
    const goals = goalsR.data || [];

    const masteryScores = (progress.mastery_scores as Record<string, number>) || {};
    const completedLessons = (progress.completed_lessons as string[]) || [];
    const goalMode = profile.goal_mode || context.goalMode || "income";
    const outputMode = profile.output_mode || context.outputMode || "blueprints";
    const primaryDesire = profile.primary_desire || context.primaryDesire || "";
    const learningStyle = profile.learning_style || "visual";

    const primaryGoal = goals[0] || null;

    // Build the prompt — strategist persona, structured output via tool calling
    const systemPrompt = `You are the Neural Pathfinding Engine of THE KNOWLEDGE NEXUS — Wisdom Owl's AI-curated mastery architect.

Your job: synthesize the user's full strategic context (goals, mastery gaps, calibration, completed work) and return a ranked learning trajectory through a fixed catalog of flagship modules.

CORE PRINCIPLES:
- HIGHEST LEVERAGE FIRST: rank by impact on the user's active primary goal *right now*.
- SKILL DEPENDENCY: never recommend a module that requires prerequisites the user hasn't established.
- HYPER-CURRENCY: prefer modules tagged with 2026 / current-year material.
- NO FLUFF: every reasoning line must be one operator-grade sentence — no marketing language.
- THE NEXT MOVE: exactly one step is marked highestLeverage = true. That is the user's immediate action.

You return STRICT JSON via the provided tool. Do not include text outside the tool call.`;

    const userContext = {
      primary_goal: primaryGoal
        ? { title: primaryGoal.title, why: primaryGoal.why, target_metric: primaryGoal.target_metric, current_value: primaryGoal.current_value, target_value: primaryGoal.target_value, deadline: primaryGoal.deadline }
        : null,
      additional_goals: goals.slice(1, 5).map((g: any) => ({ title: g.title, target_metric: g.target_metric })),
      goal_mode: goalMode,
      output_mode: outputMode,
      primary_desire: primaryDesire,
      learning_style: learningStyle,
      mastery_scores_top: Object.entries(masteryScores)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 8),
      mastery_gaps: Object.entries(masteryScores)
        .filter(([, score]) => (score as number) < 40)
        .slice(0, 8)
        .map(([cat]) => cat),
      completed_lessons_count: completedLessons.length,
      tokens: progress.tokens || 0,
      streak: progress.streak || 0,
    };

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) throw new Error("LOVABLE_API_KEY not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `USER CONTEXT:\n${JSON.stringify(userContext, null, 2)}\n\nFLAGSHIP CATALOG:\n${JSON.stringify(context.flagships, null, 2)}\n\nReturn a 5-step trajectory ranked by leverage on the primary goal. One step must be marked highestLeverage=true.`,
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_pathfinding_plan",
            description: "Return the personalized learning trajectory plan.",
            parameters: {
              type: "object",
              properties: {
                thesis: { type: "string", description: "One-paragraph strategic framing of why this trajectory, tied to the user's primary goal." },
                trajectory: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      moduleId: { type: "string" },
                      title: { type: "string" },
                      pillar: { type: "string" },
                      reasoning: { type: "string", description: "One sentence — why this module, why this position in sequence." },
                      leverageScore: { type: "number", description: "0-100 score for impact on primary goal." },
                      estimatedMinutes: { type: "number" },
                      highestLeverage: { type: "boolean" },
                    },
                    required: ["moduleId", "title", "pillar", "reasoning", "leverageScore", "estimatedMinutes", "highestLeverage"],
                  },
                },
              },
              required: ["thesis", "trajectory"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_pathfinding_plan" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please retry in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Workspace credits required for AI curation." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("Gateway error:", status, errText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiResponse.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall ? JSON.parse(toolCall.function.arguments) : null;

    if (!args || !Array.isArray(args.trajectory)) {
      throw new Error("Invalid AI response structure");
    }

    const trajectory: PathStep[] = args.trajectory.map((s: any) => ({
      moduleId: String(s.moduleId),
      title: String(s.title),
      pillar: String(s.pillar),
      reasoning: String(s.reasoning),
      leverageScore: Math.max(0, Math.min(100, Number(s.leverageScore) || 50)),
      estimatedMinutes: Math.max(5, Number(s.estimatedMinutes) || 30),
      highestLeverage: Boolean(s.highestLeverage),
    }));

    // Guarantee exactly one "next move"
    const nextMoveIdx = trajectory.findIndex(s => s.highestLeverage);
    if (nextMoveIdx === -1 && trajectory.length > 0) {
      trajectory[0].highestLeverage = true;
    }

    const plan: PathPlan = {
      generatedAt: Date.now(),
      primaryGoal: primaryGoal?.title || null,
      trajectory,
      thesis: String(args.thesis || ""),
      nextMove: trajectory.find(s => s.highestLeverage) || trajectory[0] || null,
    };

    return new Response(JSON.stringify(plan), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Pathfinding error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
