import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Gift } from "lucide-react";
import StatBlock from "@/components/StatBlock";
import { useProgress } from "@/hooks/useProgress";
import { getOwlHuntStatus } from "@/lib/owl-hunt";

export default function WisdomWallet() {
  const { progress } = useProgress();
  const owlState = getOwlHuntStatus();

  // Build transaction history from actual progress data
  const history: { type: string; label: string; tokens: number; date: string }[] = [];

  if (progress.completedLessons.length > 0) {
    progress.completedLessons.slice(-5).forEach((id, i) => {
      history.push({ type: "earn", label: `Completed lesson: ${id.split(":").slice(0, 2).join(" ")}`, tokens: 10, date: i === 0 ? "Today" : `${i + 1} days ago` });
    });
  }

  if (owlState.claimed > 0) {
    history.push({ type: "earn", label: `Owl Hunt: ${owlState.claimed}/3 found today`, tokens: owlState.claimed * 3, date: "Today" });
  }

  if (progress.streak > 0) {
    history.push({ type: "earn", label: `${progress.streak}-day streak active`, tokens: 0, date: "Ongoing" });
  }

  if (history.length === 0) {
    history.push({ type: "earn", label: "Start completing lessons to earn tokens!", tokens: 0, date: "—" });
  }

  const nextMilestone = progress.tokens < 50 ? 50 : progress.tokens < 100 ? 100 : progress.tokens < 200 ? 200 : 500;
  const milestoneProgress = Math.min(100, (progress.tokens / nextMilestone) * 100);

  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 pt-14 pb-6">
        <p className="section-label text-primary mb-2">Wisdom Wallet</p>
        <h1 className="font-display text-h1 text-foreground">Your Tokens</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 px-5 mb-6">
        <StatBlock label="Balance" value={progress.tokens} icon="✦" accent delay={0.1} />
        <StatBlock label="XP Earned" value={progress.xp} icon="⚡" delay={0.15} />
      </div>

      {/* Milestone */}
      <div className="px-5 mb-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass-card p-5 border-accent-gold/20">
          <div className="flex items-center gap-3 mb-3">
            <Gift className="h-5 w-5 text-accent-gold" />
            <span className="section-label text-accent-gold">Next Milestone</span>
          </div>
          <p className="text-body text-foreground font-medium">Reach {nextMilestone} tokens</p>
          <div className="mt-3 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
            <motion.div className="h-full rounded-full bg-accent-gold" initial={{ width: 0 }} animate={{ width: `${milestoneProgress}%` }} transition={{ duration: 1, delay: 0.4 }} />
          </div>
          <p className="text-micro text-muted-foreground mt-2">{progress.tokens} / {nextMilestone} tokens</p>
        </motion.div>
      </div>

      <div className="editorial-divider mx-5 mb-6" />

      {/* Owl Hunt Status */}
      <div className="px-5 mb-6">
        <div className="glass-card p-4 flex items-center gap-3">
          <span className="text-lg">🦉</span>
          <div className="flex-1">
            <p className="text-caption font-medium text-foreground">Daily Owl Hunt</p>
            <p className="text-micro text-muted-foreground">{owlState.claimed}/3 found today · +{owlState.claimed * 3} tokens</p>
          </div>
        </div>
      </div>

      <div className="editorial-divider mx-5 mb-6" />

      {/* History */}
      <div className="px-5">
        <h2 className="section-label mb-4">Activity Log</h2>
        <div className="space-y-2">
          {history.map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.03 }}
              className="glass-card p-4 flex items-center gap-3">
              {item.type === "earn" ? (
                <TrendingUp className="h-4 w-4 text-accent-green shrink-0" />
              ) : (
                <TrendingDown className="h-4 w-4 text-primary shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-caption text-foreground truncate">{item.label}</p>
                <p className="text-micro text-muted-foreground">{item.date}</p>
              </div>
              {item.tokens > 0 && (
                <span className={`font-display text-body font-bold ${item.tokens > 0 ? "text-accent-green" : "text-primary"}`}>
                  +{item.tokens}
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
