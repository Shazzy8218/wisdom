import { motion, AnimatePresence } from "framer-motion";
import { Trophy } from "lucide-react";

interface MilestoneFlashProps {
  show: boolean;
  title?: string;
  onDone?: () => void;
}

/**
 * Full-screen milestone celebration overlay.
 * Triggers on major goal completions with particle burst effect.
 */
export default function MilestoneFlash({ show, title = "Milestone Achieved!", onDone }: MilestoneFlashProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onAnimationComplete={() => setTimeout(onDone, 2000)}
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
        >
          {/* Radial flash */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 4, opacity: [0, 0.3, 0] }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute w-40 h-40 rounded-full"
            style={{ background: "radial-gradient(circle, hsl(45 90% 55% / 0.5), transparent)" }}
          />

          {/* Particles */}
          {Array.from({ length: 16 }).map((_, i) => {
            const angle = (i / 16) * Math.PI * 2;
            const dist = 120 + Math.random() * 80;
            return (
              <motion.div
                key={i}
                initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                animate={{
                  scale: [0, 1.5, 0],
                  x: Math.cos(angle) * dist,
                  y: Math.sin(angle) * dist,
                  opacity: [1, 1, 0],
                }}
                transition={{ duration: 1 + Math.random() * 0.5, ease: "easeOut", delay: Math.random() * 0.2 }}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  background: i % 3 === 0
                    ? "hsl(var(--accent-gold))"
                    : i % 3 === 1
                    ? "hsl(var(--primary))"
                    : "hsl(var(--accent-green))",
                }}
              />
            );
          })}

          {/* Central badge */}
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
            className="flex flex-col items-center gap-3"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent-gold/20 border-2 border-accent-gold/40 glow-gold">
              <Trophy className="h-10 w-10 text-accent-gold" />
            </div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="font-display text-lg font-bold text-foreground text-center"
            >
              {title}
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
