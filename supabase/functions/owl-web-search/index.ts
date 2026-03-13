import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query, type = "search", url } = await req.json();
    
    // === FIRECRAWL SCRAPE MODE ===
    if (url && type === "scrape") {
      const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
      if (!FIRECRAWL_API_KEY) {
        return new Response(JSON.stringify({
          success: false,
          error: "Firecrawl is not connected. Add it in Settings → Connectors.",
        }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      let formattedUrl = url.trim();
      if (!formattedUrl.startsWith("http")) formattedUrl = `https://${formattedUrl}`;

      console.log("Firecrawl scraping:", formattedUrl);
      const resp = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ url: formattedUrl, formats: ["markdown"], onlyMainContent: true }),
      });

      if (resp.ok) {
        const data = await resp.json();
        const markdown = data.data?.markdown || data.markdown || "";
        const title = data.data?.metadata?.title || data.metadata?.title || "";
        const description = data.data?.metadata?.description || data.metadata?.description || "";

        // Synthesize with AI
        const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
        let summary = markdown.slice(0, 2000);
        if (OPENROUTER_API_KEY && query) {
          const aiResp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                { role: "system", content: "You are Wisdom Owl. Analyze the website content and respond to the user's question. Be direct, sharp, and strategic. No filler." },
                { role: "user", content: `User asked: "${query}"\n\nWebsite: ${formattedUrl}\nTitle: ${title}\nDescription: ${description}\n\nContent:\n${markdown.slice(0, 4000)}` },
              ],
            }),
          });
          if (aiResp.ok) {
            const aiData = await aiResp.json();
            summary = aiData.choices?.[0]?.message?.content || summary;
          }
        }

        return new Response(JSON.stringify({
          success: true,
          source: "firecrawl",
          content: summary,
          citations: [formattedUrl],
          siteTitle: title,
          siteDescription: description,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const t = await resp.text();
      console.error("Firecrawl error:", resp.status, t);
    }

    if (!query) {
      return new Response(JSON.stringify({ error: "Query is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try Perplexity first (best for Q&A with citations)
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    if (PERPLEXITY_API_KEY) {
      console.log("Using Perplexity for:", query);
      const resp = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "sonar",
          messages: [
            { role: "system", content: "Be concise and factual. Include specific numbers, dates, and data points. Cite sources." },
            { role: "user", content: query },
          ],
          search_recency_filter: type === "news" ? "day" : undefined,
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        const content = data.choices?.[0]?.message?.content || "";
        const citations = data.citations || [];
        return new Response(JSON.stringify({
          success: true,
          source: "perplexity",
          content,
          citations,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      
      if (resp.status === 402) {
        console.error("Perplexity: insufficient credits");
      } else {
        const t = await resp.text();
        console.error("Perplexity error:", resp.status, t);
      }
    }

    // Fall back to Firecrawl search
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (FIRECRAWL_API_KEY) {
      console.log("Using Firecrawl for:", query);
      const resp = await fetch("https://api.firecrawl.dev/v1/search", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, limit: 5 }),
      });

      if (resp.ok) {
        const data = await resp.json();
        const results = data.data || [];
        const summary = results.map((r: any, i: number) =>
          `**[${i + 1}] ${r.title || "Result"}**\n${r.description || r.markdown?.slice(0, 300) || ""}\nSource: ${r.url}`
        ).join("\n\n");

        return new Response(JSON.stringify({
          success: true,
          source: "firecrawl",
          content: summary || "No results found.",
          citations: results.map((r: any) => r.url).filter(Boolean),
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const t = await resp.text();
      console.error("Firecrawl error:", resp.status, t);
    }

    // Fall back to Lovable AI for best-effort answer
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (OPENROUTER_API_KEY) {
      console.log("Using Lovable AI fallback for:", query);
      const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://wisdom-owl.app",
          "X-Title": "Wisdom Owl",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "Answer concisely with the best information you have. If you're unsure about real-time data (prices, scores, weather), say so briefly and provide the most recent info you know. Never give long disclaimers." },
            { role: "user", content: query },
          ],
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        return new Response(JSON.stringify({
          success: true,
          source: "ai-knowledge",
          content: data.choices?.[0]?.message?.content || "No answer available.",
          citations: [],
          note: "Based on AI knowledge (no live web search connected). Connect Perplexity or Firecrawl for real-time results.",
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    return new Response(JSON.stringify({
      success: false,
      error: "No web search tools connected. Connect Perplexity or Firecrawl in Settings → Connectors.",
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("owl-web-search error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

