import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { MASTERY_CATEGORIES, getLevelLabel } from "@/lib/data";
import ProgressRing from "@/components/ProgressRing";
import HiddenOwl from "@/components/HiddenOwl";

export default function LearnPaths() {
  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 pt-14 pb-6">
        <p className="section-label text-primary mb-2">Course Catalog</p>
        <h1 className="font-display text-h1 text-foreground">22 Category<br/>Tracks</h1>
        <p className="text-body text-muted-foreground mt-2">Full curriculum across every field. Tap to explore.</p>
      </div>

      <div className="editorial-divider mx-5 mb-6" />

      <div className="px-5 space-y-2">
        {MASTERY_CATEGORIES.map((cat, i) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02, duration: 0.3 }}
          >
            <Link to={`/category/${cat.id}`}
              className="glass-card p-4 flex items-center gap-3 hover:border-primary/20 transition-all duration-200 block">
              <span className="text-xl">{cat.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-body font-semibold text-foreground">{cat.name}</p>
                <p className="text-micro text-muted-foreground uppercase tracking-wider">
                  {getLevelLabel(cat.score)} · {cat.score}%
                </p>
              </div>
              <ProgressRing value={cat.score} size={36} strokeWidth={2.5} />
              <ChevronRight className="h-4 w-4 text-text-tertiary" />
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
