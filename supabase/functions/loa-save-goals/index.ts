import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.25.76";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const roadmapStepSchema = z.object({
  step: z.string().trim().min(1).max(500),
  done: z.boolean().default(false),
});

const goalSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(200),
  targetMetric: z.string().trim().min(1).max(50).default("custom"),
  targetValue: z.number().finite(),
  currentValue: z.number().finite().default(0),
  baselineValue: z.number().finite().default(0),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  why: z.string().max(2000).default(""),
  roadmap: z.array(roadmapStepSchema).max(250).default([]),
});

const requestSchema = z.object({
  goals: z.array(goalSchema).min(1).max(10),
});

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const accessToken = authHeader.replace(/^Bearer\s+/i, "").trim();

    if (!accessToken) {
      return jsonResponse({ error: "Missing authorization token" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[loa-save-goals] Missing backend environment variables");
      return jsonResponse({ error: "Backend is not configured" }, 500);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const {
      data: { user },
      error: userError,
    } = await adminClient.auth.getUser(accessToken);

    if (userError || !user) {
      console.error("[loa-save-goals] Auth validation failed", userError);
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const rawBody = await req.json().catch(() => null);
    const parsedBody = requestSchema.safeParse(rawBody);

    if (!parsedBody.success) {
      return jsonResponse({ error: parsedBody.error.flatten().fieldErrors }, 400);
    }

    const rows = parsedBody.data.goals.map((goal) => ({
      id: goal.id,
      user_id: user.id,
      title: goal.title,
      target_metric: goal.targetMetric,
      target_value: goal.targetValue,
      current_value: goal.currentValue,
      baseline_value: goal.baselineValue,
      deadline: goal.deadline ?? null,
      why: goal.why,
      roadmap: goal.roadmap,
      completed: false,
      updated_at: new Date().toISOString(),
    }));

    const { data, error } = await adminClient
      .from("user_goals")
      .upsert(rows, { onConflict: "id" })
      .select("id, title");

    if (error) {
      console.error("[loa-save-goals] Goal persistence failed", error);
      return jsonResponse({ error: "Failed to save goals" }, 500);
    }

    return jsonResponse({ createdCount: data?.length ?? 0, goals: data ?? [] }, 200);
  } catch (error) {
    console.error("[loa-save-goals] Unexpected failure", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});

function jsonResponse(payload: unknown, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: jsonHeaders,
  });
}