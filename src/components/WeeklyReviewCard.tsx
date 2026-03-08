import { motion } from "framer-motion";
import { TrendingUp, AlertTriangle, Target, Flame, Coins } from "lucide-react";
import type { WeeklyReview } from "@/lib/analytics-engine";

interface Props {
  review: WeeklyReview;
  delay?: number;
}

export default function WeeklyReviewCard({ review, delay = 0 }: Props) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="glass-card p-5 border-primary/10">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h3 className="font-display text-sm font-bold text-foreground">Weekly Review</h3>
        <span className="text-micro text-muted-foreground ml-auto">{review.weekOf}</span>
      </div>

      <div className="space-y-3">
        {/* Stats row */}
        <div className="flex gap-3">
          <div className="flex-1 rounded-xl bg-surface-2 p-2.5 text-center">
            <Flame className="h-3.5 w-3.5 text-accent-gold mx-auto mb-0.5" />
            <p className="text-caption font-bold text-foreground">{review.streakSummary.split("—")[0].trim()}</p>
            <p className="text-micro text-muted-foreground">Streak</p>
          </div>
          <div className="flex-1 rounded-xl bg-surface-2 p-2.5 text-center">
            <Coins className="h-3.5 w-3.5 text-primary mx-auto mb-0.5" />
            <p className="text-caption font-bold text-foreground">{review.tokensSummary.split(" ")[0]}</p>
            <p className="text-micro text-muted-foreground">Tokens</p>
          </div>
          <div className="flex-1 rounded-xl bg-surface-2 p-2.5 text-center">
            <Target className="h-3.5 w-3.5 text-primary mx-auto mb-0.5" />
            <p className="text-caption font-bold text-foreground">{review.lessonsCompleted}</p>
            <p className="text-micro text-muted-foreground">Lessons</p>
          </div>
        </div>

        {/* Strengths */}
        {review.strengths.length > 0 && (
          <div>
            <p className="text-micro font-semibold text-muted-foreground uppercase tracking-wider mb-1">Strongest</p>
            <p className="text-caption text-foreground">{review.strengths.join(", ")}</p>
          </div>
        )}

        {/* Weaknesses */}
        {review.weaknesses.length > 0 && (
          <div>
            <p className="text-micro font-semibold text-muted-foreground uppercase tracking-wider mb-1">Needs Work</p>
            <p className="text-caption text-foreground">{review.weaknesses.join(", ")}</p>
          </div>
        )}

        {/* Goal drift */}
        {review.goalDrift && (
          <div className="flex items-start gap-2 rounded-xl bg-accent-gold/10 p-2.5">
            <AlertTriangle className="h-3.5 w-3.5 text-accent-gold shrink-0 mt-0.5" />
            <p className="text-caption text-foreground">{review.goalDrift}</p>
          </div>
        )}

        {/* Next focus */}
        <div className="rounded-xl bg-primary/5 p-2.5">
          <p className="text-micro font-semibold text-primary uppercase tracking-wider mb-0.5">Next Focus</p>
          <p className="text-caption text-foreground">{review.nextFocus}</p>
        </div>
      </div>
    </motion.div>
  );
}
