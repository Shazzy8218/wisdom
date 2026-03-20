import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type AnalysisType = "market-heat" | "competitor-autopsy" | "website-audit" | "opportunity-scan";

interface AnalysisRequest {
  type: AnalysisType;
  query: string;
  url?: string;
  context?: Record<string, string>;
}

// Perplexity search
async function perplexitySearch(query: string, apiKey: string): Promise<{ content: string; citations: string[] } | null> {
  try {
    const resp = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          { role: "system", content: "Be concise and factual. Include specific numbers, dates, data. Cite sources. Focus on market signals, trends, competition data." },
          { role: "user", content: query },
        ],
      }),
    });
    if (!resp.ok) {
      console.error("Perplexity error:", resp.status);
      return null;
    }
    const data = await resp.json();
    return {
      content: data.choices?.[0]?.message?.content || "",
      citations: data.citations || [],
    };
  } catch (e) {
    console.error("Perplexity error:", e);
    return null;
  }
}

// Firecrawl scrape
async function firecrawlScrape(url: string, apiKey: string): Promise<{ markdown: string; title?: string; description?: string } | null> {
  try {
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http")) formattedUrl = `https://${formattedUrl}`;

    const resp = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ["markdown"],
        onlyMainContent: true,
      }),
    });
    if (!resp.ok) {
      console.error("Firecrawl error:", resp.status);
      return null;
    }
    const data = await resp.json();
    return {
      markdown: data.data?.markdown || data.markdown || "",
      title: data.data?.metadata?.title || data.metadata?.title,
      description: data.data?.metadata?.description || data.metadata?.description,
    };
  } catch (e) {
    console.error("Firecrawl error:", e);
    return null;
  }
}

// Firecrawl search (find competitor sites)
async function firecrawlSearch(query: string, apiKey: string): Promise<{ url: string; title: string; description: string }[]> {
  try {
    const resp = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query, limit: 5 }),
    });
    if (!resp.ok) return [];
    const data = await resp.json();
    return (data.data || []).map((r: any) => ({
      url: r.url || "",
      title: r.title || "",
      description: r.description || r.markdown?.slice(0, 200) || "",
    }));
  } catch { return []; }
}

// AI synthesis — turns raw research into strategic output
async function synthesize(prompt: string, lovableKey: string): Promise<string> {
  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!resp.ok) return "Synthesis failed.";
    const data = await resp.json();
    return data.choices?.[0]?.message?.content || "No synthesis available.";
  } catch { return "Synthesis failed."; }
}

// Build analysis prompts per type
function buildSynthesisPrompt(type: AnalysisType, query: string, perplexityData: string | null, firecrawlData: string | null, context?: Record<string, string>): string {
  const userName = context?.user_name ? ` The user's name is ${context.user_name}.` : "";
  const goal = context?.learning_goal ? ` Their current goal: "${context.learning_goal}".` : "";

  const base = `You are Wisdom Owl — a sharp, direct strategic analyst. No filler, no disclaimers. Be blunt and actionable.${userName}${goal}

The user asked: "${query}"

`;

  switch (type) {
    case "market-heat":
      return base + `TASK: Market Heat Check. Analyze the market/niche the user is asking about.

${perplexityData ? `LIVE MARKET RESEARCH (from Perplexity):\n${perplexityData}\n` : ""}
${firecrawlData ? `COMPETITOR SITE DATA (from Firecrawl):\n${firecrawlData}\n` : ""}

Respond with EXACTLY this structure (use natural flowing prose, not robotic):
1. **Verdict** — one sharp sentence: is this idea viable, crowded, or dead?
2. **Market Heat:** Cold / Warm / Hot / Crowded / Saturated — with a one-line explanation
3. **Why** — 2-3 sentences on the current state of this market
4. **Best Path to Win** — the angle that still works, specific and actionable
5. **Better Niche (if needed)** — suggest a sharper positioning if the main one is crowded
6. **🎯 Next Move:** — one concrete action

Keep it under 300 words. No padding.`;

    case "competitor-autopsy":
      return base + `TASK: Competitor Autopsy. Break down what competitors are doing in this space.

${perplexityData ? `MARKET CONTEXT (from Perplexity):\n${perplexityData}\n` : ""}
${firecrawlData ? `COMPETITOR SITE CONTENT (from Firecrawl):\n${firecrawlData}\n` : ""}

Respond with:
1. **What they're doing well** — specific strengths observed
2. **What they're doing badly** — specific weaknesses and gaps
3. **Where the gap is** — the opening the user can exploit
4. **How to position differently** — concrete differentiation strategy
5. **🎯 Next Move:** — one action to capitalize on the gap

Keep it under 350 words. Be surgical.`;

    case "website-audit":
      return base + `TASK: Website Revenue Audit. Analyze this website for conversion and revenue opportunities.

${firecrawlData ? `WEBSITE CONTENT (from Firecrawl):\n${firecrawlData}\n` : ""}
${perplexityData ? `MARKET CONTEXT (from Perplexity):\n${perplexityData}\n` : ""}

Respond with:
1. **Verdict** — one line on the site's current effectiveness
2. **Top 3 Revenue Leaks** — what's losing them money/conversions, with specifics
3. **What to Rewrite** — specific copy/sections that need work
4. **What to Add** — missing elements (proof, CTAs, urgency, clarity)
5. **Stronger Positioning** — how to reframe the offer
6. **🎯 Next Move:** — the single highest-impact fix

Keep it under 400 words. Reference actual content from the site when possible.`;

    case "opportunity-scan":
      return base + `TASK: Live Opportunity Scanner. Find current market opportunities.

${perplexityData ? `CURRENT TREND DATA (from Perplexity):\n${perplexityData}\n` : ""}
${firecrawlData ? `REAL SITES/BUSINESSES IN SPACE (from Firecrawl):\n${firecrawlData}\n` : ""}

Respond with:
1. **Opportunity Summary** — what's emerging and why
2. **Why It Matters Now** — timing and market signals
3. **Risk Level:** Low / Medium / High — with one-line explanation
4. **Who's Already Doing It** — existing players and how established they are
5. **The Open Gap** — where there's still room
6. **Recommended Angle of Attack** — specific positioning for the user
7. **🎯 Next Move:** — first action to take

Keep it under 350 words. Be specific, not generic.`;

    default:
      return base + `Analyze and respond strategically.\n\n${perplexityData || ""}\n${firecrawlData || ""}`;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type, query, url, context } = await req.json() as AnalysisRequest;
    if (!query) {
      return new Response(JSON.stringify({ error: "Query is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");

    const toolsUsed: string[] = [];
    let perplexityData: string | null = null;
    let firecrawlData: string | null = null;
    const allCitations: string[] = [];
    const sitesReviewed: string[] = [];

    // Determine which tools to use based on type
    const needsPerplexity = ["market-heat", "competitor-autopsy", "opportunity-scan", "website-audit"].includes(type);
    const needsFirecrawl = ["competitor-autopsy", "website-audit"].includes(type) || !!url;

    // Run Perplexity + Firecrawl in parallel
    const tasks: Promise<void>[] = [];

    if (needsPerplexity && PERPLEXITY_API_KEY) {
      let pQuery = query;
      if (type === "market-heat") pQuery = `Current market analysis: ${query}. How competitive is this space? Market size, growth, saturation level, key players, recent trends.`;
      else if (type === "competitor-autopsy") pQuery = `Top competitors in: ${query}. Who are the main players? What are they offering? Market positioning. Recent developments.`;
      else if (type === "opportunity-scan") pQuery = `Emerging opportunities in: ${query}. What niches are growing? Untapped markets? New demand signals? Current trends.`;
      else if (type === "website-audit") pQuery = `Current market expectations for: ${query}. What do top sites in this space look like? Best practices for conversions.`;

      tasks.push(
        perplexitySearch(pQuery, PERPLEXITY_API_KEY).then(result => {
          if (result) {
            perplexityData = result.content;
            allCitations.push(...result.citations);
            toolsUsed.push("perplexity");
          }
        })
      );
    }

    if (needsFirecrawl && FIRECRAWL_API_KEY) {
      if (url) {
        // Scrape the specific URL
        tasks.push(
          firecrawlScrape(url, FIRECRAWL_API_KEY).then(result => {
            if (result) {
              firecrawlData = `Title: ${result.title || "N/A"}\nDescription: ${result.description || "N/A"}\n\nContent:\n${result.markdown.slice(0, 3000)}`;
              sitesReviewed.push(url);
              toolsUsed.push("firecrawl");
            }
          })
        );
      } else if (type === "competitor-autopsy" || type === "opportunity-scan") {
        // Search for competitor sites
        tasks.push(
          firecrawlSearch(query, FIRECRAWL_API_KEY).then(results => {
            if (results.length > 0) {
              firecrawlData = results.map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.description}`).join("\n\n");
              sitesReviewed.push(...results.map(r => r.url).filter(Boolean));
              toolsUsed.push("firecrawl");
            }
          })
        );
      }
    }

    await Promise.all(tasks);

    // If no tools available, use AI knowledge as fallback
    if (!perplexityData && !firecrawlData) {
      toolsUsed.push("ai-knowledge");
    }

    // Synthesize with Owl persona
    const synthesisPrompt = buildSynthesisPrompt(type, query, perplexityData, firecrawlData, context);
    const analysis = await synthesize(synthesisPrompt, OPENROUTER_API_KEY);

    // Determine confidence
    let confidence: "high" | "medium" | "low" = "low";
    if (perplexityData && firecrawlData) confidence = "high";
    else if (perplexityData || firecrawlData) confidence = "medium";

    return new Response(JSON.stringify({
      success: true,
      analysis,
      toolsUsed,
      citations: allCitations,
      sitesReviewed,
      confidence,
      type,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("owl-strategic-analysis error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

