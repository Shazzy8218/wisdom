// CAE — Retrieval Strengthener: generate active-recall prompts for a module.
// Returns { prompts: [{ id, prompt, ideal }] } using Lovable AI Gateway.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SectionBrief { heading: string; body: string; operatorMove?: string }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const moduleId: string = body.moduleId;
    const moduleTitle: string = body.moduleTitle;
    const sections: SectionBrief[] = body.sections || [];

    if (!moduleId || !moduleTitle || sections.length === 0) {
      return new Response(JSON.stringify({ error: "Missing moduleId, moduleTitle, or sections" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const sys = `You are Shazzy, a ruthless mentor. Generate active-recall prompts that force the learner to RETRIEVE the principle, not recognize it. Each prompt must:
- Be answerable in 2-4 sentences from memory.
- Test transfer ("when would you deploy X / what fails if you skip Y?"), not vocabulary.
- Reference the section's CORE move, not surface phrasing.
Return STRICT JSON only.`;

    const user = `Module: "${moduleTitle}"
Sections:
${sections.slice(0, 5).map((s, i) => `${i + 1}. ${s.heading}\n${s.body.slice(0, 320)}${s.operatorMove ? `\nOperator move: ${s.operatorMove}` : ""}`).join("\n\n")}

Return JSON: { "prompts": [ { "id": "${moduleId}:r0", "prompt": "...", "ideal": "..." } ] }
Generate exactly ${Math.min(sections.length, 4)} prompts. Use ids ${moduleId}:r0, ${moduleId}:r1, etc. "ideal" = 1-2 sentence reference answer.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: sys }, { role: "user", content: user }],
        response_format: { type: "json_object" },
      }),
    });

    if (resp.status === 429 || resp.status === 402) {
      return new Response(JSON.stringify({ error: resp.status === 429 ? "Rate limited" : "Credits exhausted" }), {
        status: resp.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!resp.ok) {
      const t = await resp.text();
      console.error("nexus-recall-prompt gateway err:", resp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    let parsed: any = {};
    try { parsed = JSON.parse(content); } catch { /* ignore */ }
    const prompts = Array.isArray(parsed.prompts) ? parsed.prompts : [];

    return new Response(JSON.stringify({ prompts }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("nexus-recall-prompt error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
