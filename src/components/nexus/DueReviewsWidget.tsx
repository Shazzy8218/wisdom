// CAE — Home dashboard widget. Total due reviews across the system.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Repeat2, ChevronRight } from "lucide-react";
import { getDueCount } from "@/lib/learning-optimizer";

export default function DueReviewsWidget() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(getDueCount());
    const i = setInterval(() => setCount(getDueCount()), 60_000);
    return () => clearInterval(i);
  }, []);

  if (count === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-5 mb-4"
    >
      <Link
        to="/nexus/review"
        className="flex items-center gap-3 glass-card p-3 border border-accent-gold/25 hover:border-accent-gold/50 transition-all"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-gold/15">
          <Repeat2 className="h-4 w-4 text-accent-gold" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-accent-gold">Memory Engraver</p>
          <p className="text-sm font-semibold text-foreground leading-tight">
            {count} review{count > 1 ? "s" : ""} due
          </p>
          <p className="text-[11px] text-muted-foreground">Spaced repetition keeps mastery permanent.</p>
        </div>
        <ChevronRight className="h-4 w-4 text-accent-gold" />
      </Link>
    </motion.div>
  );
}
