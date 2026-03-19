import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { BookOpen, BarChart3, Gamepad2, BookMarked, ChevronRight, Zap, Flame, Crosshair, Target, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import StatBlock from "@/components/StatBlock";
import { QUOTES, MICRO_LESSONS } from "@/lib/data";
import { useProgress } from "@/hooks/useProgress";
import { useLiveClock } from "@/hooks/useLiveClock";
import { useUserProfile } from "@/hooks/useUserProfile";
import { getAnalytics } from "@/lib/analytics-engine";
import NextMoveCard from "@/components/NextMoveCard";
import InsightCard from "@/components/InsightCard";
import owlLogo from "@/assets/owl-logo.png";
import OwlIcon from "@/components/OwlIcon";
import HiddenOwl from "@/components/HiddenOwl";
import OwlHuntTracker from "@/components/OwlHuntTracker";

const QUOTE_SEEN_KEY = "wisdom-seen-quotes-v2";

function getUnseenQuote(): string {
  const seen = JSON.parse(localStorage.getItem(QUOTE_SEEN_KEY) || "[]") as number[];
  const available = QUOTES.map((_, i) => i).filter((i) => !seen.includes(i));
  if (available.length === 0) {
    return QUOTES[seen[seen.length - 1] ?? 0];
  }
  const pick = available[Math.floor(Math.random() * available.length)];
  localStorage.setItem(QUOTE_SEEN_KEY, JSON.stringify([...seen, pick]));
  return QUOTES[pick];
}

const QUICK_ACTIONS = [
  { icon: null, label: "Chat", to: "/chat", isOwl: true },
  { icon: BookOpen, label: "Feed", to: "/feed" },
  { icon: BarChart3, label: "Mastery", to: "/mastery" },
  { icon: Gamepad2, label: "Games", to: "/games" },
  { icon: BookMarked, label: "Library", to: "/library" },
];

export default function Index() {
  const [quote] = useState(() => getUnseenQuote());
  const { progress } = useProgress();
  const clock = useLiveClock();
  const { profile } = useUserProfile();
  const analytics = useMemo(() => getAnalytics(), [progress]);

  const masteryAvg = useMemo(() => {
    const vals = Object.values(progress.masteryScores);
    return vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
  }, [progress.masteryScores]);

  const todayXP = progress.xp;
  const nextLesson = MICRO_LESSONS[0];

  const displayGreeting = profile.displayName
    ? `${clock.greeting}, ${profile.displayName}`
    : clock.greeting;

  const topSuggestion = analytics.suggestions[0] || null;
  const focusSuggestion = analytics.suggestions.find(s => s.type === "focus-today") || null;
  const topInsight = analytics.insights[0] || null;

  return (
    <div className="min-h-[100dvh] pb-28">
      {/* Header — compact, breathable */}
      <div className="px-5 pt-safe-top pt-12 pb-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <img src={owlLogo} alt="Wisdom AI" className="w-6 h-6 drop-shadow-[0_0_8px_hsl(45,90%,55%,0.3)]" />
            <p className="section-label text-accent-gold">Wisdom AI</p>
          </div>
          <div className="flex items-center gap-3">
            <OwlHuntTracker />
            <span className="text-[11px] font-mono text-muted-foreground tabular-nums">{clock.timeStr}</span>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 }}
          className="font-display text-[26px] font-bold tracking-tight text-foreground leading-tight"
        >
          {displayGreeting}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.08 }}
          className="text-[12px] text-muted-foreground mt-0.5"
        >
          {clock.dateStr}
        </motion.p>

        {/* Day progress bar */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }} className="mt-3">
          <div className="h-[2px] w-full rounded-full bg-surface-2 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary/50"
              initial={{ width: 0 }}
              animate={{ width: `${clock.dayProgress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </motion.div>
      </div>

      {/* Daily Mastery Snapshot — the strategic command center card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mx-5 mb-5"
      >
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Target className="h-3.5 w-3.5 text-primary" />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Daily Mastery Snapshot</p>
          </div>

          {/* Stats row — compact grid */}
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center">
              <p className="font-display text-lg font-bold text-foreground leading-none">{progress.tokens}</p>
              <p className="text-[9px] text-muted-foreground mt-0.5">Tokens</p>
            </div>
            <div className="text-center">
              <p className="font-display text-lg font-bold text-foreground leading-none">{progress.streak}</p>
              <p className="text-[9px] text-muted-foreground mt-0.5">Streak 🔥</p>
            </div>
            <div className="text-center">
              <p className="font-display text-lg font-bold text-foreground leading-none">{masteryAvg}%</p>
              <p className="text-[9px] text-muted-foreground mt-0.5">Mastery</p>
            </div>
            <div className="text-center">
              <p className="font-display text-lg font-bold text-foreground leading-none">{todayXP}</p>
              <p className="text-[9px] text-muted-foreground mt-0.5">XP ⚡</p>
            </div>
          </div>

          {/* Quick micro-lesson CTA */}
          <Link to="/feed" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface-2/60 border border-border group">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-foreground truncate">{nextLesson.title}</p>
              <p className="text-[10px] text-muted-foreground">{nextLesson.track} · +{nextLesson.tokens} tokens</p>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground shrink-0" />
          </Link>
        </div>
      </motion.div>

      {/* Proactive Suggestion — Next Move */}
      {topSuggestion && (
        <div className="px-5 mb-4">
          <NextMoveCard suggestion={topSuggestion} delay={0.14} />
        </div>
      )}

      {/* Quick Actions — horizontally scrollable pill row */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.18 }}
        className="px-5 mb-5"
      >
        <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-5 px-5">
          {QUICK_ACTIONS.map(({ icon: Icon, label, to, isOwl }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-surface-2 border border-border shrink-0 group active:scale-[0.97] transition-transform"
            >
              {isOwl ? (
                <OwlIcon size={16} />
              ) : (
                Icon && <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              )}
              <span className="text-[12px] font-medium text-foreground whitespace-nowrap">{label}</span>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Daily Wisdom Quote */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mx-5 mb-5 relative"
      >
        <div className="editorial-divider mb-3" />
        <p className="text-[14px] italic leading-relaxed text-muted-foreground">"{quote}"</p>
        <div className="editorial-divider mt-3" />
        <HiddenOwl locationId="home-quote" className="absolute -right-1 bottom-2" size={16} />
      </motion.div>

      {/* Focus Today */}
      {focusSuggestion && focusSuggestion.id !== topSuggestion?.id && (
        <div className="px-5 mb-4">
          <NextMoveCard suggestion={focusSuggestion} delay={0.24} />
        </div>
      )}

      {/* Pattern Insight */}
      {topInsight && (
        <div className="px-5 mb-4">
          <InsightCard insight={topInsight} delay={0.26} />
        </div>
      )}

      {/* Mastery Arena CTA */}
      <div className="px-5 mb-3">
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Link
            to="/drills"
            className="flex items-center gap-3 py-3 px-4 rounded-2xl bg-primary/5 border border-primary/20 active:bg-primary/10 transition-all group"
          >
            <Crosshair className="h-4 w-4 text-primary" />
            <div className="flex-1 min-w-0">
              <span className="text-[13px] text-foreground font-semibold block">Mastery Arena</span>
              <span className="text-[10px] text-muted-foreground">Neural Syntax Engine — Quick Drill</span>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          </Link>
        </motion.div>
      </div>

      {/* 10-min Focus Sprint */}
      <div className="px-5 mb-6">
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.33 }}>
          <Link
            to="/feed"
            className="flex items-center gap-3 py-3 px-4 rounded-2xl bg-surface-2/50 border border-border active:bg-surface-hover transition-all group"
          >
            <Flame className="h-4 w-4 text-accent-gold" />
            <span className="text-[13px] text-muted-foreground group-hover:text-foreground transition-colors">
              10-min Focus Sprint
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
