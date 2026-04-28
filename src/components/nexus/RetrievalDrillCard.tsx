// CAE — Inline Retrieval Drill Card. Shown atop NexusModuleView when reviews are due.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Repeat2, X, ChevronRight } from "lucide-react";
import { getDueReviewsForModule, type ReviewItem } from "@/lib/learning-optimizer";

export default function RetrievalDrillCard({ moduleId }: { moduleId: string }) {
  const navigate = useNavigate();
  const [due, setDue] = useState<ReviewItem[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDue(getDueReviewsForModule(moduleId));
    const i = setInterval(() => setDue(getDueReviewsForModule(moduleId)), 30_000);
    return () => clearInterval(i);
  }, [moduleId]);

  if (dismissed || due.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="mx-5 mt-4 glass-card p-3 border border-accent-gold/30 bg-gradient-to-br from-accent-gold/[0.08] to-transparent flex items-center gap-3"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-gold/15 shrink-0">
          <Repeat2 className="h-4 w-4 text-accent-gold" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-accent-gold">Retrieval Strengthener</p>
          <p className="text-xs text-foreground/90 leading-snug truncate">
            {due.length} review{due.length > 1 ? "s" : ""} due for this module — engrave it in long-term memory.
          </p>
        </div>
        <button
          onClick={() => navigate(`/nexus/review?module=${encodeURIComponent(moduleId)}`)}
          className="rounded-lg bg-accent-gold/90 hover:bg-accent-gold text-background text-[11px] font-bold px-2.5 py-1.5 flex items-center gap-1 transition-colors"
        >
          Drill <ChevronRight className="h-3 w-3" />
        </button>
        <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground transition-colors p-1">
          <X className="h-3.5 w-3.5" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
