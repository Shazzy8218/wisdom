import { motion } from "framer-motion";
import type { PatternInsight } from "@/lib/analytics-engine";

interface Props {
  insight: PatternInsight;
  delay?: number;
}

export default function InsightCard({ insight, delay = 0 }: Props) {
  const bgMap: Record<string, string> = {
    strength: "bg-primary/5 border-primary/10",
    weakness: "bg-destructive/5 border-destructive/10",
    drift: "bg-accent-gold/5 border-accent-gold/10",
    habit: "bg-surface-2 border-border",
    opportunity: "bg-primary/5 border-primary/10",
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className={`rounded-2xl border p-3.5 ${bgMap[insight.type] || "bg-surface-2 border-border"}`}>
      <div className="flex items-start gap-2.5">
        <span className="text-base mt-0.5">{insight.icon}</span>
        <div className="min-w-0 flex-1">
          <p className="text-caption font-semibold text-foreground">{insight.title}</p>
          <p className="text-micro text-muted-foreground mt-0.5 leading-relaxed">{insight.body}</p>
        </div>
      </div>
    </motion.div>
  );
}
