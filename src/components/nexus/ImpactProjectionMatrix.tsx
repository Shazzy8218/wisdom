// IMPACT PROJECTION MATRIX (IPM) — visible "knowledge → causality" surface.
// Hybrid: AI-computed projection (shown on syllabus / module view) for the
// user's primary active goal; deterministic for everything else.

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Zap, AlertTriangle, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useGoals } from "@/hooks/useGoals";
import type { FlagshipModule } from "@/lib/nexus-flagship";
import { computeImpactProjection, formatOppCost, type ImpactProjection } from "@/lib/impact-projection";

interface Props {
  module: Pick<FlagshipModule, "id" | "pillar" | "title" | "difficulty" | "tags" | "outcomes">;
  /** Defaults to true. Set false to skip AI for ambient/list views. */
  enableAi?: boolean;
}

interface AiPayload extends ImpactProjection { goalTitle?: string; }

const CACHE_PREFIX = "nexus-ipm-v1:";
const CACHE_TTL = 24 * 60 * 60 * 1000;

export default function ImpactProjectionMatrix({ module, enableAi = true }: Props) {
  const { primaryGoal } = useGoals();
  const [aiResult, setAiResult] = useState<AiPayload | null>(null);
  const [loading, setLoading] = useState(false);

  const deterministic = useMemo(
    () => computeImpactProjection({ module, goal: primaryGoal }),
    [module, primaryGoal]
  );

  useEffect(() => {
    if (!enableAi || !primaryGoal) { setAiResult(null); return; }
    const cacheKey = `${CACHE_PREFIX}${module.id}:${primaryGoal.id}`;
    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        const c = JSON.parse(raw);
        if (Date.now() - c.ts < CACHE_TTL) { setAiResult(c.payload); return; }
      }
    } catch { /* ignore */ }

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("nexus-impact", {
          body: {
            module: {
              id: module.id, title: module.title, pillar: module.pillar,
              difficulty: module.difficulty, tags: module.tags, outcomes: module.outcomes,
            },
          },
        });
        if (error) throw error;
        if (data?.error && data.error !== "no_active_goal") throw new Error(data.error);
        if (data?.error === "no_active_goal") { if (!cancelled) setAiResult(null); return; }
        const payload: AiPayload = { ...data, source: "ai" };
        if (!cancelled) setAiResult(payload);
        try { localStorage.setItem(cacheKey, JSON.stringify({ payload, ts: Date.now() })); } catch { /* ignore */ }
      } catch (e) {
        console.warn("[IPM] AI projection failed, falling back:", e);
        if (!cancelled) setAiResult(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [module.id, module.title, module.pillar, module.difficulty, module.tags, module.outcomes, primaryGoal, enableAi]);

  const projection: ImpactProjection = aiResult ?? deterministic;
  const isAi = projection.source === "ai";

  return (
    <div className="glass-card p-4 border border-primary/20 bg-gradient-to-br from-primary/[0.04] to-transparent">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Impact Projection Matrix</p>
        </div>
        <div className="flex items-center gap-1.5">
          {loading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
          <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
            isAi ? "bg-accent-gold/15 text-accent-gold" : "bg-muted/40 text-muted-foreground"
          }`}>
            {isAi ? "AI · for active goal" : "General projection"}
          </span>
        </div>
      </div>

      {primaryGoal && (
        <p className="text-[11px] text-muted-foreground mb-3 line-clamp-1">
          vs. <span className="text-foreground font-semibold">{aiResult?.goalTitle || primaryGoal.title}</span>
        </p>
      )}

      <div className="grid grid-cols-3 gap-2">
        <Metric
          icon={TrendingUp}
          label="Goal lift"
          value={`+${projection.goalContributionPct}%`}
          tone="text-accent-green"
          bar={projection.goalContributionPct * 2}
          barColor="bg-accent-green"
        />
        <Metric
          icon={Zap}
          label="Skill amp"
          value={`${projection.skillAmplification}`}
          tone="text-primary"
          bar={projection.skillAmplification}
          barColor="bg-primary"
          unit="/100"
        />
        <Metric
          icon={AlertTriangle}
          label="Cost of skip"
          value={formatOppCost(projection.opportunityCost, projection.opportunityCostUnit)}
          tone="text-rose-400"
          bar={Math.min(100, (projection.opportunityCost / Math.max(1, (primaryGoal?.targetValue || 1))) * 100)}
          barColor="bg-rose-500/70"
          compact
        />
      </div>

      {projection.rationale && (
        <p className="text-[11px] text-muted-foreground mt-3 italic leading-relaxed">
          → {projection.rationale}
        </p>
      )}
    </div>
  );
}

function Metric({
  icon: Icon, label, value, tone, bar, barColor, unit, compact,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  tone: string;
  bar: number;
  barColor: string;
  unit?: string;
  compact?: boolean;
}) {
  return (
    <div className="rounded-lg bg-background/40 backdrop-blur p-2.5">
      <div className="flex items-center gap-1 mb-1">
        <Icon className={`h-2.5 w-2.5 ${tone}`} strokeWidth={2.5} />
        <p className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground">{label}</p>
      </div>
      <p className={`font-display font-bold ${tone} tabular-nums leading-none ${compact ? "text-sm" : "text-lg"}`}>
        {value}
        {unit && <span className="text-[10px] text-muted-foreground/60 ml-0.5">{unit}</span>}
      </p>
      <div className="mt-1.5 h-0.5 bg-background/60 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${barColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(4, Math.min(100, bar))}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
