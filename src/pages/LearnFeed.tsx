import { useState, useEffect, useCallback, useRef, memo } from "react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import FeedCard from "@/components/FeedCard";
import {
  markCardSeen, type FeedCard as FeedCardT,
  type FeedCategory, FEED_CATEGORIES, getCardCategory,
} from "@/lib/feed-cards";
import { useProgress } from "@/hooks/useProgress";
import { generateFeedCard } from "@/lib/ai-stream";
import owlLogo from "@/assets/owl-logo.png";

const SCROLL_THRESHOLD = 1200;

export default function LearnFeed() {
  const { progress, update } = useProgress();
  const [filters, setFilters] = useState<Set<FeedCategory>>(new Set(["survival"]));
  const [cards, setCards] = useState<FeedCardT[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lock = useRef(false);
  const seen = useRef(new Set<string>());
  const alive = useRef(true);

  const filtered = cards.filter(c => filters.has(getCardCategory(c.type)));

  const mode = useCallback(() => {
    const f = Array.from(filters);
    return f.length === 1 ? f[0] : "mixed";
  }, [filters]);

  // Generate one card at a time, sequentially
  const genOne = useCallback(async (): Promise<FeedCardT | null> => {
    try {
      const card = await generateFeedCard({ mode: mode() });
      if (card?.id && !seen.current.has(card.id)) {
        seen.current.add(card.id);
        return card;
      }
    } catch (e) {
      console.error("Feed card error:", e);
    }
    return null;
  }, [mode]);

  // Load N cards sequentially, appending each as it arrives
  const loadCards = useCallback(async (count: number) => {
    if (lock.current) return;
    lock.current = true;
    setLoading(true);
    for (let i = 0; i < count; i++) {
      if (!alive.current) break;
      const card = await genOne();
      if (card) setCards(prev => [...prev, card]);
    }
    if (alive.current) setLoading(false);
    lock.current = false;
  }, [genOne]);

  // Initial load
  useEffect(() => {
    alive.current = true;
    setCards([]);
    seen.current.clear();
    loadCards(6);
    return () => { alive.current = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Infinite scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - SCROLL_THRESHOLD && !lock.current) {
        loadCards(3);
      }
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [loadCards]);

  const complete = useCallback((id: string, xp: number, tokens: number) => {
    markCardSeen(id);
    update(p => ({ ...p, xp: p.xp + xp, tokens: p.tokens + tokens, lessonsToday: p.lessonsToday + 1 }));
  }, [update]);

  const refresh = () => {
    alive.current = true;
    setCards([]);
    seen.current.clear();
    setLoading(true);
    scrollRef.current?.scrollTo({ top: 0 });
    loadCards(6);
  };

  const toggle = (cat: FeedCategory) => {
    setFilters(prev => {
      const next = new Set(prev);
      next.has(cat) ? (next.size > 1 && next.delete(cat)) : next.add(cat);
      return next;
    });
  };

  return (
    <div className="flex flex-col bg-background min-h-0" style={{ height: "calc(100vh - 3.5rem)" }}>
      <div className="flex-shrink-0 px-5 pt-5 pb-4 bg-background/95 backdrop-blur-2xl z-10 border-b border-border/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <LivingOwlLogo />
            <div>
              <h1 className="font-display text-lg font-bold text-foreground tracking-tight">Wisdom Feed</h1>
              <p className="text-[10px] text-muted-foreground tracking-wide uppercase">
                {filtered.length} insights · ✦ {progress.tokens}
              </p>
            </div>
          </div>
          <motion.button onClick={refresh} whileTap={{ rotate: 180 }} transition={{ duration: 0.4 }}
            className="rounded-xl p-2.5 bg-surface-2/80 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:bg-surface-hover">
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </motion.button>
        </div>

        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          {(Object.entries(FEED_CATEGORIES) as [FeedCategory, typeof FEED_CATEGORIES[FeedCategory]][]).map(([key, cat]) => (
            <button key={key} onClick={() => toggle(key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-semibold tracking-wide transition-all duration-300 border whitespace-nowrap ${
                filters.has(key)
                  ? "bg-primary/15 border-primary/30 text-primary shadow-[0_0_12px_hsl(355_78%_50%/0.1)]"
                  : "bg-surface-2/50 border-border/30 text-muted-foreground hover:border-border"
              }`}>
              <span className="text-sm">{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div ref={scrollRef}
        className="flex-1 overflow-y-auto overscroll-y-contain hide-scrollbar"
        style={{ scrollSnapType: "y mandatory", WebkitOverflowScrolling: "touch" }}>
        {filtered.map(card => (
          <FeedCard key={card.id} card={card} onComplete={complete} />
        ))}

        {filtered.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-64 px-6 snap-start">
            <p className="text-muted-foreground text-sm text-center">No cards match your filters.</p>
            <button onClick={() => setFilters(new Set(["survival", "phenomenon", "wealth"]))}
              className="mt-3 text-primary text-xs font-semibold hover:underline">Show all</button>
          </div>
        )}

        {loading && (
          <div className="snap-start min-h-[calc(100vh-7rem)] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <motion.div animate={{ scale: [1, 1.12, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.2, repeat: Infinity }}>
                <img src={owlLogo} alt="" className="w-10 h-10 drop-shadow-[0_0_14px_hsl(45,90%,55%,0.4)]" />
              </motion.div>
              <span className="text-[11px] text-muted-foreground/60 tracking-wide">
                {cards.length === 0 ? "Wisdom Owl is preparing your feed…" : "Loading more wisdom…"}
              </span>
            </div>
          </div>
        )}
        <div className="h-8" />
      </div>
    </div>
  );
}

function LivingOwlLogo() {
  return (
    <div className="relative flex items-center justify-center w-12 h-12">
      <motion.div
        className="absolute w-12 h-12 rounded-full border border-[hsl(45_90%_55%/0.12)]"
        animate={{ scale: [1, 1.6, 1], opacity: [0.15, 0, 0.15] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-10 h-10 rounded-full border border-[hsl(45_90%_55%/0.18)]"
        animate={{ scale: [1, 1.35, 1], opacity: [0.2, 0, 0.2] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.15 }}
      />
      <motion.img
        src={owlLogo}
        alt="Wisdom AI"
        className="relative z-10 w-9 h-9 drop-shadow-[0_0_16px_hsl(45,90%,55%,0.5)]"
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut", times: [0, 0.15, 1] }}
      />
    </div>
  );
}
