import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Loader2, Zap, Brain, BarChart3, SlidersHorizontal, RefreshCw } from "lucide-react";
import FeedCard from "@/components/FeedCard";
import { STARTER_FEED, getSeenCardIds, markCardSeen, type FeedCard as FeedCardT } from "@/lib/feed-cards";
import { useProgress } from "@/hooks/useProgress";
import { useUserProfile } from "@/hooks/useUserProfile";
import { generateFeedCard } from "@/lib/ai-stream";
import HiddenOwl from "@/components/HiddenOwl";
import { Skeleton } from "@/components/ui/skeleton";

type FeedMode = "normal" | "nerd" | "quick";

export default function LearnFeed() {
  const { progress, update } = useProgress();
  const { profile } = useUserProfile();
  const [cards, setCards] = useState<FeedCardT[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<FeedMode>("normal");
  const [showModePanel, setShowModePanel] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  // Always start fresh on open — show unseen starters first, then generate new
  useEffect(() => {
    const seen = getSeenCardIds();
    const unseen = STARTER_FEED.filter(c => !seen.includes(c.id));
    const scores = progress.masteryScores || {};

    if (unseen.length > 0) {
      // Sort by lowest mastery for personalization
      unseen.sort((a, b) => (scores[a.category] || 0) - (scores[b.category] || 0));
      setCards(unseen.slice(0, 10));
      setInitialLoading(false);
      // Also pre-generate 2 fresh AI cards
      generateBatch(2);
    } else {
      // All starter cards seen — generate fresh ones immediately
      setCards([]);
      generateBatch(4);
    }

    // Always scroll to top
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: 0 });
    }, 50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateBatch = useCallback(async (count: number) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);

    const seen = getSeenCardIds();
    const newCards: FeedCardT[] = [];

    for (let i = 0; i < count; i++) {
      try {
        const card = await generateFeedCard({
          mode,
          learningStyle: profile.learningStyle,
          excludeIds: [...seen, ...newCards.map(c => c.id)],
        });
        if (card && card.id) {
          newCards.push(card);
        }
      } catch (err) {
        console.error("Failed to generate feed card:", err);
        if (i === 0) {
          setError(err instanceof Error ? err.message : "Failed to generate content");
        }
        break;
      }
    }

    if (newCards.length > 0) {
      setCards(prev => [...prev, ...newCards]);
      setError(null);
    }
    setLoading(false);
    setInitialLoading(false);
    loadingRef.current = false;
  }, [mode, profile.learningStyle]);

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
    await generateBatch(2);
  }, [generateBatch]);

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
    <div className="flex flex-col bg-background min-h-0" style={{ height: "calc(100vh - 7rem)" }}>
      {/* Sticky header */}
      <div className="flex-shrink-0 px-5 pt-4 pb-3 bg-background/90 backdrop-blur-xl z-10 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">Nerd Doomscroll</p>
            <p className="text-caption text-muted-foreground mt-0.5">Swipe. Learn. Level up.</p>
          </div>
          <div className="flex items-center gap-3">
            <HiddenOwl locationId="feed-header" size={16} />
            <span className="flex items-center gap-1 text-caption text-muted-foreground">
              ✦ {progress.tokens}
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

      {/* Scroll container */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto snap-y snap-mandatory hide-scrollbar pb-4">
        {/* Initial loading skeleton */}
        {initialLoading && cards.length === 0 && (
          <div className="min-h-[calc(100vh-8rem)] snap-start flex flex-col justify-center px-4 py-6">
            <div className="glass-card max-w-lg mx-auto w-full p-5 space-y-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          </div>
        )}

        {/* Cards */}
        {cards.map(card => (
          <FeedCard key={card.id} card={card} onComplete={handleComplete} />
        ))}

        {/* Error state */}
        {error && !loading && (
          <div className="min-h-[50vh] snap-start flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-center px-8">
              <p className="text-caption text-destructive">{error}</p>
              <button onClick={() => generateBatch(2)}
                className="glass-card px-6 py-3 flex items-center gap-2 text-caption font-semibold text-primary hover:border-primary/30 transition-all">
                <RefreshCw className="h-4 w-4" /> Tap to retry
              </button>
            </div>
          </div>
        )}

        {/* Loading more */}
        {loading && !initialLoading && (
          <div className="min-h-[50vh] snap-start flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
              <p className="text-caption text-muted-foreground">Generating new wisdom...</p>
            </div>
          </div>
        )}

        {/* Load more trigger — only if not loading and has cards */}
        {!loading && cards.length > 0 && (
          <div className="snap-start flex items-center justify-center py-12">
            <button onClick={() => generateBatch(2)} disabled={loading}
              className="glass-card px-6 py-3 flex items-center gap-2 text-caption font-semibold text-primary hover:border-primary/30 transition-all">
              ✦ Generate More
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
