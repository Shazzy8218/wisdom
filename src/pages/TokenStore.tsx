import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Crown } from "lucide-react";
import { CATEGORY_BUNDLES } from "@/lib/data";
import { useProgress } from "@/hooks/useProgress";
import { toast } from "@/hooks/use-toast";

const STORE_ITEMS = [
  { id: "s1", name: "Advanced Prompting Masterclass", type: "Course", tokens: 100, icon: "🎓" },
  { id: "s2", name: "Industry Playbook: Marketing", type: "Playbook", tokens: 150, icon: "📘" },
  { id: "s3", name: "Boss Challenge: Prompt Architecture", type: "Challenge", tokens: 75, icon: "🏆" },
  { id: "s4", name: "AI Workflow Templates Pack", type: "Templates", tokens: 120, icon: "⚡" },
  { id: "s5", name: "Industry Playbook: Finance", type: "Playbook", tokens: 150, icon: "📗" },
  { id: "s6", name: "Creative AI Deep Dive", type: "Course", tokens: 100, icon: "🎨" },
];

const UNLOCKED_KEY = "wisdom-unlocked-items";
function getUnlocked(): string[] {
  try { return JSON.parse(localStorage.getItem(UNLOCKED_KEY) || "[]"); } catch { return []; }
}

export default function TokenStore() {
  const { progress, update } = useProgress();
  const [unlocked, setUnlocked] = useState<string[]>(getUnlocked);

  const handlePurchase = (id: string, cost: number, name: string) => {
    if (unlocked.includes(id)) {
      toast({ title: "Already unlocked", description: `${name} is already available.` });
      return;
    }
    if (progress.tokens < cost) {
      toast({ title: "Not enough tokens", description: `You need ${cost - progress.tokens} more tokens.`, variant: "destructive" });
      return;
    }
    update(p => ({ ...p, tokens: p.tokens - cost }));
    const newUnlocked = [...unlocked, id];
    setUnlocked(newUnlocked);
    localStorage.setItem(UNLOCKED_KEY, JSON.stringify(newUnlocked));
    toast({ title: `Unlocked: ${name}`, description: `${cost} tokens spent.` });
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 pt-14 pb-6">
        <p className="section-label text-primary mb-2">Token Store</p>
        <h1 className="font-display text-h1 text-foreground">Unlock<br/>Knowledge</h1>
        <p className="text-body text-muted-foreground mt-2">Spend Wisdom Tokens to access premium content.</p>
      </div>

      {/* Balance */}
      <div className="px-5 mb-6">
        <div className="glass-card p-4 flex items-center gap-3 border-primary/20 glow-red">
          <span className="text-primary text-lg">✦</span>
          <span className="font-display text-h3 text-foreground">{progress.tokens}</span>
          <span className="section-label">Tokens Available</span>
        </div>
      </div>

      <div className="editorial-divider mx-5 mb-6" />

      {/* Category Bundles */}
      <div className="px-5 mb-6">
        <h2 className="section-label mb-4">Category Bundles</h2>
        <div className="space-y-2">
          {CATEGORY_BUNDLES.map((bundle, i) => {
            const isUnlocked = unlocked.includes(`bundle-${bundle.id}`);
            return (
              <motion.button key={bundle.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => handlePurchase(`bundle-${bundle.id}`, bundle.tokens, bundle.name)}
                className={`w-full glass-card p-5 flex items-center gap-4 text-left transition-all ${isUnlocked ? "border-accent-green/30" : "hover:border-primary/20"}`}>
                <Crown className={`h-5 w-5 shrink-0 ${isUnlocked ? "text-accent-green" : "text-accent-gold"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-body font-semibold text-foreground">{bundle.name}</p>
                  <p className="text-micro text-muted-foreground">{bundle.categories.length} categories</p>
                </div>
                {isUnlocked ? (
                  <span className="text-caption font-bold text-accent-green">Unlocked</span>
                ) : (
                  <div className="flex items-center gap-1 text-caption font-bold text-primary">
                    ✦ {bundle.tokens}
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="editorial-divider mx-5 mb-6" />

      {/* Individual Items */}
      <div className="px-5">
        <h2 className="section-label mb-4">Premium Content</h2>
        <div className="grid grid-cols-2 gap-3">
          {STORE_ITEMS.map((item, i) => {
            const isUnlocked = unlocked.includes(item.id);
            return (
              <motion.button key={item.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                onClick={() => handlePurchase(item.id, item.tokens, item.name)}
                className={`glass-card p-4 text-left flex flex-col gap-3 transition-all ${isUnlocked ? "border-accent-green/30" : "hover:border-primary/20"}`}>
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="text-caption font-semibold text-foreground leading-tight">{item.name}</p>
                  <p className="text-micro text-muted-foreground mt-1">{item.type}</p>
                </div>
                {isUnlocked ? (
                  <span className="text-micro font-bold text-accent-green mt-auto">Unlocked</span>
                ) : (
                  <div className="flex items-center gap-1 text-micro font-bold text-primary mt-auto">
                    ✦ {item.tokens}
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
