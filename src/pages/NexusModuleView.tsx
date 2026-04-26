// THE KNOWLEDGE NEXUS — Flagship Module Detail View
// Full-depth display of a hand-crafted Wisdom God Core module:
// hook, doctrines, sections + operator moves, case study, arena tie-in.

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Crown, CheckCircle2, Target, BookOpen, Hexagon, Sparkles, Zap } from "lucide-react";
import { getFlagshipModule, PILLAR_META } from "@/lib/nexus-flagship";
import { useProgress } from "@/hooks/useProgress";
import { toast } from "@/hooks/use-toast";
import WisdomSpark from "@/components/WisdomSpark";
import ImpactProjectionMatrix from "@/components/nexus/ImpactProjectionMatrix";
import RealityShiftIndicator from "@/components/nexus/RealityShiftIndicator";
import { computeImpactProjection } from "@/lib/impact-projection";
import { useGoals } from "@/hooks/useGoals";

export default function NexusModuleView() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const { progress, update } = useProgress();
  const { primaryGoal } = useGoals();
  const mod = moduleId ? getFlagshipModule(moduleId) : undefined;
  const [sparkSection, setSparkSection] = useState<number | null>(null);
  const [shiftOpen, setShiftOpen] = useState(false);

  useEffect(() => {
    if (moduleId && !mod) {
      // Unknown moduleId — likely an AI-generated micro-elective from a path step
      navigate("/nexus", { replace: true });
    }
  }, [moduleId, mod, navigate]);

  if (!mod) return null;

  const meta = PILLAR_META[mod.pillar];
  const flagshipCompleted = (progress.completedLessons || []).includes(`nexus:${mod.id}`);

  const markComplete = () => {
    if (flagshipCompleted) return;
    const lessonId = `nexus:${mod.id}`;
    update(p => ({
      ...p,
      completedLessons: [...(p.completedLessons || []), lessonId],
      tokens: (p.tokens || 0) + 15,
      xp: (p.xp || 0) + 25,
      tokenHistory: [
        ...(p.tokenHistory || []),
        { action: `Flagship: ${mod.title}`, amount: 15, date: new Date().toISOString() },
      ],
    }));
    toast({ title: "Flagship complete.", description: "+15 Wisdom Tokens · Mastery deposited." });
    setShiftOpen(true);
  };

  const projectedLift = computeImpactProjection({ module: mod, goal: primaryGoal }).goalContributionPct;

  return (
    <div className="min-h-screen pb-24">
      {/* HEADER */}
      <div className={`relative px-5 pt-14 pb-6 bg-gradient-to-br ${meta.color} border-b border-border/40`}>
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-background/60 backdrop-blur-md hover:bg-background/80 transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>

        <div className="flex items-center gap-2 mb-3">
          <Hexagon className="h-3 w-3 text-accent-gold" strokeWidth={2.5} />
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent-gold">Wisdom God Core · Flagship</p>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">{meta.icon}</span>
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">{meta.name}</span>
        </div>

        <h1 className="font-display text-2xl font-bold text-foreground leading-tight">{mod.title}</h1>
        <p className="text-sm text-muted-foreground mt-2 italic leading-relaxed">{mod.subtitle}</p>

        <div className="flex items-center gap-3 mt-4 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
          <span>{mod.duration}</span>
          <span>·</span>
          <span className="text-accent-gold">{mod.difficulty}</span>
        </div>
      </div>

      {/* IMPACT PROJECTION MATRIX — Predictive Manifestation Engine */}
      <div className="px-5 pt-6">
        <ImpactProjectionMatrix module={mod} />
      </div>

      {/* HOOK */}
      <div className="px-5 pt-6">
        <div className="glass-card p-4 border border-primary/20 bg-gradient-to-br from-primary/[0.04] to-transparent">
          <p className="text-[10px] uppercase tracking-wider font-bold text-primary mb-2">Why this is forbidden in mainstream curricula</p>
          <p className="text-sm text-foreground/90 leading-relaxed italic">"{mod.hook}"</p>
          <div className="editorial-divider my-3" />
          <p className="text-xs text-muted-foreground leading-relaxed">{mod.whyForbidden}</p>
        </div>
      </div>

      {/* OUTCOMES */}
      <div className="px-5 pt-6">
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-3.5 w-3.5 text-accent-green" />
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent-green">Outcomes — what you will be able to do</p>
        </div>
        <ul className="space-y-2">
          {mod.outcomes.map((o, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-start gap-2.5 text-sm text-foreground/90 leading-relaxed"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-accent-green mt-1 shrink-0" />
              <span>{o}</span>
            </motion.li>
          ))}
        </ul>
      </div>

      {/* DOCTRINES */}
      {mod.doctrines && mod.doctrines.length > 0 && (
        <div className="px-5 pt-7">
          <div className="flex items-center gap-2 mb-3">
            <Crown className="h-3.5 w-3.5 text-accent-gold" />
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent-gold">Multi-Tradition Ethical Lenses</p>
          </div>
          <p className="text-xs text-muted-foreground mb-3 italic">
            Not dogma — decision-making frameworks operators use as structural advantage.
          </p>
          <div className="space-y-2">
            {mod.doctrines.map((d, i) => (
              <div key={i} className="glass-card p-4">
                <p className="text-xs font-bold text-accent-gold uppercase tracking-wider">{d.name}</p>
                <p className="text-sm text-foreground/90 mt-1.5 leading-relaxed font-medium">{d.principle}</p>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">→ {d.application}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTIONS */}
      <div className="px-5 pt-7">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="h-3.5 w-3.5 text-primary" />
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">The Module</p>
        </div>
        <div className="space-y-5">
          {mod.sections.map((s, i) => (
            <motion.section
              key={i}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-[10px] font-bold text-muted-foreground/60">§ {(i + 1).toString().padStart(2, "0")}</span>
                <h3 className="font-display text-lg font-bold text-foreground leading-tight">{s.heading}</h3>
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed">{s.body}</p>
              {s.operatorMove && (
                <div className="mt-3 glass-card p-3 border-l-2 border-primary bg-primary/[0.04]">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-primary mb-1">Operator Move</p>
                  <p className="text-xs text-foreground/90 leading-relaxed">{s.operatorMove}</p>
                </div>
              )}
              <button
                onClick={() => setSparkSection(i)}
                className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-xl border border-accent-gold/30 bg-accent-gold/[0.06] hover:bg-accent-gold/[0.12] py-2 text-[11px] font-bold uppercase tracking-wider text-accent-gold transition-all"
              >
                <Zap className="h-3 w-3" /> Wisdom Spark · 60-sec challenge
              </button>
            </motion.section>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {sparkSection !== null && mod.sections[sparkSection] && (
          <WisdomSpark
            context={{
              moduleId: mod.id,
              moduleTitle: mod.title,
              sectionHeading: mod.sections[sparkSection].heading,
              sectionBody: mod.sections[sparkSection].body,
              operatorMove: mod.sections[sparkSection].operatorMove,
              doctrineHint: mod.doctrines?.[0]?.name,
            }}
            onClose={() => setSparkSection(null)}
          />
        )}
      </AnimatePresence>

      {/* CASE STUDY */}
      <div className="px-5 pt-7">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-3.5 w-3.5 text-accent-gold" />
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent-gold">Case Study</p>
        </div>
        <div className="glass-card p-5 border border-accent-gold/15 bg-gradient-to-br from-accent-gold/[0.04] to-transparent">
          <p className="font-display text-base font-bold text-foreground leading-tight">{mod.caseStudy.title}</p>
          <div className="mt-4 space-y-3 text-sm">
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-0.5">Setup</p>
              <p className="text-foreground/85 leading-relaxed">{mod.caseStudy.setup}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-primary mb-0.5">Decision</p>
              <p className="text-foreground/85 leading-relaxed">{mod.caseStudy.decision}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-accent-green mb-0.5">Outcome</p>
              <p className="text-foreground/85 leading-relaxed">{mod.caseStudy.outcome}</p>
            </div>
          </div>
        </div>
      </div>

      {/* COMPLETE / TIE-INS */}
      <div className="px-5 pt-7 space-y-3">
        <button
          onClick={markComplete}
          disabled={flagshipCompleted}
          className={`w-full rounded-2xl py-3.5 text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            flagshipCompleted
              ? "bg-accent-green/20 text-accent-green cursor-default"
              : "bg-primary text-primary-foreground hover:opacity-90"
          }`}
        >
          {flagshipCompleted ? (
            <><CheckCircle2 className="h-4 w-4" /> Flagship Complete · +15 Wisdom Tokens earned</>
          ) : (
            <>Mark Flagship Mastered · +15 Wisdom Tokens</>
          )}
        </button>

        <div className="grid grid-cols-2 gap-2">
          <Link to="/drills" className="glass-card p-3 text-center hover:border-primary/30 transition-all">
            <p className="text-[10px] uppercase tracking-wider font-bold text-primary mb-1">Apply</p>
            <p className="text-xs text-foreground font-semibold">Mastery Arena</p>
          </Link>
          <Link to="/feed" className="glass-card p-3 text-center hover:border-primary/30 transition-all">
            <p className="text-[10px] uppercase tracking-wider font-bold text-primary mb-1">Real-time context</p>
            <p className="text-xs text-foreground font-semibold">Wisdom Feed</p>
          </Link>
        </div>

        {mod.feedTriggers && mod.feedTriggers.length > 0 && (
          <div className="glass-card p-3">
            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-2">Tracking signals</p>
            <div className="flex flex-wrap gap-1.5">
              {mod.feedTriggers.map((t, i) => (
                <span key={i} className="text-[10px] bg-surface-2 rounded-full px-2 py-0.5 text-muted-foreground">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
