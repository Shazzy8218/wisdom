// COURSE SYLLABUS — Standardized course page (Pillar V).
// /nexus/course/:id — What You'll Achieve, Why This Matters, Who This Is For,
// Prerequisites, Certifiable Value, Impact Projection Matrix.

import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Award, BookOpen, Crown, GraduationCap,
  Hexagon, Target, Users, Clock, ListChecks, ShieldCheck,
} from "lucide-react";
import { getFlagshipModule, PILLAR_META } from "@/lib/nexus-flagship";
import { useProgress } from "@/hooks/useProgress";
import ImpactProjectionMatrix from "@/components/nexus/ImpactProjectionMatrix";

export default function NexusCourse() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { progress } = useProgress();
  const mod = id ? getFlagshipModule(id) : undefined;

  const completed = useMemo(
    () => mod ? (progress.completedLessons || []).includes(`nexus:${mod.id}`) : false,
    [mod, progress.completedLessons]
  );

  if (!mod) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5">
        <div className="text-center max-w-sm">
          <p className="font-display text-xl font-bold text-foreground">Course not found</p>
          <p className="text-xs text-muted-foreground mt-2">This course may have been retired or moved.</p>
          <Link to="/nexus" className="inline-block mt-4 text-primary text-sm font-semibold underline">Return to Nexus</Link>
        </div>
      </div>
    );
  }

  const meta = PILLAR_META[mod.pillar];
  const sectionsCount = mod.sections.length;
  const minutes = parseInt(mod.duration) || 30;

  // Derived metadata
  const audience = pickAudience(mod.difficulty);
  const prerequisites = pickPrerequisites(mod.difficulty, mod.pillar);
  const certificationValue = pickCertValue(mod.difficulty);

  return (
    <div className="min-h-screen pb-32">
      {/* HEADER */}
      <div className={`relative px-5 pt-14 pb-7 bg-gradient-to-br ${meta.color} border-b border-border/40`}>
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-background/60 backdrop-blur-md hover:bg-background/80 transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>

        <div className="flex items-center gap-2 mb-3">
          <GraduationCap className="h-3 w-3 text-accent-gold" strokeWidth={2.5} />
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent-gold">Syllabus · {meta.name}</p>
        </div>

        <h1 className="font-display text-2xl font-bold text-foreground leading-tight">{mod.title}</h1>
        <p className="text-sm text-muted-foreground mt-2 italic leading-relaxed">{mod.subtitle}</p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-4 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {mod.duration}</span>
          <span className="flex items-center gap-1 text-accent-gold"><Crown className="h-3 w-3" /> {mod.difficulty}</span>
          <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {sectionsCount} sections</span>
        </div>
      </div>

      {/* IMPACT PROJECTION MATRIX (Pillar III) */}
      <div className="px-5 pt-6">
        <ImpactProjectionMatrix module={mod} />
      </div>

      {/* WHAT YOU WILL ACHIEVE */}
      <Block icon={Target} label="What You Will Achieve" tint="text-accent-green">
        <ul className="space-y-2">
          {mod.outcomes.map((o, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -6 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className="flex items-start gap-2.5 text-sm text-foreground/90 leading-relaxed"
            >
              <span className="mt-1.5 h-1 w-1 rounded-full bg-accent-green shrink-0" />
              <span>{o}</span>
            </motion.li>
          ))}
        </ul>
      </Block>

      {/* WHY THIS MATTERS */}
      <Block icon={Hexagon} label="Why This Matters" tint="text-primary">
        <p className="text-sm text-foreground/90 leading-relaxed italic">"{mod.hook}"</p>
        <div className="editorial-divider my-3" />
        <p className="text-xs text-muted-foreground leading-relaxed">{mod.whyForbidden}</p>
      </Block>

      {/* WHO THIS IS FOR */}
      <Block icon={Users} label="Who This Is For" tint="text-foreground">
        <ul className="space-y-1.5">
          {audience.map((a, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/85 leading-relaxed">
              <span className="mt-1.5 h-1 w-1 rounded-full bg-muted-foreground shrink-0" />
              <span>{a}</span>
            </li>
          ))}
        </ul>
      </Block>

      {/* PREREQUISITES */}
      <Block icon={ListChecks} label="Prerequisites" tint="text-muted-foreground">
        {prerequisites.length === 0 ? (
          <p className="text-sm text-foreground/85 leading-relaxed">None — designed for direct entry.</p>
        ) : (
          <ul className="space-y-1.5">
            {prerequisites.map((p, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/85 leading-relaxed">
                <span className="mt-1.5 h-1 w-1 rounded-full bg-muted-foreground shrink-0" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        )}
      </Block>

      {/* CERTIFIABLE VALUE */}
      <div className="px-5 pt-6">
        <div className="glass-card p-4 border border-accent-gold/25 bg-gradient-to-br from-accent-gold/[0.05] to-transparent">
          <div className="flex items-center gap-2 mb-2">
            <Award className="h-3.5 w-3.5 text-accent-gold" />
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent-gold">Certifiable Value</p>
          </div>
          <p className="text-sm text-foreground/90 leading-relaxed">{certificationValue}</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <CertChip icon={ShieldCheck} label="AI-validated" />
            <CertChip icon={Crown} label={mod.difficulty} />
            <CertChip icon={Award} label="+15 tokens" />
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 pt-7 space-y-2">
        <Link
          to={`/nexus/module/${mod.id}`}
          className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
        >
          {completed ? "Review the module" : "Enter the module"} <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          to="/drills"
          className="w-full flex items-center justify-center gap-2 rounded-2xl py-2.5 text-xs font-semibold uppercase tracking-wider bg-surface-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          Practice in Mastery Arena
        </Link>
        <p className="text-[10px] text-center text-muted-foreground/60 mt-2">
          ~{minutes} minute commitment · {sectionsCount} structured sections
        </p>
      </div>
    </div>
  );
}

function Block({
  icon: Icon, label, tint, children,
}: {
  icon: typeof Target;
  label: string;
  tint: string;
  children: React.ReactNode;
}) {
  return (
    <section className="px-5 pt-6">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`h-3.5 w-3.5 ${tint}`} strokeWidth={2.2} />
        <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${tint}`}>{label}</p>
      </div>
      <div className="glass-card p-4">{children}</div>
    </section>
  );
}

function CertChip({ icon: Icon, label }: { icon: typeof Award; label: string }) {
  return (
    <div className="rounded-lg bg-background/50 backdrop-blur p-2 flex flex-col items-center gap-1">
      <Icon className="h-3.5 w-3.5 text-accent-gold" />
      <p className="text-[10px] font-semibold text-foreground/90 text-center leading-tight">{label}</p>
    </div>
  );
}

function pickAudience(diff: string): string[] {
  if (diff === "Architect") return [
    "Operators architecting multi-jurisdiction or multi-entity strategy.",
    "Leaders responsible for system-level decisions with long-tail consequences.",
    "Anyone who has hit the ceiling of standard advice.",
  ];
  if (diff === "Operator") return [
    "Practitioners moving from theory to disciplined execution.",
    "Founders, freelancers, and intrapreneurs ready for compounding decisions.",
  ];
  return [
    "Strategists building the foundational mental models.",
    "Curious learners who want application, not just exposure.",
  ];
}

function pickPrerequisites(diff: string, pillar: string): string[] {
  const out: string[] = [];
  if (diff === "Architect") out.push("Comfort with second-order thinking and trade-off analysis.");
  if (pillar === "ethical-finance") out.push("Basic literacy with personal income, expenses, and accounts.");
  if (pillar === "human-ai-symbiosis") out.push("Hands-on time with at least one frontier AI tool.");
  return out;
}

function pickCertValue(diff: string): string {
  if (diff === "Architect")
    return "Counts toward Architect-tier mastery. AI-validated through live application drills in the Mastery Arena and decision-protocol challenges. Awards a verifiable Wisdom Owl credential and unlocks downstream Wisdom God Core electives.";
  if (diff === "Operator")
    return "Counts toward Operator-tier mastery. Validated by performance in tied scenario drills. Earns a Wisdom Owl badge and feeds your personal Mastery Radar.";
  return "Builds your Strategist baseline — required scaffolding for higher-tier mastery and goal-aligned learning trajectories.";
}
