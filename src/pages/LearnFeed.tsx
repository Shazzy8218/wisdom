import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import FeedCard from "@/components/FeedCard";
import {
  markCardSeen, type FeedCard as FeedCardT,
  type FeedCategory, FEED_CATEGORIES, getCardCategory,
} from "@/lib/feed-cards";
import { useProgress } from "@/hooks/useProgress";
import { useUserProfile } from "@/hooks/useUserProfile";
import { generateFeedCardBatch } from "@/lib/ai-stream";
import owlLogo from "@/assets/owl-logo.png";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Living Wisdom Owl logo with heartbeat */
function WisdomOwlLogo() {
  return (
    <div className="relative flex items-center justify-center">
      <motion.div
        className="absolute w-16 h-16 rounded-full border border-primary/10"
        animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0, 0.2] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-12 h-12 rounded-full border border-accent-gold/15"
        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.05, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
      />
      <motion.div
        className="absolute w-10 h-10 rounded-full"
        style={{ background: "radial-gradient(circle, hsl(45 90% 55% / 0.18) 0%, transparent 70%)" }}
        animate={{
          scale: [1, 1.15, 0.95, 1.1, 1],
          opacity: [0.5, 0.9, 0.4, 0.8, 0.5],
        }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", times: [0, 0.15, 0.4, 0.55, 1] }}
      />
      <motion.img
        src={owlLogo}
        alt="Wisdom AI"
        className="relative z-10 w-10 h-10 drop-shadow-[0_0_14px_hsl(45,90%,55%,0.45)]"
        animate={{ scale: [1, 1.08, 0.97, 1.05, 1] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", times: [0, 0.15, 0.4, 0.55, 1] }}
      />
    </div>
  );
}

const BATCH_SIZE = 6;

export default function LearnFeed() {
  const { progress, update } = useProgress();
  const { profile } = useUserProfile();
  const [activeFilters, setActiveFilters] = useState<Set<FeedCategory>>(new Set(["phenomenon", "wealth", "survival"]));
  const [cards, setCards] = useState<FeedCardT[]>([]);
  const [generating, setGenerating] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const genLock = useRef(false);
  const allCardIds = useRef(new Set<string>());
  const mountedRef = useRef(true);
  const queueRef = useRef<number>(0); // sequential queue counter

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

  // Resolve mode from active filters
  const getMode = useCallback(() => {
    const modes = Array.from(activeFilters);
    if (modes.length === 1 && modes[0] === "wealth") return "wealth";
    if (modes.length === 1 && modes[0] === "survival") return "survival";
    // mixed or phenomenon-only: use "mixed" which sends all types
    return "mixed";
  }, [activeFilters]);

  const generateBatch = useCallback(async (count = BATCH_SIZE) => {
    if (genLock.current) return;
    genLock.current = true;
    setGenerating(true);
    try {
      const newCards = await generateFeedCardBatch({
        mode: getMode(),
        learningStyle: profile.learningStyle,
        excludeIds: Array.from(allCardIds.current),
        count,
      });

      if (!mountedRef.current) return;

      const unique = newCards.filter(c => c?.id && !allCardIds.current.has(c.id));
      unique.forEach(c => allCardIds.current.add(c.id));
      if (unique.length > 0) {
        setCards(prev => [...prev, ...unique]);
      }
    } catch (err) {
      console.error("Feed batch gen error:", err);
    }
    if (mountedRef.current) {
      setGenerating(false);
      setInitialLoading(false);
    }
    genLock.current = false;
  }, [profile.learningStyle, getMode]);

  // Sequential batch loader — fires batches one after another to avoid overwhelming the API
  const loadBatchesSequentially = useCallback(async (totalBatches: number) => {
    for (let i = 0; i < totalBatches; i++) {
      if (!mountedRef.current) break;
      await generateBatch(BATCH_SIZE);
      // Small delay between batches to avoid rate limits
      if (i < totalBatches - 1) await new Promise(r => setTimeout(r, 300));
    }
  }, [generateBatch]);

  // Always start fresh on mount — never show stale cards
  useEffect(() => {
    mountedRef.current = true;
    setCards([]);
    allCardIds.current = new Set();
    setInitialLoading(true);
    // Load 5 sequential batches = ~30 cards
    loadBatchesSequentially(5);
    return () => { mountedRef.current = false; };
  }, []);

  // Auto-generate more when user scrolls near bottom
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 800;
      if (nearBottom && !genLock.current) {
        generateBatch(BATCH_SIZE);
      }
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [generateBatch]);

  const handleComplete = useCallback((id: string, xp: number, tokens: number) => {
    markCardSeen(id);
    update(p => ({ ...p, xp: p.xp + xp, tokens: p.tokens + tokens, lessonsToday: p.lessonsToday + 1 }));
  }, [update]);

  const handleRefresh = () => {
    setCards([]);
    allCardIds.current = new Set();
    setInitialLoading(true);
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    loadBatchesSequentially(5);
  };

  return (
    <div className="flex flex-col bg-background min-h-0" style={{ height: "calc(100vh - 3.5rem)" }}>
      {/* Premium Header */}
      <div className="flex-shrink-0 px-5 pt-5 pb-4 bg-background/95 backdrop-blur-2xl z-10 border-b border-border/30">
        <div className="flex items-center justify-between mb-3">
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

      {/* Feed - smooth scroll like Instagram/X */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overscroll-y-contain hide-scrollbar"
        style={{ WebkitOverflowScrolling: "touch", scrollBehavior: "smooth" }}
      >
        {filteredCards.map((card, i) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.3,
              delay: Math.min(i * 0.015, 0.1),
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          >
            <FeedCard card={card} onComplete={handleComplete} />
          </motion.div>
        ))}

        {/* Empty state */}
        {filteredCards.length === 0 && !generating && !initialLoading && (
          <div className="flex flex-col items-center justify-center h-64 px-6">
            <p className="text-muted-foreground text-sm text-center">No cards match your filters.</p>
            <button onClick={() => setActiveFilters(new Set(["phenomenon", "wealth"]))}
              className="mt-3 text-primary text-xs font-semibold hover:underline">Show all</button>
          </div>
        )}

        {/* Loading indicator */}
        {(generating || initialLoading) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-10 gap-3"
          >
            <motion.div
              animate={{ scale: [1, 1.12, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              <img src={owlLogo} alt="" className="w-8 h-8 drop-shadow-[0_0_10px_hsl(45,90%,55%,0.3)]" />
            </motion.div>
            <span className="text-[11px] text-muted-foreground/60 tracking-wide">
              {initialLoading ? "Wisdom Owl is preparing your feed…" : "Loading more wisdom…"}
            </span>
          </motion.div>
        )}

        <div className="h-8" />
      </div>
    </div>
  );
}
