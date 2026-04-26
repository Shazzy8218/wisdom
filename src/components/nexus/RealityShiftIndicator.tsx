// REALITY SHIFT INDICATOR — Subtle on-completion celebratory cue.
// Triggered after a flagship is marked complete. Shows the projected goal lift
// and dispatches an Owl voice acknowledgement.

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, TrendingUp, X } from "lucide-react";
import { requestOwlReplay } from "@/lib/owl-voice";
import { useGoals } from "@/hooks/useGoals";

interface Props {
  open: boolean;
  moduleTitle: string;
  goalContributionPct: number;
  onClose: () => void;
}

export default function RealityShiftIndicator({ open, moduleTitle, goalContributionPct, onClose }: Props) {
  const { primaryGoal } = useGoals();
  const [voiceFired, setVoiceFired] = useState(false);

  useEffect(() => {
    if (!open || voiceFired) return;
    setVoiceFired(true);
    const goalPart = primaryGoal ? ` Your ${primaryGoal.title.slice(0, 60)} probability lifted by ${goalContributionPct} percent.` : "";
    requestOwlReplay(`Reality shift detected. ${moduleTitle} is mastered.${goalPart} Hold the line.`, true);
  }, [open, voiceFired, moduleTitle, goalContributionPct, primaryGoal]);

  // Auto-dismiss after 6s
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(onClose, 6000);
    return () => clearTimeout(t);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 pointer-events-none flex items-end sm:items-center justify-center p-4"
        >
          <motion.div
            initial={{ y: 30, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 22, stiffness: 260 }}
            className="pointer-events-auto relative max-w-md w-full glass-card p-5 border border-accent-gold/40 bg-gradient-to-br from-accent-gold/[0.08] via-primary/[0.05] to-transparent shadow-2xl"
          >
            {/* Ambient pulse */}
            <motion.div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{ boxShadow: "0 0 60px hsl(var(--accent-gold) / 0.4)" }}
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />

            <button
              onClick={onClose}
              className="absolute top-3 right-3 h-7 w-7 rounded-lg bg-background/40 backdrop-blur flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-3.5 w-3.5 text-accent-gold" />
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent-gold">Reality Shift Detected</p>
            </div>

            <p className="font-display text-lg font-bold text-foreground leading-tight">{moduleTitle}</p>
            <p className="text-xs text-muted-foreground mt-1 italic">— mastered. The fabric responds.</p>

            {primaryGoal && (
              <div className="mt-4 rounded-xl bg-background/50 backdrop-blur p-3 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-accent-green/15 flex items-center justify-center shrink-0">
                  <TrendingUp className="h-4 w-4 text-accent-green" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Goal probability lift</p>
                  <p className="text-sm font-semibold text-foreground line-clamp-1">{primaryGoal.title}</p>
                </div>
                <p className="font-display text-xl font-bold text-accent-green tabular-nums">+{goalContributionPct}%</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
