import { corsHeaders } from "../_shared/cors.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") || "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { goal, context } = await req.json();

    if (!goal || !goal.title) {
      return new Response(JSON.stringify({ error: "Goal title required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are the Strategic Goal Decomposition Engine for Wisdom Owl — an AI life optimization platform. Your job is to take a user's goal and break it down into a precise, actionable execution plan.

You must respond with ONLY valid JSON (no markdown, no code fences). The JSON must follow this exact schema:

{
  "formalizedGoal": "A crisp, specific, measurable restatement of the goal",
  "pillars": [
    {
      "name": "Pillar name (3-5 words)",
      "description": "One sentence description",
      "milestones": [
        {
          "title": "Milestone title",
          "definitionOfDone": "Specific completion criteria",
          "tasks": [
            { "task": "Specific actionable micro-task", "type": "learn|practice|execute|review" }
          ]
        }
      ]
    }
  ],
  "nextMove": {
    "task": "The single highest-leverage action to take RIGHT NOW",
    "why": "Why this is the critical first step",
    "linkedTo": "Which pillar/milestone this advances"
  },
  "estimatedWeeks": 4,
  "requiredSkills": ["skill1", "skill2"]
}

Rules:
- Create 2-4 pillars maximum
- Each pillar should have 2-4 milestones
- Each milestone should have 2-5 micro-tasks
- Tasks should be ultra-specific and actionable (not vague)
- The nextMove should be something achievable TODAY
- Be brutally practical — no fluff, no motivation speeches
- Consider the user's current progress and context when decomposing`;

    const userContent = `Goal: "${goal.title}"
Metric: ${goal.targetMetric} (from ${goal.baselineValue || 0} to ${goal.targetValue || 100})
${goal.why ? `Why: ${goal.why}` : ""}
${goal.deadline ? `Deadline: ${goal.deadline}` : ""}
${context?.currentMastery ? `Current mastery level: ${context.currentMastery}%` : ""}
${context?.streak ? `Current learning streak: ${context.streak} days` : ""}
${context?.completedLessons ? `Lessons completed: ${context.completedLessons}` : ""}

Decompose this goal into a strategic execution plan.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "x-lovable-project-id": Deno.env.get("LOVABLE_PROJECT_ID") || "",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", errText);
      return new Response(JSON.stringify({ error: "AI decomposition failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";
    
    // Strip markdown code fences if present
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let plan;
    try {
      plan = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ error: "Failed to parse decomposition" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(plan), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Goal decompose error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
