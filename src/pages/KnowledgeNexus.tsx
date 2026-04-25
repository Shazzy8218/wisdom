// THE KNOWLEDGE NEXUS — Main destination page
// 3-pillar architecture (Foundation Tier, Mastery Tier, Wisdom God Core)
// + Neural Pathfinding visualization
// + Flagship module catalog
// + AI-on-demand micro-elective generator entry point

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Crown, Compass, Zap, ArrowRight, Loader2,
  Brain, Shield, Target, ChevronRight, Hexagon, Plus,
} from "lucide-react";
import { FLAGSHIP_MODULES, PILLAR_META, FlagshipPillar, PRIME_DIRECTIVE_ID, getFlagshipModule } from "@/lib/nexus-flagship";
import { CORE_TRACKS, MONEY_TRACK_IDS } from "@/lib/core-tracks";
import { MASTERY_TRACKS } from "@/lib/mastery-tracks";
import { useAuth } from "@/hooks/useAuth";
import { useGoals } from "@/hooks/useGoals";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { SerendipityDeepDive } from "@/components/StrategicSerendipity";

interface PathStep {
  moduleId: string;
  title: string;
  pillar: string;
  reasoning: string;
  leverageScore: number;
  estimatedMinutes: number;
  highestLeverage: boolean;
}

interface PathPlan {
  generatedAt: number;
  primaryGoal: string | null;
  trajectory: PathStep[];
  thesis: string;
  nextMove: PathStep | null;
}

const NEXUS_PLAN_KEY = "nexus-pathfinding-plan-v1";

export default function KnowledgeNexus() {
  const { user } = useAuth();
  const { goals } = useGoals();
  const [plan, setPlan] = useState<PathPlan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [activePillar, setActivePillar] = useState<FlagshipPillar | "all">("all");
  const [generatorOpen, setGeneratorOpen] = useState(false);

  // Hydrate cached plan
  useEffect(() => {
    try {
      const raw = localStorage.getItem(NEXUS_PLAN_KEY);
      if (raw) {
        const cached = JSON.parse(raw) as PathPlan;
        // Stale after 24h
        if (Date.now() - cached.generatedAt < 24 * 60 * 60 * 1000) {
          setPlan(cached);
        }
      }
    } catch { /* ignore */ }
  }, []);

  const flagshipsForAi = useMemo(
    () => FLAGSHIP_MODULES.map(m => ({
      id: m.id,
      pillar: m.pillar,
      title: m.title,
      hook: m.hook,
      duration: m.duration,
      difficulty: m.difficulty,
      tags: m.tags,
    })),
    [],
  );

  const generatePlan = async () => {
    if (!user) {
      toast({ title: "Sign in required", description: "Pathfinding needs your context.", variant: "destructive" });
      return;
    }
    setLoadingPlan(true);
    try {
      const { data, error } = await supabase.functions.invoke("nexus-pathfinding", {
        body: { context: { flagships: flagshipsForAi } },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setPlan(data);
      try { localStorage.setItem(NEXUS_PLAN_KEY, JSON.stringify(data)); } catch { /* ignore */ }
      toast({ title: "Trajectory locked.", description: "Your Neural Pathfinding plan is live." });
    } catch (err) {
      console.error(err);
      toast({
        title: "Pathfinding paused",
        description: err instanceof Error ? err.message : "Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setLoadingPlan(false);
    }
  };

  const filteredFlagships = activePillar === "all"
    ? FLAGSHIP_MODULES
    : FLAGSHIP_MODULES.filter(m => m.pillar === activePillar);

  const activeGoal = goals.find(g => !g.completed);

  return (
    <div className="min-h-screen pb-24">
      {/* HERO — Architect of Destiny aesthetic */}
      <div className="relative overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent-gold/5" />
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: "radial-gradient(circle at 20% 30%, hsl(var(--primary)) 0%, transparent 50%), radial-gradient(circle at 80% 70%, hsl(var(--accent-gold)) 0%, transparent 50%)",
        }} />
        <div className="relative px-5 pt-14 pb-8">
          <div className="flex items-center gap-2 mb-3">
            <Hexagon className="h-3.5 w-3.5 text-primary" strokeWidth={2.5} />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">The Knowledge Nexus</p>
          </div>
          <h1 className="font-display text-4xl font-bold text-foreground leading-[1.05] tracking-tight">
            Mastery they<br />
            <span className="text-gradient-red bg-gradient-to-r from-primary via-accent-gold to-primary bg-clip-text text-transparent">don't teach you.</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-4 max-w-md leading-relaxed">
            Hyper-current, application-first knowledge synthesized from operator playbooks, regulatory frontiers,
            and multi-tradition ethics. Curated by AI for your specific trajectory.
          </p>

          <div className="flex items-center gap-4 mt-5 text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold">
            <span className="flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-accent-green" /> Q2 2026 baseline</span>
            <span className="flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-primary" /> Updated weekly</span>
          </div>
        </div>
      </div>

      {/* PRIME DIRECTIVE — Cognitive Traction Engine hero */}
      {(() => {
        const pd = getFlagshipModule(PRIME_DIRECTIVE_ID);
        if (!pd) return null;
        const meta = PILLAR_META[pd.pillar];
        return (
          <div className="px-5 pt-6">
            <Link to={`/nexus/module/${pd.id}`} className="block glass-card p-5 border-2 border-accent-gold/40 bg-gradient-to-br from-accent-gold/[0.08] via-card to-primary/[0.05] relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-accent-gold/15 blur-3xl" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="h-3 w-3 text-accent-gold" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent-gold">Prime Directive · Hero Flagship</p>
                </div>
                <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">{meta.icon} {meta.name}</p>
                <h3 className="font-display text-xl font-black text-foreground leading-tight">{pd.title}</h3>
                <p className="text-xs text-muted-foreground italic mt-1.5">{pd.hook}</p>
                <div className="flex items-center gap-3 mt-3 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                  <span>{pd.duration}</span><span>·</span>
                  <span className="text-accent-gold">{pd.difficulty}</span><span>·</span>
                  <span className="text-primary">+ Wisdom Spark verification</span>
                </div>
                <div className="flex items-center gap-1 mt-3 text-[11px] uppercase tracking-wider font-bold text-primary group-hover:translate-x-0.5 transition-transform">
                  Begin trajectory <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </Link>
          </div>
        );
      })()}

      <div className="editorial-divider mx-5 my-8" />

      {/* STRATEGIC SERENDIPITY DEEP-DIVE */}
      <SerendipityDeepDive />

      <div className="editorial-divider mx-5 my-8" />

      {/* NEURAL PATHFINDING */}
      <div className="px-5 pt-2 pb-2">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Brain className="h-3.5 w-3.5 text-primary" />
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Neural Pathfinding</p>
          </div>
          {plan && (
            <button
              onClick={generatePlan}
              disabled={loadingPlan}
              className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground hover:text-primary transition-colors"
            >
              {loadingPlan ? "Recalculating…" : "Recalculate"}
            </button>
          )}
        </div>
        <h2 className="font-display text-2xl font-bold text-foreground mb-1">Your Trajectory</h2>
        <p className="text-xs text-muted-foreground mb-4">
          {activeGoal
            ? <>Optimized for: <span className="text-primary font-semibold">{activeGoal.title}</span></>
            : <>Set an active goal in <Link to="/goals" className="text-primary underline">Mission Control</Link> for sharper curation.</>}
        </p>

        {!plan && !loadingPlan && (
          <button
            onClick={generatePlan}
            className="w-full glass-card p-5 border border-primary/20 hover:border-primary/40 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary/20 to-accent-gold/10 flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-foreground text-sm">Generate Your Pathfinding Plan</p>
                <p className="text-xs text-muted-foreground mt-0.5">AI synthesizes goals, mastery, calibration → ranked trajectory</p>
              </div>
              <ArrowRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
            </div>
          </button>
        )}

        {loadingPlan && (
          <div className="glass-card p-6 flex flex-col items-center justify-center">
            <Loader2 className="h-5 w-5 text-primary animate-spin mb-2" />
            <p className="text-xs text-muted-foreground">Synthesizing your trajectory…</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">Goals · Mastery · Calibration · Recent engagement</p>
          </div>
        )}

        {plan && (
          <div className="space-y-3">
            <div className="glass-card p-4 border border-primary/15 bg-gradient-to-br from-primary/[0.04] to-transparent">
              <p className="text-[10px] uppercase tracking-wider font-bold text-primary mb-1.5">Strategic Thesis</p>
              <p className="text-sm text-foreground/90 leading-relaxed italic">{plan.thesis}</p>
            </div>

            <div className="space-y-2">
              {plan.trajectory.map((step, i) => (
                <PathStepCard key={step.moduleId + i} step={step} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="editorial-divider mx-5 my-8" />

      {/* WISDOM GOD CORE — The Unbeatable Edge */}
      <div className="px-5">
        <div className="flex items-center gap-2 mb-1">
          <Crown className="h-3.5 w-3.5 text-accent-gold" />
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent-gold">Wisdom God Core</p>
        </div>
        <h2 className="font-display text-2xl font-bold text-foreground">The Unbeatable Edge</h2>
        <p className="text-xs text-muted-foreground mt-1 mb-4 leading-relaxed">
          Hand-crafted flagship modules. The gold standard universities cannot teach.
        </p>

        {/* Pillar filter */}
        <div className="flex gap-1.5 overflow-x-auto hide-scrollbar mb-4 -mx-5 px-5">
          <PillarChip active={activePillar === "all"} onClick={() => setActivePillar("all")} label="All" icon="✦" />
          {(Object.keys(PILLAR_META) as FlagshipPillar[]).map(p => (
            <PillarChip
              key={p}
              active={activePillar === p}
              onClick={() => setActivePillar(p)}
              label={PILLAR_META[p].name.split(" ")[0]}
              icon={PILLAR_META[p].icon}
            />
          ))}
        </div>

        <div className="space-y-2">
          {filteredFlagships.map((mod, i) => (
            <FlagshipCard key={mod.id} module={mod} index={i} />
          ))}
        </div>

        {/* AI on-demand generator */}
        <button
          onClick={() => setGeneratorOpen(true)}
          className="w-full glass-card p-4 mt-3 border-dashed border border-primary/20 hover:border-primary/40 transition-all flex items-center gap-3"
        >
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Plus className="h-4 w-4 text-primary" />
          </div>
          <div className="text-left flex-1">
            <p className="text-sm font-semibold text-foreground">Generate a Custom Micro-Elective</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">AI builds a flagship-quality module on any topic</p>
          </div>
          <ArrowRight className="h-4 w-4 text-primary" />
        </button>
      </div>

      <div className="editorial-divider mx-5 my-8" />

      {/* MASTERY TIER */}
      <div className="px-5">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="h-3.5 w-3.5 text-primary" />
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Mastery Tier</p>
        </div>
        <h2 className="font-display text-2xl font-bold text-foreground">Strategic Certifications</h2>
        <p className="text-xs text-muted-foreground mt-1 mb-4 leading-relaxed">
          University-transcending tracks. AI-validated mastery, not seat-time.
        </p>
        <div className="space-y-2">
          {MASTERY_TRACKS.slice(0, 4).map((t, i) => (
            <Link
              key={t.id}
              to={`/mastery/${t.id}`}
              className="glass-card p-3.5 flex items-center gap-3 hover:border-accent-gold/30 transition-all block group"
            >
              <span className="text-xl">{t.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground line-clamp-1">{t.name}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{t.tagline}</p>
              </div>
              <Crown className="h-3.5 w-3.5 text-accent-gold opacity-60 group-hover:opacity-100 transition-opacity" />
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
        <Link
          to="/courses"
          className="block text-center text-[11px] uppercase tracking-wider font-semibold text-primary mt-3 hover:underline"
        >
          See full Mastery catalog →
        </Link>
      </div>

      <div className="editorial-divider mx-5 my-8" />

      {/* FOUNDATION TIER */}
      <div className="px-5">
        <div className="flex items-center gap-2 mb-1">
          <Compass className="h-3.5 w-3.5 text-accent-green" />
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent-green">Foundation Tier</p>
        </div>
        <h2 className="font-display text-2xl font-bold text-foreground">Cognitive OS Architecture</h2>
        <p className="text-xs text-muted-foreground mt-1 mb-4 leading-relaxed">
          Continuously updated AI literacy & operator skill primitives. 2026-current.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {CORE_TRACKS.filter(t => !MONEY_TRACK_IDS.includes(t.id)).slice(0, 6).map((t) => (
            <Link
              key={t.id}
              to={`/track/${t.id}`}
              className="glass-card p-3 hover:border-primary/20 transition-all block"
            >
              <span className="text-lg block mb-1.5">{t.icon}</span>
              <p className="text-xs font-semibold text-foreground line-clamp-2">{t.name}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{t.modules.length} modules</p>
            </Link>
          ))}
        </div>
      </div>

      {/* AI generator modal */}
      <AnimatePresence>
        {generatorOpen && (
          <MicroElectiveGenerator onClose={() => setGeneratorOpen(false)} userGoal={activeGoal?.title} />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────── components ─────────── */

function PillarChip({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon: string }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-all ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-surface-2 text-muted-foreground hover:bg-surface-hover"
      }`}
    >
      <span>{icon}</span>
      {label}
    </button>
  );
}

function PathStepCard({ step, index }: { step: PathStep; index: number }) {
  const meta = PILLAR_META[step.pillar as FlagshipPillar];
  const isFlagship = FLAGSHIP_MODULES.some(m => m.id === step.moduleId);

  const card = (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`glass-card p-4 transition-all ${
        step.highestLeverage
          ? "border-2 border-primary/40 bg-gradient-to-br from-primary/[0.06] to-transparent"
          : "hover:border-primary/20"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-1 shrink-0">
          <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-bold ${
            step.highestLeverage ? "bg-primary text-primary-foreground" : "bg-surface-2 text-muted-foreground"
          }`}>
            {index + 1}
          </span>
          {step.highestLeverage && (
            <span className="text-[8px] font-bold uppercase tracking-wider text-primary">Now</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              {meta?.icon} {meta?.name.split(" ")[0]}
            </span>
            <span className="text-[9px] font-bold text-accent-gold">· {step.leverageScore}/100 leverage</span>
          </div>
          <p className="text-sm font-semibold text-foreground leading-tight">{step.title}</p>
          <p className="text-[11px] text-muted-foreground/90 mt-1.5 leading-relaxed italic">
            "{step.reasoning}"
          </p>
          <p className="text-[10px] text-muted-foreground/70 mt-1.5">~{step.estimatedMinutes} min</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
      </div>
    </motion.div>
  );

  if (isFlagship) {
    return <Link to={`/nexus/module/${step.moduleId}`} className="block">{card}</Link>;
  }
  return card;
}

function FlagshipCard({ module: mod, index }: { module: typeof FLAGSHIP_MODULES[0]; index: number }) {
  const meta = PILLAR_META[mod.pillar];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Link
        to={`/nexus/module/${mod.id}`}
        className="glass-card p-4 block hover:border-primary/30 transition-all group relative overflow-hidden"
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${meta.color} opacity-30 group-hover:opacity-50 transition-opacity`} />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">{meta.icon}</span>
            <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground">{meta.name}</span>
          </div>
          <p className="font-display text-base font-bold text-foreground leading-tight">{mod.title}</p>
          <p className="text-[12px] text-muted-foreground/90 mt-1.5 italic leading-snug line-clamp-2">{mod.hook}</p>
          <div className="flex items-center gap-3 mt-3 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/70">
            <span>{mod.duration}</span>
            <span>·</span>
            <span className="text-accent-gold">{mod.difficulty}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function MicroElectiveGenerator({ onClose, userGoal }: { onClose: () => void; userGoal?: string }) {
  const [topic, setTopic] = useState("");
  const [pillar, setPillar] = useState<FlagshipPillar>("ethical-finance");
  const [streaming, setStreaming] = useState(false);
  const [content, setContent] = useState("");

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setStreaming(true);
    setContent("");

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/nexus-micro-elective`;
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ topic, pillar, userGoal }),
      });

      if (!resp.ok || !resp.body) {
        const errText = await resp.text();
        throw new Error(errText || "Generation failed");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let done = false;

      while (!done) {
        const { value, done: streamDone } = await reader.read();
        if (streamDone) break;
        buffer += decoder.decode(value, { stream: true });

        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) setContent(prev => prev + delta);
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (err) {
      toast({
        title: "Generation failed",
        description: err instanceof Error ? err.message : "Try a different topic.",
        variant: "destructive",
      });
    } finally {
      setStreaming(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        className="fixed inset-x-0 bottom-0 top-12 z-[90] bg-card border-t border-border rounded-t-3xl flex flex-col"
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border/40">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Wisdom God Core</p>
            <h3 className="font-display text-lg font-bold text-foreground">Custom Micro-Elective</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm">Close</button>
        </div>

        <div className="px-5 py-4 space-y-3 border-b border-border/40">
          <input
            type="text"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="e.g. Section 1031 exchanges in 2026 commercial real estate"
            className="w-full bg-surface-2 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-1 focus:ring-primary/40"
            disabled={streaming}
          />
          <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
            {(Object.keys(PILLAR_META) as FlagshipPillar[]).map(p => (
              <button
                key={p}
                onClick={() => setPillar(p)}
                disabled={streaming}
                className={`shrink-0 rounded-lg px-3 py-1 text-[10px] font-semibold uppercase tracking-wider transition-all ${
                  pillar === p ? "bg-primary text-primary-foreground" : "bg-surface-2 text-muted-foreground"
                }`}
              >
                {PILLAR_META[p].icon} {PILLAR_META[p].name.split(" ")[0]}
              </button>
            ))}
          </div>
          <button
            onClick={handleGenerate}
            disabled={!topic.trim() || streaming}
            className="w-full bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            {streaming ? "Synthesizing…" : "Generate Module"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {content ? (
            <article className="prose prose-invert prose-sm max-w-none prose-headings:font-display prose-headings:text-foreground prose-p:text-foreground/90 prose-strong:text-primary prose-em:text-accent-gold prose-em:not-italic prose-em:font-semibold">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90">{content}</pre>
            </article>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-12">
              <Target className="h-8 w-8 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">Name a topic.</p>
              <p className="text-[11px] text-muted-foreground/60 mt-1 max-w-xs">
                The AI generates flagship-quality modules with operator moves, case studies, and ethical lenses.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
