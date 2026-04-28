// CAE — DRO Phenomenon Decoder: live, current event tied to the lesson concept.
// Uses Perplexity sonar-pro for grounded real-time signal. Falls back to Lovable AI summary.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { moduleTitle, concept } = await req.json();
    if (!moduleTitle) {
      return new Response(JSON.stringify({ error: "Missing moduleTitle" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const PPLX = Deno.env.get("PERPLEXITY_API_KEY");
    if (!PPLX) {
      return new Response(JSON.stringify({ error: "Perplexity not configured" }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const query = `Find ONE current real-world event, headline, or trend (last 30 days) that directly demonstrates the concept of "${concept || moduleTitle}". Respond as JSON: { "headline": "...", "takeaway": "1-sentence operator takeaway", "sourceUrl": "..." }. No markdown, no preamble, just the JSON object.`;

    const resp = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${PPLX}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          { role: "system", content: "You return only a single valid JSON object. No prose." },
          { role: "user", content: query },
        ],
        search_recency_filter: "month",
        temperature: 0.2,
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      console.error("perplexity err:", resp.status, t);
      return new Response(JSON.stringify({ error: "Perplexity error" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const raw = data.choices?.[0]?.message?.content || "";
    const citations: string[] = data.citations || [];

    // Try to extract a JSON object from the response
    let parsed: any = null;
    try { parsed = JSON.parse(raw); } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) { try { parsed = JSON.parse(m[0]); } catch { /* ignore */ } }
    }

    const headline = parsed?.headline || raw.split("\n")[0]?.slice(0, 140) || "Live signal";
    const takeaway = parsed?.takeaway || "";
    const sourceUrl = parsed?.sourceUrl || citations[0] || "";

    return new Response(JSON.stringify({ headline, takeaway, sourceUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
