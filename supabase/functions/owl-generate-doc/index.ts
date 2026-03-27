import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function generateCSV(data: { headers: string[]; rows: string[][] }): string {
  const escape = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const lines = [data.headers.map(escape).join(",")];
  for (const row of data.rows) {
    lines.push(row.map(escape).join(","));
  }
  return lines.join("\n");
}

function generateHTMLDoc(title: string, content: string, format: string): string {
  if (format === "slides") {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', -apple-system, sans-serif; background: #0a0a0a; color: #f0f0f0; }
  .slide {
    page-break-after: always;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 80px 100px;
    position: relative;
    background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
  }
  .slide:nth-child(1) {
    background: linear-gradient(135deg, #0f0f23 0%, #1a1a3a 100%);
    justify-content: center;
    align-items: center;
    text-align: center;
  }
  .slide:nth-child(1) h1 { font-size: 56px; font-weight: 800; background: linear-gradient(135deg, #f5c542, #ff9a3c); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 16px; }
  .slide:nth-child(1) p { font-size: 24px; color: #94a3b8; font-weight: 300; }
  .slide h1 { font-size: 44px; font-weight: 700; color: #f5c542; margin-bottom: 32px; letter-spacing: -0.5px; }
  .slide h2 { font-size: 32px; font-weight: 600; color: #e2e8f0; margin-bottom: 20px; }
  .slide h3 { font-size: 24px; font-weight: 500; color: #cbd5e1; margin-bottom: 14px; }
  .slide p { font-size: 22px; line-height: 1.7; color: #cbd5e1; margin-bottom: 16px; }
  .slide ul, .slide ol { padding-left: 36px; margin: 16px 0; }
  .slide li { font-size: 22px; line-height: 1.8; color: #cbd5e1; margin-bottom: 8px; }
  .slide li::marker { color: #f5c542; }
  .slide strong { color: #f0f0f0; }
  .slide code { background: rgba(245,197,66,0.15); color: #f5c542; padding: 3px 8px; border-radius: 4px; font-size: 20px; }
  .slide pre { background: rgba(0,0,0,0.4); border: 1px solid rgba(245,197,66,0.2); border-radius: 12px; padding: 24px; margin: 20px 0; overflow-x: auto; }
  .slide blockquote { border-left: 4px solid #f5c542; padding: 16px 24px; margin: 20px 0; background: rgba(245,197,66,0.05); border-radius: 0 8px 8px 0; }
  .slide table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  .slide th { background: rgba(245,197,66,0.15); color: #f5c542; padding: 14px 20px; text-align: left; font-weight: 600; font-size: 18px; border-bottom: 2px solid rgba(245,197,66,0.3); }
  .slide td { padding: 12px 20px; border-bottom: 1px solid rgba(255,255,255,0.08); font-size: 18px; color: #cbd5e1; }
  .slide::after { content: ''; position: absolute; bottom: 30px; left: 100px; right: 100px; height: 2px; background: linear-gradient(90deg, transparent, rgba(245,197,66,0.3), transparent); }
  @media print { .slide { page-break-after: always; } }
</style>
</head>
<body>
${content}
</body>
</html>`;
  }

  // PDF / DOCX professional template
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Merriweather:wght@400;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Inter', -apple-system, sans-serif;
    max-width: 800px;
    margin: 0 auto;
    padding: 60px 48px;
    color: #1a1a2e;
    line-height: 1.75;
    font-size: 15px;
    background: #fff;
  }
  /* Cover / Title */
  h1 {
    font-family: 'Merriweather', Georgia, serif;
    font-size: 32px;
    font-weight: 700;
    color: #0f0f23;
    margin-bottom: 8px;
    padding-bottom: 16px;
    border-bottom: 3px solid #f5c542;
    line-height: 1.3;
  }
  h1 + p, h1 + * > p:first-child {
    color: #64748b;
    font-size: 14px;
    margin-bottom: 32px;
  }
  h2 {
    font-size: 22px;
    font-weight: 700;
    color: #1a1a2e;
    margin-top: 40px;
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid #e2e8f0;
  }
  h3 {
    font-size: 18px;
    font-weight: 600;
    color: #334155;
    margin-top: 28px;
    margin-bottom: 12px;
  }
  h4 { font-size: 16px; font-weight: 600; color: #475569; margin-top: 20px; margin-bottom: 8px; }
  p { margin-bottom: 14px; color: #334155; }
  strong { color: #0f0f23; }
  em { color: #475569; }
  /* Tables */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 24px 0;
    font-size: 14px;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  }
  thead { background: #1a1a2e; }
  th {
    color: #fff;
    padding: 12px 16px;
    text-align: left;
    font-weight: 600;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  td {
    padding: 11px 16px;
    border-bottom: 1px solid #f1f5f9;
    color: #334155;
  }
  tbody tr:nth-child(even) { background: #f8fafc; }
  tbody tr:hover { background: #f1f5f9; }
  /* Lists */
  ul, ol { padding-left: 28px; margin: 16px 0; }
  li { margin-bottom: 8px; color: #334155; }
  li::marker { color: #f5c542; font-weight: 700; }
  /* Code */
  code { background: #f1f5f9; color: #e11d48; padding: 2px 7px; border-radius: 4px; font-size: 13px; font-family: 'SF Mono', 'Fira Code', monospace; }
  pre {
    background: #1e293b;
    color: #e2e8f0;
    padding: 20px 24px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 20px 0;
    font-size: 13px;
    line-height: 1.6;
    border: 1px solid #334155;
  }
  pre code { background: none; color: inherit; padding: 0; font-size: inherit; }
  /* Blockquotes */
  blockquote {
    border-left: 4px solid #f5c542;
    margin: 20px 0;
    padding: 16px 24px;
    background: #fffbeb;
    border-radius: 0 8px 8px 0;
    color: #92400e;
    font-style: italic;
  }
  /* Key callout boxes */
  .callout {
    background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
    border: 1px solid #bae6fd;
    border-radius: 8px;
    padding: 16px 20px;
    margin: 20px 0;
  }
  /* Footer */
  .doc-footer {
    margin-top: 48px;
    padding-top: 16px;
    border-top: 1px solid #e2e8f0;
    color: #94a3b8;
    font-size: 12px;
    text-align: center;
  }
  @media print {
    body { padding: 40px 32px; }
    h2 { page-break-after: avoid; }
    table { page-break-inside: avoid; }
    pre { page-break-inside: avoid; }
  }
</style>
</head>
<body>
${content}
<div class="doc-footer">Generated by Wisdom Owl • ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, format = "pdf", context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const formatInstructions: Record<string, string> = {
      csv: `Generate structured tabular data. Return ONLY valid JSON with this exact structure: {"headers":["col1","col2"],"rows":[["val1","val2"]]}. Include realistic, comprehensive data with at least 10-20 rows. Use clear column headers. No markdown, no explanations, just the JSON.`,
      pdf: `Generate a professional, publication-quality document in HTML format. Follow these rules:
- Start with an <h1> title, followed by a brief subtitle paragraph
- Use <h2> for major sections, <h3> for subsections
- Use <table> with <thead> and <tbody> for any data — format numbers properly
- Use <blockquote> for key insights or callouts
- Use <strong> for emphasis, <code> for technical terms
- Use ordered/unordered lists for structured information
- Include a brief executive summary or introduction after the title
- Make it thorough, well-researched, and at least 800+ words
- Return ONLY the HTML body content (no html/head/body tags)`,
      docx: `Generate a professional Word-style document in HTML format. Follow these rules:
- Start with an <h1> title
- Use <h2> for major sections, <h3> for subsections  
- Use proper <table> structures with headers for any tabular data
- Use lists, bold, and proper formatting throughout
- Make it thorough and well-structured (800+ words minimum)
- Return ONLY the HTML body content (no html/head/body tags)`,
      slides: `Generate a professional slide deck in HTML format. Rules:
- Each slide MUST be wrapped in <div class="slide">
- First slide: title slide with <h1> (presentation title) and <p> (subtitle/date)
- Use <h1> for slide titles, <h2> for subtitles within slides
- Keep each slide focused: max 5 bullet points or one key concept
- Create 8-12 slides minimum
- Include data slides with <table> where relevant
- Use <blockquote> for key quotes or insights
- Use <strong> for emphasis
- End with a summary/conclusion slide
- Return ONLY the slide divs, no wrapping tags`,
    };

    const systemPrompt = `You are Wisdom Owl, a premium document generator. Create exceptionally well-formatted, professional content. ${formatInstructions[format] || formatInstructions.pdf}
${context ? `\nUser context: ${JSON.stringify(context)}` : ""}`;

    console.log(`Generating ${format} document:`, prompt.slice(0, 100));

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
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
      try {
        const cleaned = rawContent.replace(/```(?:json)?\s*/g, "").replace(/```\s*/g, "").trim();
        const parsed = JSON.parse(cleaned);
        const csvContent = generateCSV(parsed);
        return new Response(JSON.stringify({
          success: true,
          format: "csv",
          fileName: "owl-spreadsheet.xlsx",
          content: csvContent,
          mimeType: "text/csv",
          structuredData: parsed,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch (e) {
        console.error("CSV parse error:", e, rawContent.slice(0, 200));
        return new Response(JSON.stringify({
          success: true,
          format: "csv",
          fileName: "owl-spreadsheet.csv",
          content: rawContent,
          mimeType: "text/csv",
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    const title = prompt.split("\n")[0].slice(0, 100);
    const cleanedContent = rawContent.replace(/```(?:html)?\s*/g, "").replace(/```\s*/g, "").trim();
    const htmlDoc = generateHTMLDoc(title, cleanedContent, format);

    return new Response(JSON.stringify({
      success: true,
      format,
      fileName: format === "slides" ? "owl-presentation.html" : format === "docx" ? "owl-document.docx" : "owl-document.pdf",
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
