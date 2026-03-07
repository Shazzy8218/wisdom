import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { MASTERY_CATEGORIES, getLevelLabel } from "@/lib/data";
import { useProgress } from "@/hooks/useProgress";
import ProgressRing from "./ProgressRing";

export default function MasteryRadar() {
  const { progress } = useProgress();

  const categoriesWithScores = MASTERY_CATEGORIES.map(c => ({
    ...c,
    score: progress.masteryScores[c.id] || 0,
  }));

  const globalScore = categoriesWithScores.length > 0
    ? Math.round(categoriesWithScores.reduce((sum, c) => sum + c.score, 0) / categoriesWithScores.length)
    : 0;

  return (
    <div className="space-y-8">
      {/* Global score */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-3"
      >
        <ProgressRing value={globalScore} size={110} strokeWidth={3} />
        <span className="section-label">Global Mastery</span>
      </motion.div>

      <div className="editorial-divider" />

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3">
        {categoriesWithScores.map((cat, i) => {
          const isActive = cat.score > 0;
          return (
            <motion.div key={cat.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.025 }}>
              <Link
                to={`/category/${cat.id}`}
                className={`glass-card p-4 flex items-center gap-3 text-left transition-all duration-200 block ${
                  isActive ? "hover:border-primary/20" : "opacity-60 hover:opacity-80"
                }`}
              >
                <ProgressRing value={cat.score} size={42} strokeWidth={2.5} />
                <div className="min-w-0 flex-1">
                  <p className="text-caption font-semibold text-foreground truncate">{cat.name}</p>
                  <p className="text-micro text-muted-foreground uppercase tracking-wider">{getLevelLabel(cat.score)}</p>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
