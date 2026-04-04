import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, RefreshCw } from "lucide-react";
import FeedCard from "@/components/FeedCard";
import {
  STARTER_FEED, markCardSeen, type FeedCard as FeedCardT,
  type FeedCategory, FEED_CATEGORIES, getCardCategory,
} from "@/lib/feed-cards";
import { useProgress } from "@/hooks/useProgress";
import { useUserProfile } from "@/hooks/useUserProfile";
import { generateFeedCard } from "@/lib/ai-stream";
import owlLogo from "@/assets/owl-logo.png";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Animated owl logo with heartbeat pulse */
function WisdomOwlLogo() {
  return (
    <div className="relative flex items-center justify-center">
      {/* Outer aura rings */}
      <motion.div
        className="absolute w-14 h-14 rounded-full border border-primary/10"
        animate={{
          scale: [1, 1.4, 1],
          opacity: [0.3, 0, 0.3],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-11 h-11 rounded-full border border-accent-gold/15"
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.4, 0.1, 0.4],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
      />
      {/* Inner glow */}
      <motion.div
        className="absolute w-9 h-9 rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(45 90% 55% / 0.15) 0%, transparent 70%)",
        }}
        animate={{
          scale: [1, 1.15, 0.95, 1.1, 1],
          opacity: [0.5, 0.8, 0.4, 0.7, 0.5],
        }}
        transition={{
          duration: 1.8,
          repeat: Infinity,
          ease: "easeInOut",
          times: [0, 0.15, 0.4, 0.55, 1],
        }}
      />
      {/* Owl image with heartbeat */}
      <motion.img
        src={owlLogo}
        alt="Wisdom AI"
        className="relative z-10 w-9 h-9 drop-shadow-[0_0_12px_hsl(45,90%,55%,0.4)]"
        animate={{
          scale: [1, 1.08, 0.97, 1.05, 1],
        }}
        transition={{
          duration: 1.8,
          repeat: Infinity,
          ease: "easeInOut",
          times: [0, 0.15, 0.4, 0.55, 1],
        }}
      />
    </div>
  );
}

export default function LearnFeed() {
  const { progress, update } = useProgress();
  const { profile } = useUserProfile();
  const [activeFilters, setActiveFilters] = useState<Set<FeedCategory>>(new Set(["phenomenon", "wealth"]));
  const [cards, setCards] = useState<FeedCardT[]>(() => shuffle(STARTER_FEED));
  const [generating, setGenerating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const genLock = useRef(false);
  const allCardIds = useRef(new Set(STARTER_FEED.map(c => c.id)));
  const autoGenTriggered = useRef(false);

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

  const generateNewCard = useCallback(async () => {
    if (genLock.current) return;
    genLock.current = true;
    setGenerating(true);
    try {
      // Determine mode based on active filters
      const modes = Array.from(activeFilters);
      const mode = modes.length === 1 && modes[0] === "wealth" ? "wealth" : "decoder";
      
      const card = await generateFeedCard({
        mode,
        learningStyle: profile.learningStyle,
        excludeIds: Array.from(allCardIds.current),
      });
      if (card?.id && !allCardIds.current.has(card.id)) {
        allCardIds.current.add(card.id);
        setCards(prev => [...prev, card]);
      }
    } catch (err) {
      console.error("Feed gen error:", err);
    }
    setGenerating(false);
    genLock.current = false;
  }, [profile.learningStyle, activeFilters]);

  // Pre-generate one card on mount
  useEffect(() => {
    generateNewCard();
  }, []);

  // Auto-generate when user scrolls near bottom
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 600;
      if (nearBottom && !genLock.current) {
        generateNewCard();
      }
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [generateNewCard]);

  const handleComplete = useCallback((id: string, xp: number, tokens: number) => {
    markCardSeen(id);
    update(p => ({ ...p, xp: p.xp + xp, tokens: p.tokens + tokens, lessonsToday: p.lessonsToday + 1 }));
  }, [update]);

  const handleRefresh = () => {
    const shuffled = shuffle(STARTER_FEED);
    setCards(shuffled);
    allCardIds.current = new Set(STARTER_FEED.map(c => c.id));
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    generateNewCard();
  };

  return (
    <div className="flex flex-col bg-background min-h-0" style={{ height: "calc(100vh - 7rem)" }}>
      {/* Premium Header */}
      <div className="flex-shrink-0 px-5 pt-5 pb-4 bg-background/95 backdrop-blur-2xl z-10 border-b border-border/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <WisdomOwlLogo />
            <div>
              <h1 className="font-display text-lg font-bold text-foreground tracking-tight">
                Wisdom Feed
              </h1>
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
              transition={{ duration: 0.35, delay: Math.min(i * 0.02, 0.15), ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <FeedCard card={card} onComplete={handleComplete} />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty state */}
        {filteredCards.length === 0 && !generating && (
          <div className="flex flex-col items-center justify-center h-64 px-6">
            <p className="text-muted-foreground text-sm text-center">No cards match your filters.</p>
            <button onClick={() => setActiveFilters(new Set(["phenomenon", "wealth"]))}
              className="mt-3 text-primary text-xs font-semibold hover:underline">Show all</button>
          </div>
        )}

        {/* Loading indicator at bottom */}
        {generating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12 gap-3"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <img src={owlLogo} alt="" className="w-8 h-8 drop-shadow-[0_0_10px_hsl(45,90%,55%,0.3)]" />
            </motion.div>
            <span className="text-[11px] text-muted-foreground/60 tracking-wide">
              Wisdom Owl is crafting fresh intelligence…
            </span>
          </motion.div>
        )}

        <div className="h-8" />
      </div>
    </div>
  );
}
