import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import FeedCard from "@/components/FeedCard";
import {
  STARTER_FEED, markCardSeen, type FeedCard as FeedCardT,
  type FeedCategory, FEED_CATEGORIES, getCardCategory,
} from "@/lib/feed-cards";
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
  const [activeFilters, setActiveFilters] = useState<Set<FeedCategory>>(new Set(["phenomenon", "wealth"]));
  const [cards, setCards] = useState<FeedCardT[]>(() => shuffle(STARTER_FEED));
  const [aiBuffer, setAiBuffer] = useState<FeedCardT[]>([]);
  const [generating, setGenerating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const genLock = useRef(false);
  const allCardIds = useRef(new Set(STARTER_FEED.map(c => c.id)));

  const filteredCards = cards.filter(c => activeFilters.has(getCardCategory(c.type)));

  const toggleFilter = (cat: FeedCategory) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(cat)) {
        if (next.size > 1) next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

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

  useEffect(() => {
    fillBuffer();
    const interval = setInterval(() => {
      if (!genLock.current) fillBuffer();
    }, 15000);
    return () => clearInterval(interval);
  }, [fillBuffer]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 800) {
        if (aiBuffer.length > 0) {
          setCards(prev => [...prev, ...aiBuffer]);
          setAiBuffer([]);
        }
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
      {/* Premium Header */}
      <div className="flex-shrink-0 px-5 pt-5 pb-4 bg-background/95 backdrop-blur-2xl z-10 border-b border-border/30">
        {/* Title row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-accent-green border-2 border-background" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-foreground tracking-tight">Intelligence Feed</h1>
              <p className="text-[10px] text-muted-foreground tracking-wide uppercase">
                {filteredCards.length} insights · ✦ {progress.tokens}
              </p>
            </div>
          </div>
          <motion.button
            onClick={handleRefresh}
            whileTap={{ rotate: 180 }}
            transition={{ duration: 0.4 }}
            className="rounded-xl p-2.5 bg-surface-2/80 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:bg-surface-hover"
          >
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </motion.button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex gap-2">
          {(Object.entries(FEED_CATEGORIES) as [FeedCategory, typeof FEED_CATEGORIES[FeedCategory]][]).map(([key, cat]) => {
            const active = activeFilters.has(key);
            return (
              <motion.button
                key={key}
                onClick={() => toggleFilter(key)}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-semibold tracking-wide transition-all duration-300 border ${
                  active
                    ? "bg-primary/15 border-primary/30 text-primary shadow-[0_0_12px_hsl(355_78%_50%/0.1)]"
                    : "bg-surface-2/50 border-border/30 text-muted-foreground hover:border-border"
                }`}
              >
                <span className="text-sm">{cat.icon}</span>
                <span>{cat.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Feed */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto snap-y snap-mandatory hide-scrollbar">
        <AnimatePresence initial={false}>
          {filteredCards.map((card, i) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35, delay: Math.min(i * 0.04, 0.2), ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <FeedCard card={card} onComplete={handleComplete} />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* End-of-feed state */}
        {filteredCards.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 px-6">
            <p className="text-muted-foreground text-sm text-center">No cards match your filters.</p>
            <button onClick={() => setActiveFilters(new Set(["phenomenon", "wealth"]))}
              className="mt-3 text-primary text-xs font-semibold hover:underline">Show all</button>
          </div>
        )}

        {generating && (
          <div className="flex items-center justify-center py-10 gap-2">
            <Loader2 className="h-4 w-4 text-primary/40 animate-spin" />
            <span className="text-[11px] text-muted-foreground/60 tracking-wide">Generating fresh intelligence…</span>
          </div>
        )}

        {/* Bottom spacer */}
        <div className="h-8" />
      </div>
    </div>
  );
}
