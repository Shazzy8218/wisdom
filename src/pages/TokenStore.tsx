import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Lock, Crown, ShoppingBag, ChevronLeft, Check, Loader2 } from "lucide-react";
import { CATEGORY_BUNDLES } from "@/lib/data";
import { useProgress } from "@/hooks/useProgress";
import { toast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";

const STORE_ITEMS = [
  { id: "s1", name: "Advanced Prompting Masterclass", type: "Course", tokens: 100, icon: "🎓", description: "Master advanced prompt engineering techniques." },
  { id: "s2", name: "Industry Playbook: Marketing", type: "Playbook", tokens: 150, icon: "📘", description: "AI-powered marketing strategies and templates." },
  { id: "s3", name: "Boss Challenge: Prompt Architecture", type: "Challenge", tokens: 75, icon: "🏆", description: "Test your prompt engineering skills." },
  { id: "s4", name: "AI Workflow Templates Pack", type: "Templates", tokens: 120, icon: "⚡", description: "Ready-to-use AI workflow templates." },
  { id: "s5", name: "Industry Playbook: Finance", type: "Playbook", tokens: 150, icon: "📗", description: "AI applications for financial analysis." },
  { id: "s6", name: "Creative AI Deep Dive", type: "Course", tokens: 100, icon: "🎨", description: "Unlock creative AI capabilities." },
];

export default function TokenStore() {
  const { progress, update } = useProgress();
  const navigate = useNavigate();
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const unlocked = progress.unlockedItems || [];

  const handlePurchase = async (id: string, cost: number, name: string) => {
    if (unlocked.includes(id)) {
      toast({ title: "Already unlocked", description: `${name} is in your Library.` });
      return;
    }
    if (progress.tokens < cost) {
      toast({ title: "Not enough tokens", description: `You need ${cost - progress.tokens} more tokens.`, variant: "destructive" });
      return;
    }

    setPurchasing(id);

    // Small delay for UX feel
    await new Promise(r => setTimeout(r, 600));

    update(p => ({
      ...p,
      tokens: p.tokens - cost,
      unlockedItems: [...(p.unlockedItems || []), id],
      tokenHistory: [
        ...p.tokenHistory,
        { action: `Purchased: ${name}`, amount: -cost, date: new Date().toISOString() },
      ],
    }));

    setPurchasing(null);
    toast({ title: `✅ Unlocked: ${name}`, description: "Available in Library → My Courses" });
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1 rounded-lg hover:bg-muted/50 transition-colors">
          <ChevronLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <div>
          <p className="text-xs font-medium text-primary uppercase tracking-wider mb-1">Token Store</p>
          <h1 className="font-display text-2xl font-bold text-foreground">Unlock Knowledge</h1>
        </div>
      </div>

      {/* Balance */}
      <div className="px-5 mb-6">
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-center gap-3">
          <span className="text-primary text-lg">✦</span>
          <span className="font-display text-2xl font-bold text-foreground">{progress.tokens}</span>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tokens Available</span>
        </div>
      </div>

      {/* Category Bundles */}
      <div className="px-5 mb-6">
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Category Bundles</h2>
        <div className="space-y-2">
          {CATEGORY_BUNDLES.map((bundle, i) => {
            const itemId = `bundle-${bundle.id}`;
            const isUnlocked = unlocked.includes(itemId);
            const isPurchasing = purchasing === itemId;
            return (
              <motion.button key={bundle.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => handlePurchase(itemId, bundle.tokens, bundle.name)}
                disabled={isPurchasing}
                className={`w-full rounded-2xl border p-4 flex items-center gap-4 text-left transition-all ${
                  isUnlocked ? "border-green-500/20 bg-green-500/5" : "border-border bg-card hover:border-primary/20"
                }`}>
                <Crown className={`h-5 w-5 shrink-0 ${isUnlocked ? "text-green-500" : "text-amber-500"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{bundle.name}</p>
                  <p className="text-xs text-muted-foreground">{bundle.categories.length} categories</p>
                </div>
                {isPurchasing ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : isUnlocked ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-green-500"><Check className="h-3.5 w-3.5" /> Owned</span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-bold text-primary">✦ {bundle.tokens}</span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="mx-5 h-px bg-border mb-6" />

      {/* Individual Items */}
      <div className="px-5">
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Premium Content</h2>
        <div className="grid grid-cols-2 gap-3">
          {STORE_ITEMS.map((item, i) => {
            const isUnlocked = unlocked.includes(item.id);
            const isPurchasing = purchasing === item.id;
            return (
              <motion.button key={item.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                onClick={() => handlePurchase(item.id, item.tokens, item.name)}
                disabled={isPurchasing}
                className={`rounded-2xl border p-4 text-left flex flex-col gap-3 transition-all ${
                  isUnlocked ? "border-green-500/20 bg-green-500/5" : "border-border bg-card hover:border-primary/20"
                }`}>
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="text-xs font-semibold text-foreground leading-tight">{item.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{item.type}</p>
                </div>
                {isPurchasing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary mt-auto" />
                ) : isUnlocked ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-green-500 mt-auto"><Check className="h-3 w-3" /> Owned</span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-primary mt-auto">✦ {item.tokens}</span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Link to My Courses */}
      {unlocked.length > 0 && (
        <div className="px-5 mt-6">
          <Link to="/library" className="flex items-center justify-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 p-3 text-sm font-medium text-primary hover:bg-primary/10 transition-colors">
            <ShoppingBag className="h-4 w-4" /> View My Courses in Library
          </Link>
        </div>
      )}
    </div>
  );
}
