import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Loader2, RefreshCw } from "lucide-react";
import FeedCard from "@/components/FeedCard";
import { STARTER_FEED, markCardSeen, type FeedCard as FeedCardT } from "@/lib/feed-cards";
import { useProgress } from "@/hooks/useProgress";
import { useUserProfile } from "@/hooks/useUserProfile";
import { generateFeedCard } from "@/lib/ai-stream";
import { Skeleton } from "@/components/ui/skeleton";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function LearnFeed() {
  const { progress, update } = useProgress();
  const { profile } = useUserProfile();
  const [cards, setCards] = useState<FeedCardT[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  // On mount: shuffle starter cards and show them fresh every time
  useEffect(() => {
    const shuffled = shuffle(STARTER_FEED).slice(0, 6);
    setCards(shuffled);
    setInitialLoading(false);
    // Pre-generate 2 AI cards
    generateBatch(2);
    setTimeout(() => scrollRef.current?.scrollTo({ top: 0 }), 50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateBatch = useCallback(async (count: number) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);

    const newCards: FeedCardT[] = [];
    for (let i = 0; i < count; i++) {
      try {
        const card = await generateFeedCard({
          learningStyle: profile.learningStyle,
          excludeIds: [...cards.map(c => c.id), ...newCards.map(c => c.id)],
        });
        if (card?.id) newCards.push(card);
      } catch (err) {
        console.error("Feed gen error:", err);
        if (i === 0) setError(err instanceof Error ? err.message : "Failed to generate");
        break;
      }
    }

    if (newCards.length > 0) {
      setCards(prev => [...prev, ...newCards]);
      setError(null);
    }
    setLoading(false);
    loadingRef.current = false;
  }, [cards, profile.learningStyle]);

  const handleComplete = useCallback((id: string, xp: number, tokens: number) => {
    markCardSeen(id);
    update(p => ({ ...p, xp: p.xp + xp, tokens: p.tokens + tokens, lessonsToday: p.lessonsToday + 1 }));
  }, [update]);

  const handleRefresh = () => {
    const shuffled = shuffle(STARTER_FEED).slice(0, 6);
    setCards(shuffled);
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    generateBatch(2);
  };

  // Infinite scroll — generate more when near bottom
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 600) {
        generateBatch(2);
      }
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [generateBatch]);

  return (
    <div className="flex flex-col bg-background min-h-0" style={{ height: "calc(100vh - 7rem)" }}>
      {/* Minimal header */}
      <div className="flex-shrink-0 px-5 pt-4 pb-3 bg-background/90 backdrop-blur-xl z-10 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-lg font-bold text-foreground">Feed</h1>
            <p className="text-[11px] text-muted-foreground">High-value insights · Updated every session</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-caption text-muted-foreground">✦ {progress.tokens}</span>
            <button onClick={handleRefresh}
              className="rounded-xl p-2 bg-surface-2 border border-border hover:border-primary/30 transition-colors">
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Feed scroll */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto snap-y snap-mandatory hide-scrollbar pb-4">
        {initialLoading && cards.length === 0 && (
          <div className="min-h-[calc(100vh-8rem)] snap-start flex flex-col justify-center px-4 py-6">
            <div className="glass-card max-w-lg mx-auto w-full p-5 space-y-4">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        )}

        {cards.map(card => (
          <FeedCard key={card.id} card={card} onComplete={handleComplete} />
        ))}

        {error && !loading && (
          <div className="min-h-[50vh] snap-start flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-center px-8">
              <p className="text-caption text-destructive">{error}</p>
              <button onClick={() => generateBatch(2)}
                className="glass-card px-6 py-3 flex items-center gap-2 text-caption font-semibold text-primary hover:border-primary/30 transition-all">
                <RefreshCw className="h-4 w-4" /> Retry
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="min-h-[40vh] snap-start flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
              <p className="text-caption text-muted-foreground">Loading fresh content...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
