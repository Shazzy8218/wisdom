import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, style } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "A prompt is required." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Enhance prompt with style if provided
    let fullPrompt = prompt;
    if (style) {
      const styleMap: Record<string, string> = {
        minimal: "minimalist, clean, simple shapes, white space, modern design",
        luxury: "luxury, premium, dark background, gold accents, elegant, sophisticated",
        diagram: "technical diagram, clean lines, labeled components, educational illustration",
        realistic: "photorealistic, detailed, high resolution, natural lighting",
        futuristic: "futuristic, sci-fi, neon, cyberpunk, holographic, glowing elements",
        flat: "flat vector illustration, simple colors, 2D, graphic design style, clean edges",
      };
      const styleDesc = styleMap[style] || style;
      fullPrompt = `${prompt}. Style: ${styleDesc}`;
    }

    console.log("Generating image with prompt:", fullPrompt);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: fullPrompt,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("Image generation error:", response.status, t);
      return new Response(JSON.stringify({ error: "Image generation failed. Try again." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    console.log("Image generation response keys:", Object.keys(data));

    const choice = data.choices?.[0]?.message;
    const textContent = choice?.content || "";
    const images = choice?.images || [];

    if (images.length === 0) {
      return new Response(JSON.stringify({ 
        error: "No image was generated. Try rephrasing your prompt.",
        text: textContent,
      }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Return the base64 image and any text
    const imageData = images[0]?.image_url?.url || "";

    return new Response(JSON.stringify({
      imageData,
      text: textContent,
      prompt: fullPrompt,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("generate-chat-image error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
