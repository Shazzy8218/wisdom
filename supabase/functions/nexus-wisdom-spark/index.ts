// THE KNOWLEDGE NEXUS — Wisdom Spark micro-challenge
// Two operations:
//   action="generate" → returns { question, contextHint, idealAnswerSummary }
//     for a specific module section, applying the just-learned concept to a scenario.
//   action="grade"    → returns { score, verdict, feedback, nextStep }
//     for a user's voice/text answer.
//
// All operator-grade prose. 60-second cognitive loop.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM = `You are SHAZZY-OWL, Wisdom Owl's ruthless mentor persona, running a "Wisdom Spark" micro-challenge inside THE KNOWLEDGE NEXUS.

QUALITY BAR (non-negotiable):
- HYPER-CURRENT (Q2 2026 baseline). Reference real instruments / regulations / jurisdictions where relevant.
- APPLICATION-FIRST: every question forces the user to MAKE A DECISION, not recall a definition.
- 60-SECOND SCOPE: question must be answerable in 1–3 sentences of operator reasoning.
- NO MARKETING LANGUAGE. NO PRAISE FILLER. Operator-to-operator tone.
- ETHICAL LENS: where the section involves finance/strategy, weave the most relevant doctrine the section already invokes.

When grading:
- Score 0-100. Below 50 = miss. 50-74 = correct direction. 75-89 = sharp. 90+ = operator-level.
- Verdict is one of: "miss" | "directional" | "sharp" | "operator".
- Feedback is 2-3 sentences MAX. Specific. Names the gap or the strength. No flattery.
- Next step is one concrete sentence ("Read Section X next" / "Apply this to Y in your goal" / "Run the [Z] arena drill").`;

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

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "generate");

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) throw new Error("LOVABLE_API_KEY not configured");

    if (action === "generate") {
      const { moduleTitle, sectionHeading, sectionBody, operatorMove, doctrineHint, userGoal } = body;
      if (!moduleTitle || !sectionHeading || !sectionBody) {
        return new Response(JSON.stringify({ error: "moduleTitle, sectionHeading, sectionBody required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

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
              content: `MODULE: ${moduleTitle}
SECTION: ${sectionHeading}
SECTION CONTENT (just consumed):
${sectionBody}
${operatorMove ? `\nOPERATOR MOVE FROM SECTION: ${operatorMove}` : ""}
${doctrineHint ? `\nDOCTRINE TO APPLY: ${doctrineHint}` : ""}
${userGoal ? `\nUSER PRIMARY GOAL: ${userGoal}` : ""}

Generate a 60-second Wisdom Spark micro-challenge that applies what was just consumed to a real-world scenario. Force a DECISION.`,
            },
          ],
          tools: [{
            type: "function",
            function: {
              name: "return_spark",
              description: "Return the Wisdom Spark micro-challenge.",
              parameters: {
                type: "object",
                properties: {
                  question: { type: "string", description: "The micro-challenge prompt. 1-3 sentences. Forces a decision." },
                  contextHint: { type: "string", description: "One brief sentence framing the scenario context — jurisdiction, stage, role." },
                  idealAnswerSummary: { type: "string", description: "2-3 sentences naming the operator-grade answer. Used internally to grade." },
                },
                required: ["question", "contextHint", "idealAnswerSummary"],
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "return_spark" } },
        }),
      });

      if (!aiResp.ok) {
        if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Rate limited." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (aiResp.status === 402) return new Response(JSON.stringify({ error: "Workspace credits required." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const t = await aiResp.text();
        console.error("spark.generate gateway", aiResp.status, t);
        return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const aiJson = await aiResp.json();
      const tc = aiJson.choices?.[0]?.message?.tool_calls?.[0];
      const args = tc ? JSON.parse(tc.function.arguments) : null;
      if (!args?.question) throw new Error("Invalid spark structure");

      return new Response(JSON.stringify(args), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "grade") {
      const { question, contextHint, idealAnswerSummary, userAnswer, moduleTitle, sectionHeading } = body;
      if (!question || !userAnswer) {
        return new Response(JSON.stringify({ error: "question and userAnswer required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

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
              content: `MODULE: ${moduleTitle || "(unspecified)"}
SECTION: ${sectionHeading || "(unspecified)"}
QUESTION: ${question}
CONTEXT: ${contextHint || ""}
IDEAL ANSWER (rubric): ${idealAnswerSummary || ""}

USER'S ANSWER:
"""
${String(userAnswer).slice(0, 2000)}
"""

Grade. Operator-to-operator. No flattery.`,
            },
          ],
          tools: [{
            type: "function",
            function: {
              name: "return_grading",
              description: "Return the structured grading result.",
              parameters: {
                type: "object",
                properties: {
                  score: { type: "number", description: "0-100" },
                  verdict: { type: "string", enum: ["miss", "directional", "sharp", "operator"] },
                  feedback: { type: "string", description: "2-3 sentences. Specific. No filler." },
                  nextStep: { type: "string", description: "One concrete sentence — what to do next." },
                },
                required: ["score", "verdict", "feedback", "nextStep"],
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "return_grading" } },
        }),
      });

      if (!aiResp.ok) {
        if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Rate limited." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (aiResp.status === 402) return new Response(JSON.stringify({ error: "Workspace credits required." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const t = await aiResp.text();
        console.error("spark.grade gateway", aiResp.status, t);
        return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const aiJson = await aiResp.json();
      const tc = aiJson.choices?.[0]?.message?.tool_calls?.[0];
      const args = tc ? JSON.parse(tc.function.arguments) : null;
      if (!args?.verdict) throw new Error("Invalid grading structure");

      const clean = {
        score: Math.max(0, Math.min(100, Number(args.score) || 0)),
        verdict: String(args.verdict),
        feedback: String(args.feedback || ""),
        nextStep: String(args.nextStep || ""),
      };

      return new Response(JSON.stringify(clean), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("nexus-wisdom-spark error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
