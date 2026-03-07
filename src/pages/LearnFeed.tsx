import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Loader2, Sparkles, Zap, Brain, BarChart3, SlidersHorizontal } from "lucide-react";
import FeedCard from "@/components/FeedCard";
import { STARTER_FEED, getSeenCardIds, markCardSeen, type FeedCard as FeedCardT } from "@/lib/feed-cards";
import { useProgress } from "@/hooks/useProgress";
import { useUserProfile } from "@/hooks/useUserProfile";
import { generateFeedCard } from "@/lib/ai-stream";
import HiddenOwl from "@/components/HiddenOwl";

type FeedMode = "normal" | "nerd" | "quick";

export default function LearnFeed() {
  const { progress, update } = useProgress();
  const { profile } = useUserProfile();
  const [cards, setCards] = useState<FeedCardT[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<FeedMode>("normal");
  const [showModePanel, setShowModePanel] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  // Initialize with unseen starter cards, shuffled by lowest-mastery categories first
  useEffect(() => {
    const seen = getSeenCardIds();
    const unseen = STARTER_FEED.filter(c => !seen.includes(c.id));
    const allCards = unseen.length > 0 ? unseen : [...STARTER_FEED]; // show all if all seen

    // Prioritize lowest mastery categories
    const scores = progress.masteryScores || {};
    allCards.sort((a, b) => (scores[a.category] || 0) - (scores[b.category] || 0));

    setCards(allCards);
  }, []);

  const handleComplete = useCallback((id: string, xp: number, tokens: number) => {
    markCardSeen(id);
    update(p => ({
      ...p,
      xp: p.xp + xp,
      tokens: p.tokens + tokens,
      lessonsToday: p.lessonsToday + 1,
    }));
  }, [update]);

  const loadMore = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const card = await generateFeedCard({
        mode,
        learningStyle: profile.learningStyle,
        excludeIds: cards.map(c => c.id),
      });
      setCards(prev => [...prev, card]);
    } catch (err) {
      console.error("Failed to generate feed card:", err);
    }
    setLoading(false);
    loadingRef.current = false;
  }, [mode, profile.learningStyle, cards]);

  // Auto-load when near bottom
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 600) {
        loadMore();
      }
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [loadMore]);

  const modeConfig: Record<FeedMode, { label: string; icon: React.ReactNode; desc: string }> = {
    normal: { label: "Normal", icon: <Brain className="h-4 w-4" />, desc: "Balanced learning drops" },
    nerd: { label: "Nerd Mode", icon: <BarChart3 className="h-4 w-4" />, desc: "More depth + diagrams + stats" },
    quick: { label: "Quick Mode", icon: <Zap className="h-4 w-4" />, desc: "Faster, shorter drops" },
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Sticky header */}
      <div className="flex-shrink-0 px-5 pt-12 pb-3 bg-background/90 backdrop-blur-xl z-10 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">Nerd Doomscroll</p>
            <p className="text-caption text-muted-foreground mt-0.5">Swipe. Learn. Level up.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-caption text-muted-foreground">
              <Sparkles className="h-3 w-3 text-accent-gold" /> {progress.tokens}
            </span>
            <button onClick={() => setShowModePanel(!showModePanel)}
              className="rounded-xl p-2 bg-surface-2 border border-border hover:border-primary/30 transition-colors">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Mode selector */}
        {showModePanel && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3 space-y-2">
            {(Object.keys(modeConfig) as FeedMode[]).map(m => (
              <button key={m} onClick={() => { setMode(m); setShowModePanel(false); }}
                className={`w-full flex items-center gap-3 rounded-xl p-3 text-left transition-all ${
                  mode === m ? "bg-primary/10 border border-primary/30" : "bg-surface-2 border border-border hover:border-primary/20"
                }`}>
                <span className={mode === m ? "text-primary" : "text-muted-foreground"}>{modeConfig[m].icon}</span>
                <div>
                  <p className="text-caption font-semibold text-foreground">{modeConfig[m].label}</p>
                  <p className="text-[10px] text-muted-foreground">{modeConfig[m].desc}</p>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </div>

      {/* Scroll container - snap scroll */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto snap-y snap-mandatory hide-scrollbar pb-24">
        {cards.map(card => (
          <FeedCard key={card.id} card={card} onComplete={handleComplete} />
        ))}

        {/* Loading */}
        {loading && (
          <div className="min-h-[50vh] snap-start flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
              <p className="text-caption text-muted-foreground">Generating new wisdom...</p>
            </div>
          </div>
        )}

        {/* Load more trigger */}
        <div className="snap-start flex items-center justify-center py-12">
          <button onClick={loadMore} disabled={loading}
            className="glass-card px-6 py-3 flex items-center gap-2 text-caption font-semibold text-primary hover:border-primary/30 transition-all">
            <Sparkles className="h-4 w-4" /> Generate More
          </button>
        </div>
      </div>
    </div>
  );
}
