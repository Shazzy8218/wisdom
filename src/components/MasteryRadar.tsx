import { motion } from "framer-motion";
import { MASTERY_CATEGORIES, getLevelLabel } from "@/lib/data";
import ProgressRing from "./ProgressRing";

export default function MasteryRadar() {
  const globalScore = Math.round(
    MASTERY_CATEGORIES.reduce((sum, c) => sum + c.score, 0) / MASTERY_CATEGORIES.length
  );

  return (
    <div className="space-y-6">
      {/* Global score */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-2"
      >
        <ProgressRing value={globalScore} size={96} strokeWidth={4} />
        <span className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Global Mastery
        </span>
      </motion.div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3">
        {MASTERY_CATEGORIES.map((cat, i) => (
          <motion.button
            key={cat.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="glass-card p-3 flex items-center gap-3 text-left hover:border-primary/20 transition-colors"
          >
            <ProgressRing value={cat.score} size={40} strokeWidth={2.5} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-foreground truncate">{cat.name}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{getLevelLabel(cat.score)}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
