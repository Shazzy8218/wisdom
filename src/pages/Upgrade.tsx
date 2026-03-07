import { motion } from "framer-motion";
import { Check, Zap, Crown } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { toast } from "@/hooks/use-toast";

const FREE_FEATURES = [
  "5 daily AI messages",
  "1-2 learning tracks",
  "Basic feed access",
  "Standard token earning",
  "Community games",
];

const PRO_FEATURES = [
  "50 daily AI messages",
  "All 22 learning tracks",
  "Infinite feed + categories",
  "2x token earning (Boost)",
  "All category hubs & bundles",
  "Prompt Playground + exports",
  "Personal Playbook PDF",
  "Boss challenges",
  "Priority AI (faster)",
];

export default function Upgrade() {
  const { profile, updateProfile } = useUserProfile();
  const isPro = profile.plan === "pro";

  const handleUpgrade = () => {
    // Stub: In production, this would open a payment flow
    toast({
      title: "Coming Soon",
      description: "In-app purchases will be available in the next update. Stay tuned!",
    });
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 pt-14 pb-6 text-center">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <p className="section-label text-primary mb-2">Upgrade</p>
          <h1 className="font-display text-h1 text-foreground">Unlock Your<br/>Full Potential</h1>
          <p className="text-body text-muted-foreground mt-3">Learn faster. Earn more tokens. Master AI.</p>
        </motion.div>
      </div>

      <div className="px-5 space-y-4">
        {/* Free Plan */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className={`glass-card p-6 ${!isPro ? "border-primary/20" : ""}`}>
          <div className="flex items-center gap-3 mb-4">
            <Zap className="h-5 w-5 text-muted-foreground" />
            <div>
              <h2 className="font-display text-h3 text-foreground">Free</h2>
              <p className="text-caption text-muted-foreground">Get started learning</p>
            </div>
          </div>
          <p className="font-display text-h1 text-foreground mb-4">$0<span className="text-caption text-muted-foreground font-normal">/month</span></p>
          <div className="space-y-2.5">
            {FREE_FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-2.5 text-caption text-muted-foreground">
                <Check className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                {f}
              </div>
            ))}
          </div>
          <button disabled className="mt-5 w-full rounded-2xl border border-border bg-surface-2 py-3 text-body font-semibold text-muted-foreground">
            {!isPro ? "Current Plan" : "Free Plan"}
          </button>
        </motion.div>

        {/* Pro Plan */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className={`glass-card p-6 relative overflow-hidden ${isPro ? "border-accent-green/30" : "border-primary/30 glow-red"}`}>
          {!isPro && (
            <div className="absolute top-4 right-4">
              <span className="rounded-full bg-primary px-3 py-1 text-micro font-bold text-primary-foreground uppercase tracking-wider">Popular</span>
            </div>
          )}
          <div className="flex items-center gap-3 mb-4">
            <Crown className={`h-5 w-5 ${isPro ? "text-accent-green" : "text-primary"}`} />
            <div>
              <h2 className="font-display text-h3 text-foreground">Pro</h2>
              <p className="text-caption text-muted-foreground">Master AI faster</p>
            </div>
          </div>
          <p className="font-display text-h1 text-foreground mb-1">$9.99<span className="text-caption text-muted-foreground font-normal">/month</span></p>
          <p className="text-micro text-muted-foreground mb-4">Cancel anytime</p>
          <div className="space-y-2.5">
            {PRO_FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-2.5 text-caption text-foreground">
                <Check className={`h-3.5 w-3.5 shrink-0 ${isPro ? "text-accent-green" : "text-primary"}`} />
                {f}
              </div>
            ))}
          </div>
          {isPro ? (
            <button disabled className="mt-5 w-full rounded-2xl border border-accent-green/30 bg-accent-green/10 py-3.5 text-body font-bold text-accent-green">
              ✓ Pro Active
            </button>
          ) : (
            <button onClick={handleUpgrade} className="mt-5 w-full rounded-2xl bg-primary py-3.5 text-body font-bold text-primary-foreground transition-opacity hover:opacity-90">
              Upgrade to Pro
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
