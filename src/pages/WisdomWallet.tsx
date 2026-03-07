import { motion } from "framer-motion";
import { Sparkles, TrendingUp, TrendingDown, Gift } from "lucide-react";
import StatBlock from "@/components/StatBlock";

const HISTORY = [
  { type: "earn", label: "Completed: 3-Part Prompt Formula", tokens: 10, date: "Today" },
  { type: "earn", label: "Daily Mission Complete", tokens: 25, date: "Today" },
  { type: "earn", label: "7-Day Streak Bonus", tokens: 50, date: "Yesterday" },
  { type: "spend", label: "Unlocked: AI for Money Track", tokens: -75, date: "2 days ago" },
  { type: "earn", label: "Hallucination Hunter: Level 2", tokens: 20, date: "3 days ago" },
  { type: "earn", label: "Completed: Constraint Prompting", tokens: 15, date: "3 days ago" },
  { type: "earn", label: "Weekly Feed Quest", tokens: 100, date: "Last week" },
  { type: "spend", label: "Unlocked: Boss Challenge", tokens: -50, date: "Last week" },
];

export default function WisdomWallet() {
  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 pt-14 pb-6">
        <p className="section-label text-primary mb-2">Wisdom Wallet</p>
        <h1 className="font-display text-h1 text-foreground">Your Tokens</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 px-5 mb-6">
        <StatBlock label="Balance" value={142} icon="✦" accent delay={0.1} />
        <StatBlock label="Earned Total" value={367} icon="📈" delay={0.15} />
      </div>

      {/* Milestone */}
      <div className="px-5 mb-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass-card p-5 border-accent-gold/20">
          <div className="flex items-center gap-3 mb-3">
            <Gift className="h-5 w-5 text-accent-gold" />
            <span className="section-label text-accent-gold">Next Milestone</span>
          </div>
          <p className="text-body text-foreground font-medium">Reach 200 tokens to unlock Business Power Bundle</p>
          <div className="mt-3 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
            <motion.div className="h-full rounded-full bg-accent-gold" initial={{ width: 0 }} animate={{ width: "71%" }} transition={{ duration: 1, delay: 0.4 }} />
          </div>
          <p className="text-micro text-muted-foreground mt-2">142 / 200 tokens</p>
        </motion.div>
      </div>

      <div className="editorial-divider mx-5 mb-6" />

      {/* History */}
      <div className="px-5">
        <h2 className="section-label mb-4">Transaction History</h2>
        <div className="space-y-2">
          {HISTORY.map((item, i) => (
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
              <span className={`font-display text-body font-bold ${item.tokens > 0 ? "text-accent-green" : "text-primary"}`}>
                {item.tokens > 0 ? "+" : ""}{item.tokens}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
