import { motion, AnimatePresence } from "framer-motion";

interface FeedbackBurstProps {
  type: "positive" | "negative" | null;
  onDone?: () => void;
}

/**
 * Micro-animation overlay for thumbs up/down feedback.
 * Positive: upward particles coalescing. Negative: brief glitch.
 */
export default function FeedbackBurst({ type, onDone }: FeedbackBurstProps) {
  if (!type) return null;

  return (
    <AnimatePresence>
      {type === "positive" && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          onAnimationComplete={onDone}
          className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl"
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ y: 30, x: 10 + i * 12, opacity: 0.8, scale: 1 }}
              animate={{ y: -40, opacity: 0, scale: 0.3 }}
              transition={{ duration: 0.6 + Math.random() * 0.3, delay: i * 0.04, ease: "easeOut" }}
              className="absolute bottom-0 w-1.5 h-1.5 rounded-full bg-accent-green"
            />
          ))}
        </motion.div>
      )}
      {type === "negative" && (
        <motion.div
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          onAnimationComplete={onDone}
          className="absolute inset-0 pointer-events-none rounded-xl"
          style={{
            background: "repeating-linear-gradient(90deg, transparent, transparent 4px, hsl(var(--primary) / 0.08) 4px, hsl(var(--primary) / 0.08) 6px)",
            animation: "none",
          }}
        />
      )}
    </AnimatePresence>
  );
}
