import { motion } from "framer-motion";
import { Crown, Sparkles, Rocket } from "lucide-react";
import { Link } from "react-router-dom";

const FEATURES = [
  "Unlimited AI coaching sessions",
  "All 22+ learning tracks",
  "Full Wisdom Vault access",
  "Speed Mode & Blueprints",
  "2x token earning boost",
  "Priority AI responses",
  "Personal Playbook exports",
  "Boss challenges & advanced drills",
];

export default function Upgrade() {
  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 pt-14 pb-6 text-center">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex justify-center mb-4">
            <div className="h-14 w-14 rounded-2xl bg-accent-gold/10 flex items-center justify-center">
              <Crown className="h-7 w-7 text-accent-gold" />
            </div>
          </div>
          <h1 className="font-display text-h1 text-foreground">Full Access</h1>
          <p className="text-body text-muted-foreground mt-3 max-w-xs mx-auto">
            You currently have full access to every feature. Enjoy the complete Wisdom Owl experience.
          </p>
        </motion.div>
      </div>

      <div className="px-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-card p-6 border-accent-gold/20">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-accent-gold" />
            <p className="section-label text-accent-gold">What's included</p>
          </div>
          <div className="space-y-3">
            {FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-2.5 text-caption text-foreground">
                <Rocket className="h-3.5 w-3.5 text-accent-gold shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass-card p-5 mt-4 text-center border-border">
          <p className="text-caption text-muted-foreground">
            Paid subscription plans coming soon. You'll be notified when they launch.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="mt-6 text-center">
          <Link to="/" className="text-caption text-primary font-medium hover:underline">
            ← Back to Chat
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
