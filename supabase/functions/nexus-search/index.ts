// THE KNOWLEDGE NEXUS — Intelligent Semantic Search
// Natural-language search over the flagship catalog + adaptive filter suggestions.
// Returns ranked results with one-line "why it matters to you" each.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CatalogEntry {
  id: string;
  kind: "flagship" | "mastery" | "track";
  pillar?: string;
  title: string;
  hook?: string;
  tags?: string[];
  difficulty?: string;
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
    const query: string = String(body.query || "").trim();
    const catalog: CatalogEntry[] = Array.isArray(body.catalog) ? body.catalog : [];
    if (!query) {
      return new Response(JSON.stringify({ error: "Empty query" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const [profileR, goalsR] = await Promise.all([
      supabase.from("profiles").select("primary_desire,goal_mode").eq("id", user.id).maybeSingle(),
      supabase.from("user_goals").select("title,target_metric").eq("user_id", user.id).eq("completed", false).limit(2),
    ]);
    const goal: any = goalsR.data?.[0];
    const profileData: any = profileR.data || {};
    const userCtx = {
      goal: goal ? goal.title : null,
      goal_mode: profileData.goal_mode || "income",
      desire: profileData.primary_desire || "",
    };

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are the Knowledge Nexus semantic search engine. The user typed a natural-language query.
Match it against the catalog. Return up to 6 ranked results with a one-sentence "why it matters to YOU" tied to the user's goal.
Also suggest 3 adaptive filter chips that would help refine the search (e.g. "Beginner-Friendly", "High Impact", "2026 material", "Skill Gap: Negotiation").
If the query is too vague, return zero results and suggest a sharper rephrasing.

You return STRICT JSON via the provided tool. Use exact catalog ids. Never fabricate.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `QUERY: ${query}\n\nUSER:\n${JSON.stringify(userCtx)}\n\nCATALOG:\n${JSON.stringify(catalog)}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_search_results",
            description: "Return ranked results + adaptive filter suggestions.",
            parameters: {
              type: "object",
              properties: {
                interpretation: { type: "string", description: "One-line restatement of what you understood the user to want." },
                results: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      moduleId: { type: "string" },
                      kind: { type: "string", enum: ["flagship", "mastery", "track"] },
                      title: { type: "string" },
                      whyItMatters: { type: "string", description: "One sentence tied to user's goal." },
                      relevance: { type: "number", description: "0-100 relevance score." },
                    },
                    required: ["moduleId", "kind", "title", "whyItMatters", "relevance"],
                  },
                },
                suggestedFilters: {
                  type: "array",
                  items: { type: "string" },
                  description: "Up to 3 short filter chip labels.",
                },
                rephrase: { type: "string", description: "Suggested sharper query if results are weak. Empty if not needed." },
              },
              required: ["interpretation", "results", "suggestedFilters"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_search_results" } },
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

    const validIds = new Set(catalog.map(c => c.id));
    const results = (args.results || []).filter((r: any) => validIds.has(r.moduleId)).slice(0, 6);

    return new Response(JSON.stringify({
      interpretation: String(args.interpretation || ""),
      results,
      suggestedFilters: (args.suggestedFilters || []).slice(0, 4).map((s: any) => String(s)),
      rephrase: String(args.rephrase || ""),
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("Search error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
