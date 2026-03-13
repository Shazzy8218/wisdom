import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Generate CSV content
function generateCSV(data: { headers: string[]; rows: string[][] }): string {
  const escape = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const lines = [data.headers.map(escape).join(",")];
  for (const row of data.rows) {
    lines.push(row.map(escape).join(","));
  }
  return lines.join("\n");
}

// Generate HTML doc (for PDF printing / DOCX-style)
function generateHTMLDoc(title: string, content: string, format: string): string {
  const styles = format === "slides" ? `
    body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 0; background: #111; color: #fff; }
    .slide { page-break-after: always; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; padding: 60px 80px; }
    .slide h1 { font-size: 48px; margin-bottom: 20px; color: #f5c542; }
    .slide h2 { font-size: 36px; margin-bottom: 16px; color: #f5c542; }
    .slide p, .slide li { font-size: 24px; line-height: 1.6; }
    .slide ul { padding-left: 30px; }
    @media print { .slide { page-break-after: always; } }
  ` : `
    body { font-family: 'Segoe UI', sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; color: #222; line-height: 1.7; }
    h1 { font-size: 28px; border-bottom: 2px solid #333; padding-bottom: 8px; margin-bottom: 20px; }
    h2 { font-size: 22px; margin-top: 30px; color: #444; }
    h3 { font-size: 18px; color: #555; }
    table { border-collapse: collapse; width: 100%; margin: 16px 0; }
    th, td { border: 1px solid #ddd; padding: 10px 14px; text-align: left; }
    th { background: #f5f5f5; font-weight: 600; }
    ul, ol { padding-left: 24px; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-size: 14px; }
    pre { background: #f4f4f4; padding: 16px; border-radius: 6px; overflow-x: auto; }
    blockquote { border-left: 3px solid #ddd; margin: 16px 0; padding: 8px 16px; color: #666; }
    @media print { body { margin: 20px; } }
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>${styles}</style>
</head>
<body>
${content}
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, format = "pdf", context } = await req.json();
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not configured");

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const formatInstructions: Record<string, string> = {
      csv: `Generate a CSV dataset. Return ONLY valid JSON with this exact structure: {"headers":["col1","col2"],"rows":[["val1","val2"]]}. No markdown, no explanations, just the JSON.`,
      pdf: `Generate a professional document in HTML format. Use semantic HTML (h1, h2, p, ul, ol, table, blockquote, code). Make it well-structured, thorough, and visually clean. Return ONLY the HTML body content (no <html>, <head>, or <body> tags).`,
      docx: `Generate a professional document in HTML format. Use semantic HTML (h1, h2, p, ul, ol, table, blockquote). Make it well-structured and thorough. Return ONLY the HTML body content.`,
      slides: `Generate a slide deck in HTML format. Each slide should be wrapped in <div class="slide">. Use h1 for slide titles, h2 for subtitles, and bullet points for content. Aim for 5-10 slides. Keep each slide concise (max 5 bullet points). Return ONLY the slide divs.`,
    };

    const systemPrompt = `You are Wisdom Owl document generator. ${formatInstructions[format] || formatInstructions.pdf}
${context ? `User context: ${JSON.stringify(context)}` : ""}`;

    console.log(`Generating ${format} document:`, prompt.slice(0, 100));

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://wisdom-owl.app",
        "X-Title": "Wisdom Owl",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("Doc gen error:", response.status, t);
      return new Response(JSON.stringify({ error: "Document generation failed." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || "";

    if (format === "csv") {
      // Parse JSON and generate CSV
      try {
        // Strip markdown code fences if present
        const cleaned = rawContent.replace(/```(?:json)?\s*/g, "").replace(/```\s*/g, "").trim();
        const parsed = JSON.parse(cleaned);
        const csvContent = generateCSV(parsed);
        return new Response(JSON.stringify({
          success: true,
          format: "csv",
          fileName: "owl-export.csv",
          content: csvContent,
          mimeType: "text/csv",
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch (e) {
        console.error("CSV parse error:", e, rawContent.slice(0, 200));
        return new Response(JSON.stringify({
          success: true,
          format: "csv",
          fileName: "owl-export.csv",
          content: rawContent,
          mimeType: "text/csv",
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // For PDF, DOCX, Slides — generate HTML
    const title = prompt.split("\n")[0].slice(0, 100);
    // Strip markdown code fences if model wraps output
    const cleanedContent = rawContent.replace(/```(?:html)?\s*/g, "").replace(/```\s*/g, "").trim();
    const htmlDoc = generateHTMLDoc(title, cleanedContent, format);

    return new Response(JSON.stringify({
      success: true,
      format,
      fileName: `owl-${format === "slides" ? "deck" : "document"}.html`,
      content: htmlDoc,
      mimeType: "text/html",
      rawContent: cleanedContent,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("owl-generate-doc error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

