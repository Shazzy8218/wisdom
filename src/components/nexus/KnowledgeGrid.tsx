// THE KNOWLEDGE NEXUS — Knowledge Grid (Content Architecture Overhaul)
// Dynamic grid of "Wisdom Segment" cards. Each card is interactive:
//  - Tap/hover to expand "Why it Matters" + Skill Impact Projection
//  - "Beyond University" tag for unwritten-playbook / system-interrogation modules
// Sources:
//  - Prime Directive flagship (hero)
//  - Personalized recommendations from pathfinding plan (if available)
//  - Top trending insights from Phenomenon Decoder (lightweight: tag-based pick)

import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Sparkles, Eye, Target, Zap, ChevronDown, ArrowRight, Flame } from "lucide-react";
import { FLAGSHIP_MODULES, PILLAR_META, FlagshipPillar, FlagshipModule } from "@/lib/nexus-flagship";
import { useGoals } from "@/hooks/useGoals";

interface PathStep {
  moduleId: string;
  title: string;
  pillar: string;
  reasoning: string;
  leverageScore: number;
  highestLeverage: boolean;
}

interface PathPlan {
  trajectory: PathStep[];
  thesis: string;
}

interface Props {
  plan: PathPlan | null;
}

// Pillars considered "beyond university"
const BEYOND_UNIVERSITY: FlagshipPillar[] = ["unwritten-playbooks", "system-interrogation", "black-swan"];

function isBeyondUniversity(mod: FlagshipModule): boolean {
  return BEYOND_UNIVERSITY.includes(mod.pillar);
}

function getSkillImpacts(mod: FlagshipModule): string[] {
  // Use first 3 outcomes as skill impacts, trimmed
  return (mod.outcomes || []).slice(0, 3).map(o => o.length > 70 ? o.slice(0, 67) + "…" : o);
}

export default function KnowledgeGrid({ plan }: Props) {
  const { primaryGoal } = useGoals();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Compose ordered list:
  // 1. Prime directive (always first)
  // 2. Top 2 from plan (if available, that aren't the prime directive)
  // 3. 3-4 other flagships filling out the grid
  const composed = useMemo(() => {
    const prime = FLAGSHIP_MODULES.find(m => m.isPrimeDirective);
    const seen = new Set<string>();
    const result: { mod: FlagshipModule; leverage?: number; highestLeverage?: boolean; isPrime?: boolean; reasoning?: string }[] = [];

    if (prime) {
      result.push({ mod: prime, isPrime: true });
      seen.add(prime.id);
    }

    if (plan?.trajectory) {
      for (const step of plan.trajectory) {
        if (seen.has(step.moduleId)) continue;
        const mod = FLAGSHIP_MODULES.find(m => m.id === step.moduleId);
        if (!mod) continue;
        result.push({
          mod,
          leverage: step.leverageScore,
          highestLeverage: step.highestLeverage,
          reasoning: step.reasoning,
        });
        seen.add(mod.id);
        if (result.length >= 4) break;
      }
    }

    // Fill remainder with diverse pillar selection
    for (const mod of FLAGSHIP_MODULES) {
      if (result.length >= 6) break;
      if (seen.has(mod.id)) continue;
      result.push({ mod });
      seen.add(mod.id);
    }

    return result;
  }, [plan]);

  return (
    <section className="px-5">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Wisdom Segments</p>
      </div>
      <h2 className="font-display text-2xl font-bold text-foreground">Your Knowledge Grid</h2>
      <p className="text-xs text-muted-foreground mt-1 mb-4 leading-relaxed">
        {primaryGoal
          ? <>Curated for <span className="text-primary font-semibold">{primaryGoal.title}</span> — tap any card to see why it matters.</>
          : <>Tap any card to see why it matters and what skills it sharpens.</>}
      </p>

      <div className="space-y-2.5">
        {composed.map(({ mod, leverage, highestLeverage, isPrime, reasoning }, i) => (
          <SegmentCard
            key={mod.id}
            mod={mod}
            leverage={leverage}
            highestLeverage={highestLeverage}
            isPrime={isPrime}
            reasoning={reasoning}
            expanded={expandedId === mod.id}
            onToggle={() => setExpandedId(expandedId === mod.id ? null : mod.id)}
            primaryGoalTitle={primaryGoal?.title || null}
            index={i}
          />
        ))}
      </div>
    </section>
  );
}

interface SegmentProps {
  mod: FlagshipModule;
  leverage?: number;
  highestLeverage?: boolean;
  isPrime?: boolean;
  reasoning?: string;
  expanded: boolean;
  onToggle: () => void;
  primaryGoalTitle: string | null;
  index: number;
}

function SegmentCard({ mod, leverage, highestLeverage, isPrime, reasoning, expanded, onToggle, primaryGoalTitle, index }: SegmentProps) {
  const meta = PILLAR_META[mod.pillar];
  const beyond = isBeyondUniversity(mod);
  const skills = getSkillImpacts(mod);

  // "Why it matters" — prefer AI reasoning from plan, else use hook + outcomes synthesis
  const whyItMatters = reasoning
    || (primaryGoalTitle
        ? `Sharpens the structural skills needed to push "${primaryGoalTitle}" — without academic noise.`
        : mod.hook);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`relative rounded-2xl border overflow-hidden transition-all ${
        isPrime
          ? "border-accent-gold/40 bg-gradient-to-br from-accent-gold/[0.08] via-card to-primary/[0.05]"
          : highestLeverage
            ? "border-primary/40 bg-gradient-to-br from-primary/[0.06] to-card"
            : "border-border bg-card hover:border-primary/25"
      }`}
    >
      {/* Background tint by pillar */}
      <div className={`absolute inset-0 bg-gradient-to-br ${meta.color} opacity-[0.18] pointer-events-none`} />

      <div className="relative">
        {/* Tap target */}
        <button
          onClick={onToggle}
          aria-expanded={expanded}
          className="w-full text-left p-4"
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-base">{meta.icon}</span>
              <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                {meta.name.split(" ")[0]}
              </span>
              {isPrime && (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent-gold/15 text-accent-gold text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider">
                  <Crown className="h-2.5 w-2.5" /> Prime
                </span>
              )}
              {highestLeverage && !isPrime && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 text-primary text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider">
                  <Flame className="h-2.5 w-2.5" /> Now
                </span>
              )}
              {beyond && (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 text-rose-400 text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider">
                  Beyond university
                </span>
              )}
            </div>
            {typeof leverage === "number" && (
              <span className="text-[10px] font-bold text-accent-gold tabular-nums shrink-0">
                {leverage}/100
              </span>
            )}
          </div>

          <p className="font-display text-base font-bold text-foreground leading-tight">{mod.title}</p>
          <p className="text-[12px] text-muted-foreground/90 mt-1.5 italic leading-snug line-clamp-2">{mod.hook}</p>

          <div className="flex items-center justify-between mt-2.5">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/70">
              <span>{mod.duration}</span>
              <span>·</span>
              <span className="text-accent-gold">{mod.difficulty}</span>
            </div>
            <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-primary">
              {expanded ? "Hide" : "Why this"}
              <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
            </span>
          </div>
        </button>

        {/* Expandable "Why it Matters" segment */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="border-t border-border/40 px-4 py-3.5 space-y-3 bg-background/40 backdrop-blur-sm">
                {/* Why it matters */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Eye className="h-3 w-3 text-primary" />
                    <p className="text-[9px] uppercase tracking-wider font-bold text-primary">Why this matters</p>
                  </div>
                  <p className="text-xs text-foreground/85 leading-relaxed">{whyItMatters}</p>
                </div>

                {/* Skill Impact Projection */}
                {skills.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Target className="h-3 w-3 text-accent-green" />
                      <p className="text-[9px] uppercase tracking-wider font-bold text-accent-green">Skill impact projection</p>
                    </div>
                    <ul className="space-y-1">
                      {skills.map((s, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-[11px] text-foreground/80 leading-relaxed">
                          <Zap className="h-2.5 w-2.5 mt-1 shrink-0 text-accent-green" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <Link
                  to={`/nexus/module/${mod.id}`}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-primary text-primary-foreground py-2 text-[11px] font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors"
                >
                  Begin module <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
