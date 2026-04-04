import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, RefreshCw } from "lucide-react";
import FeedCard from "@/components/FeedCard";
import { STARTER_FEED, markCardSeen, type FeedCard as FeedCardT } from "@/lib/feed-cards";
import { useProgress } from "@/hooks/useProgress";
import { useUserProfile } from "@/hooks/useUserProfile";
import { generateFeedCard } from "@/lib/ai-stream";

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
  const [cards, setCards] = useState<FeedCardT[]>(() => shuffle(STARTER_FEED));
  const [aiBuffer, setAiBuffer] = useState<FeedCardT[]>([]);
  const [generating, setGenerating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const genLock = useRef(false);
  const allCardIds = useRef(new Set(STARTER_FEED.map(c => c.id)));

  // Background AI generation — fills a buffer silently
  const fillBuffer = useCallback(async () => {
    if (genLock.current) return;
    genLock.current = true;
    setGenerating(true);
    try {
      const card = await generateFeedCard({
        learningStyle: profile.learningStyle,
        excludeIds: Array.from(allCardIds.current).slice(-20),
      });
      if (card?.id && !allCardIds.current.has(card.id)) {
        allCardIds.current.add(card.id);
        setAiBuffer(prev => [...prev, card]);
      }
    } catch (err) {
      console.error("Background feed gen:", err);
    }
    setGenerating(false);
    genLock.current = false;
  }, [profile.learningStyle]);

  // Start background generation on mount
  useEffect(() => {
    fillBuffer();
    const interval = setInterval(() => {
      if (!genLock.current) fillBuffer();
    }, 15000);
    return () => clearInterval(interval);
  }, [fillBuffer]);

  // When user scrolls near bottom, pull from buffer or generate
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 800) {
        // Pull buffered AI cards into the feed
        if (aiBuffer.length > 0) {
          setCards(prev => [...prev, ...aiBuffer]);
          setAiBuffer([]);
        }
        // Trigger more background generation
        if (!genLock.current) fillBuffer();
      }
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [aiBuffer, fillBuffer]);

  const handleComplete = useCallback((id: string, xp: number, tokens: number) => {
    markCardSeen(id);
    update(p => ({ ...p, xp: p.xp + xp, tokens: p.tokens + tokens, lessonsToday: p.lessonsToday + 1 }));
  }, [update]);

  const handleRefresh = () => {
    const shuffled = shuffle(STARTER_FEED);
    setCards([...shuffled, ...aiBuffer]);
    setAiBuffer([]);
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    if (!genLock.current) fillBuffer();
  };

  return (
    <div className="flex flex-col bg-background min-h-0" style={{ height: "calc(100vh - 7rem)" }}>
      {/* Header */}
      <div className="flex-shrink-0 px-5 pt-4 pb-3 bg-background/90 backdrop-blur-xl z-10 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-lg font-bold text-foreground">Feed</h1>
            <p className="text-[11px] text-muted-foreground">High-value insights · Scroll for more</p>
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

      {/* Feed */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto snap-y snap-mandatory hide-scrollbar pb-4">
        <AnimatePresence initial={false}>
          {cards.map((card, i) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.3) }}
            >
              <FeedCard card={card} onComplete={handleComplete} />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Subtle loading indicator at bottom */}
        {generating && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 text-primary/50 animate-spin" />
            <span className="ml-2 text-xs text-muted-foreground">Generating fresh insights...</span>
          </div>
        )}
      </div>
    </div>
  );
}
