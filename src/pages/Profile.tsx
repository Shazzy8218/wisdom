import { motion } from "framer-motion";
import { User, Wallet, BookOpen, Settings, Crown, ChevronRight } from "lucide-react";

const MENU_ITEMS = [
  { icon: Wallet, label: "Wisdom Wallet", subtitle: "142 tokens", to: "#" },
  { icon: BookOpen, label: "My Learning", subtitle: "11 lessons completed", to: "#" },
  { icon: Crown, label: "Upgrade to Pro", subtitle: "Unlock all tracks", to: "#", accent: true },
  { icon: Settings, label: "Settings", subtitle: "Memory, notifications", to: "#" },
];

export default function Profile() {
  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 pt-14 pb-6">
        <p className="section-label text-primary mb-2">Profile</p>
        <h1 className="font-display text-h1 text-foreground">Your Journey</h1>
      </div>

      {/* User Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-5 mb-6 glass-card p-6 flex items-center gap-4"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <User className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-h3 text-foreground">Learner</h2>
          <p className="text-caption text-muted-foreground">Builder · 7 day streak · Free Plan</p>
        </div>
      </motion.div>

      <div className="editorial-divider mx-5 mb-6" />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 px-5 mb-6">
        {[
          { val: "142", label: "Tokens" },
          { val: "7", label: "Streak" },
          { val: "5%", label: "Mastery" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className="glass-card p-4 text-center"
          >
            <p className="font-display text-h2 text-foreground">{s.val}</p>
            <p className="section-label mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="editorial-divider mx-5 mb-6" />

      {/* Menu */}
      <div className="px-5 space-y-2">
        {MENU_ITEMS.map((item, i) => (
          <motion.button
            key={item.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 + i * 0.05 }}
            className={`w-full glass-card p-5 flex items-center gap-4 text-left transition-all duration-200 ${
              item.accent ? "border-primary/20 glow-red hover:border-primary/40" : "hover:border-primary/10"
            }`}
          >
            <item.icon className={`h-5 w-5 ${item.accent ? "text-primary" : "text-text-tertiary"}`} strokeWidth={1.5} />
            <div className="flex-1">
              <p className={`text-body font-medium ${item.accent ? "text-primary" : "text-foreground"}`}>{item.label}</p>
              <p className="text-caption text-muted-foreground">{item.subtitle}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-text-tertiary" />
          </motion.button>
        ))}
      </div>
    </div>
  );
}
