import { motion } from "framer-motion";
import { User, Wallet, BookOpen, Settings, Crown, ChevronRight, LogOut } from "lucide-react";

const MENU_ITEMS = [
  { icon: Wallet, label: "Wisdom Wallet", subtitle: "142 tokens", to: "#" },
  { icon: BookOpen, label: "My Learning", subtitle: "11 lessons completed", to: "#" },
  { icon: Crown, label: "Upgrade to Pro", subtitle: "Unlock all tracks", to: "#", accent: true },
  { icon: Settings, label: "Settings", subtitle: "Memory, notifications", to: "#" },
];

export default function Profile() {
  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 pt-12 pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-1">Profile</p>
        <h1 className="font-display text-2xl font-bold text-foreground">Your Journey</h1>
      </div>

      {/* User Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-5 mb-6 glass-card p-5 flex items-center gap-4"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <User className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-lg font-bold text-foreground">Learner</h2>
          <p className="text-xs text-muted-foreground">Builder · 7 day streak · Free Plan</p>
        </div>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 px-5 mb-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-3 text-center">
          <p className="font-display text-xl font-bold text-foreground">142</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Tokens</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-3 text-center">
          <p className="font-display text-xl font-bold text-foreground">7</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Streak</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-3 text-center">
          <p className="font-display text-xl font-bold text-foreground">5%</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Mastery</p>
        </motion.div>
      </div>

      {/* Menu */}
      <div className="px-5 space-y-2">
        {MENU_ITEMS.map((item, i) => (
          <motion.button
            key={item.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 + i * 0.05 }}
            className={`w-full glass-card p-4 flex items-center gap-3 text-left hover:border-primary/20 transition-colors ${
              item.accent ? "border-primary/20 glow-red" : ""
            }`}
          >
            <item.icon className={`h-5 w-5 ${item.accent ? "text-primary" : "text-muted-foreground"}`} />
            <div className="flex-1">
              <p className={`text-sm font-medium ${item.accent ? "text-primary" : "text-foreground"}`}>{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.subtitle}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-text-tertiary" />
          </motion.button>
        ))}
      </div>
    </div>
  );
}
