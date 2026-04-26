// COGNITIVE STATE CALIBRATOR — /nexus entry routing UI.
// Hybrid: client-side heuristic resolves instantly; AI fallback for ambiguous states.

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Zap, Coffee, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { calibrateLocal, snapshotCalibrationInput, getPathMeta, type CognitivePath, type CalibrationResult } from "@/lib/cognitive-state";
import { supabase } from "@/integrations/supabase/client";
import { FLAGSHIP_MODULES } from "@/lib/nexus-flagship";

interface Props {
  onPathChosen?: (path: CognitivePath) => void;
}

const CACHE_KEY = "nexus-calibration-v1";
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

interface CachedResult { result: CalibrationResult & { path: CognitivePath }; ts: number; }

const PATH_VISUALS: Record<CognitivePath, { icon: typeof Brain; tint: string; ring: string; cta: string; targetLabel: string }> = {
  peak: {
    icon: Brain,
    tint: "from-primary/15 to-primary/5",
    ring: "ring-primary/40",
    cta: "Drop into the trajectory",
    targetLabel: "Highest-leverage flagship",
  },
  recharge: {
    icon: Coffee,
    tint: "from-accent-green/15 to-accent-green/5",
    ring: "ring-accent-green/40",
    cta: "Begin reset",
    targetLabel: "Cognitive recharge module",
  },
  impact: {
    icon: Zap,
    tint: "from-accent-gold/15 to-accent-gold/5",
    ring: "ring-accent-gold/40",
    cta: "Reveal the insight",
    targetLabel: "30-second compressed insight",
  },
};

export default function CognitiveStateCalibrator({ onPathChosen }: Props) {
  const [result, setResult] = useState<(CalibrationResult & { path: CognitivePath }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Cache check
      try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (raw) {
          const c = JSON.parse(raw) as CachedResult;
          if (Date.now() - c.ts < CACHE_TTL) {
            setResult(c.result);
            setLoading(false);
            onPathChosen?.(c.result.path);
            return;
          }
        }
      } catch { /* ignore */ }

      const input = snapshotCalibrationInput();
      const local = calibrateLocal(input);

      if (local.outcome !== "ambiguous" && local.path) {
        const r = { ...local, path: local.path } as CalibrationResult & { path: CognitivePath };
        if (!cancelled) {
          setResult(r);
          setLoading(false);
          onPathChosen?.(r.path);
          try { localStorage.setItem(CACHE_KEY, JSON.stringify({ result: r, ts: Date.now() })); } catch { /* ignore */ }
        }
        return;
      }

      // Fallback to AI
      try {
        const { data, error } = await supabase.functions.invoke("nexus-calibrate", { body: { input } });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        const path = (data?.path || "impact") as CognitivePath;
        const r: CalibrationResult & { path: CognitivePath } = {
          outcome: path, path, source: "ai",
          reason: data?.reason || "Calibrated against your full strategic context.",
        };
        if (!cancelled) {
          setResult(r);
          setLoading(false);
          onPathChosen?.(path);
          try { localStorage.setItem(CACHE_KEY, JSON.stringify({ result: r, ts: Date.now() })); } catch { /* ignore */ }
        }
      } catch {
        // Last-resort safe default
        const fallback: CalibrationResult & { path: CognitivePath } = {
          outcome: "impact", path: "impact", source: "heuristic",
          reason: "Quick insight to keep momentum until deeper context loads.",
        };
        if (!cancelled) {
          setResult(fallback);
          setLoading(false);
          onPathChosen?.("impact");
        }
      }
    })();
    return () => { cancelled = true; };
  }, [onPathChosen]);

  if (loading) {
    return (
      <div className="px-5">
        <div className="glass-card p-5 flex items-center gap-3">
          <Loader2 className="h-4 w-4 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground">Calibrating cognitive state…</p>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const meta = getPathMeta(result.path);
  const v = PATH_VISUALS[result.path];
  const Icon = v.icon;
  const target = pickTarget(result.path);

  return (
    <section className="px-5">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Cognitive State Calibration</p>
        <span className="text-[9px] uppercase tracking-wider font-semibold text-muted-foreground/70 ml-auto">
          {result.source === "ai" ? "AI · contextual" : "Instant · heuristic"}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={result.path}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className={`glass-card p-5 bg-gradient-to-br ${v.tint} ring-1 ${v.ring}`}
        >
          <div className="flex items-start gap-3">
            <div className={`h-11 w-11 rounded-xl bg-background/40 backdrop-blur flex items-center justify-center shrink-0 ring-1 ${v.ring}`}>
              <Icon className="h-5 w-5 text-foreground" strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-0.5">{v.targetLabel}</p>
              <p className="font-display text-lg font-bold text-foreground leading-tight">{meta.label}</p>
              <p className="text-xs text-muted-foreground mt-1.5 italic leading-relaxed">"{result.reason}"</p>
            </div>
          </div>

          {target && (
            <Link
              to={target.href}
              className="mt-4 flex items-center justify-between rounded-xl bg-background/60 hover:bg-background/80 backdrop-blur px-3 py-2.5 transition-colors group"
            >
              <span className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Next</p>
                <p className="text-sm font-semibold text-foreground line-clamp-1">{target.title}</p>
              </span>
              <span className="flex items-center gap-1 text-[11px] uppercase tracking-wider font-bold text-primary shrink-0">
                {v.cta}
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

function pickTarget(path: CognitivePath): { href: string; title: string } | null {
  if (path === "peak") {
    const flagship = FLAGSHIP_MODULES.find(m => m.isPrimeDirective) || FLAGSHIP_MODULES[0];
    return flagship ? { href: `/nexus/course/${flagship.id}`, title: flagship.title } : null;
  }
  if (path === "recharge") {
    return { href: "/feed", title: "Cognitive Reset · Phenomenon Decoder feed" };
  }
  // impact: route to wisdom feed (compressed insights live there)
  return { href: "/feed", title: "Today's Immediate Impact insight" };
}
