// CAE — Contextual Transfer Accelerator: "Why this matters to YOUR goal."
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { moduleTitle, moduleHook, goal } = await req.json();
    if (!moduleTitle) {
      return new Response(JSON.stringify({ error: "Missing moduleTitle" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const goalLine = goal
      ? `Their primary goal: "${goal.title}" (target ${goal.targetValue} ${goal.targetMetric}, currently ${goal.currentValue}).`
      : `They have no active primary goal yet.`;

    const sys = `You are Shazzy, a ruthless mentor. Write ONE punchy paragraph (max 60 words) showing why this module is the highest-leverage move for the user's stated goal. No fluff. End with a single decisive line. If no goal, name the universal stake instead.`;
    const user = `Module: "${moduleTitle}"
Hook: "${moduleHook || ''}"
${goalLine}`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: sys }, { role: "user", content: user }],
      }),
    });

    if (resp.status === 429 || resp.status === 402) {
      return new Response(JSON.stringify({ error: resp.status === 429 ? "Rate limited" : "Credits exhausted" }), {
        status: resp.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!resp.ok) {
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const data = await resp.json();
    const text = data.choices?.[0]?.message?.content?.trim() || "";
    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
