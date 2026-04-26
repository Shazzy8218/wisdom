// MANIFESTATION ORB — Holographic, pulsing visualization of the user's
// active HAOS goal. Color shifts with progress; complexity grows with milestones.

import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Target, ArrowRight } from "lucide-react";
import { useGoals } from "@/hooks/useGoals";

export default function ManifestationOrb() {
  const { primaryGoal } = useGoals();

  const pct = useMemo(() => {
    if (!primaryGoal || primaryGoal.targetValue <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((primaryGoal.currentValue / primaryGoal.targetValue) * 100)));
  }, [primaryGoal]);

  const milestonesDone = useMemo(() => {
    if (!primaryGoal?.roadmap) return 0;
    return primaryGoal.roadmap.filter(s => s.done).length;
  }, [primaryGoal]);

  // Color shifts: red-amber → primary → green as goal advances
  const stops = pct < 33
    ? ["hsl(var(--primary))", "hsl(var(--accent-gold))"]
    : pct < 66
    ? ["hsl(var(--primary))", "hsl(var(--accent-gold))", "hsl(var(--accent-green))"]
    : ["hsl(var(--accent-gold))", "hsl(var(--accent-green))"];

  if (!primaryGoal) {
    return (
      <Link to="/goals" className="block px-5">
        <div className="glass-card p-5 border border-border/40 hover:border-primary/30 transition-all">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-muted/40 to-muted/10 flex items-center justify-center shrink-0">
              <Target className="h-5 w-5 text-muted-foreground" strokeWidth={1.6} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Goal Manifestation Orb</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">No active goal — anchor one to begin manifesting.</p>
            </div>
            <ArrowRight className="h-4 w-4 text-primary" />
          </div>
        </div>
      </Link>
    );
  }

  return (
    <section className="px-5">
      <div className="flex items-center gap-2 mb-2">
        <Target className="h-3.5 w-3.5 text-primary" />
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Goal Manifestation Orb</p>
      </div>

      <Link to="/goals" className="block glass-card p-5 hover:border-primary/30 transition-all">
        <div className="flex items-center gap-5">
          {/* The Orb */}
          <div className="relative shrink-0" style={{ width: 92, height: 92 }}>
            {/* Outer pulse rings — count grows with milestones */}
            {Array.from({ length: Math.min(3, milestonesDone + 1) }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full"
                style={{ border: `1px solid ${stops[stops.length - 1]}`, opacity: 0.25 - i * 0.06 }}
                animate={{ scale: [1, 1.15, 1], opacity: [0.25 - i * 0.06, 0.05, 0.25 - i * 0.06] }}
                transition={{ duration: 3 + i * 0.6, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
              />
            ))}

            {/* Orb body */}
            <motion.div
              className="absolute inset-2 rounded-full backdrop-blur"
              style={{
                background: `radial-gradient(circle at 30% 30%, ${stops[0]} 0%, ${stops[stops.length - 1]} 70%, hsl(var(--background)) 100%)`,
                boxShadow: `0 0 40px ${stops[stops.length - 1]}50, inset 0 0 20px ${stops[0]}30`,
              }}
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Progress ring */}
            <svg className="absolute inset-0" viewBox="0 0 92 92">
              <circle cx="46" cy="46" r="42" fill="none" stroke="hsl(var(--border))" strokeWidth="2" opacity="0.3" />
              <motion.circle
                cx="46" cy="46" r="42" fill="none"
                stroke={stops[stops.length - 1]} strokeWidth="2.5" strokeLinecap="round"
                strokeDasharray={`${(pct / 100) * 263.9} 263.9`}
                transform="rotate(-90 46 46)"
                initial={{ strokeDasharray: "0 263.9" }}
                animate={{ strokeDasharray: `${(pct / 100) * 263.9} 263.9` }}
                transition={{ duration: 1.4, ease: "easeOut" }}
              />
            </svg>

            {/* Center label */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="font-display text-lg font-bold text-foreground tabular-nums" style={{ textShadow: "0 0 8px hsl(var(--background))" }}>
                {pct}%
              </span>
            </div>
          </div>

          {/* Right-side details */}
          <div className="flex-1 min-w-0">
            <p className="font-display text-base font-bold text-foreground leading-tight line-clamp-2">{primaryGoal.title}</p>
            <div className="flex items-center gap-3 mt-2 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/80">
              <span>{primaryGoal.currentValue} / {primaryGoal.targetValue} {primaryGoal.targetMetric}</span>
              {milestonesDone > 0 && <span>· {milestonesDone} milestone{milestonesDone === 1 ? "" : "s"}</span>}
            </div>
            <p className="text-[11px] text-primary mt-2 flex items-center gap-1 font-semibold">
              View Mission Control <ArrowRight className="h-3 w-3" />
            </p>
          </div>
        </div>
      </Link>
    </section>
  );
}
