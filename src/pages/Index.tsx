import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { BookOpen, BarChart3, Gamepad2, BookMarked, ChevronRight, Zap, Flame, Target, Trophy, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import StatBlock from "@/components/StatBlock";
import { QUOTES, MICRO_LESSONS } from "@/lib/data";
import { useProgress } from "@/hooks/useProgress";
import { CATEGORY_TRACKS } from "@/lib/categories";
import { useLiveClock } from "@/hooks/useLiveClock";
import { useUserProfile } from "@/hooks/useUserProfile";
import { getAnalytics } from "@/lib/analytics-engine";
import { useGoals } from "@/hooks/useGoals";
import NextMoveCard from "@/components/NextMoveCard";
import InsightCard from "@/components/InsightCard";
import owlLogo from "@/assets/owl-logo.png";
import OwlIcon from "@/components/OwlIcon";
import HiddenOwl from "@/components/HiddenOwl";
import OwlHuntTracker from "@/components/OwlHuntTracker";
import { Progress } from "@/components/ui/progress";
import { SerendipityDashboardCard } from "@/components/StrategicSerendipity";
import DueReviewsWidget from "@/components/nexus/DueReviewsWidget";

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
  const { goals, primaryGoal } = useGoals();
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

  const activeGoals = goals.filter(g => !g.completed);
  const goalProgress = useMemo(() => {
    if (activeGoals.length === 0) return 0;
    return Math.round(activeGoals.reduce((sum, g) => {
      if (g.targetValue === g.baselineValue) return sum;
      return sum + Math.min(100, Math.round(((g.currentValue - g.baselineValue) / (g.targetValue - g.baselineValue)) * 100));
    }, 0) / activeGoals.length);
  }, [activeGoals]);

  return (
    <div className="min-h-screen pb-4">
      {/* Section 1: Header */}
      <div className="px-5 pt-6 pb-6">
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="font-display text-[28px] font-bold tracking-tight text-foreground leading-tight"
        >
          {displayGreeting}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-[13px] text-muted-foreground mt-1"
        >
          {clock.dateStr}
        </motion.p>

        {/* Day progress */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="mt-4">
          <div className="h-[2px] w-full rounded-full bg-surface-2 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary/50"
              initial={{ width: 0 }}
              animate={{ width: `${clock.dayProgress}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          </div>
        </motion.div>
      </div>

      {/* CAE — Due reviews widget (Memory Engraver) */}
      <DueReviewsWidget />

      {/* Strategic Serendipity — daily cross-domain card */}
      <SerendipityDashboardCard delay={0.11} />

      {/* Proactive Suggestion — Next Move */}
      {topSuggestion && (
        <div className="px-5 mb-4">
          <NextMoveCard suggestion={topSuggestion} delay={0.12} />
        </div>
      )}

      {/* Section 2: Daily Wisdom */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mx-5 mb-6 relative"
      >
        <div className="editorial-divider mb-4" />
        <p className="section-label mb-3">Daily Wisdom</p>
        <p className="text-[15px] italic leading-relaxed text-muted-foreground">"{quote}"</p>
        <div className="editorial-divider mt-4" />
        <HiddenOwl locationId="home-quote" className="absolute -right-1 bottom-2" size={16} />
      </motion.div>

      {/* Section 3: Daily Mastery Snapshot */}
      <div className="px-5 mb-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold text-primary uppercase tracking-[0.15em]">Daily Mastery Snapshot</p>
            <Link to="/goals" className="text-[10px] font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              Mission Control <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-card border border-border p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <Target className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] text-muted-foreground">Goal Progress</span>
              </div>
              <p className="text-xl font-black text-foreground">{goalProgress}%</p>
              <Progress value={goalProgress} className="h-1 mt-1" />
            </div>
            <div className="rounded-xl bg-card border border-border p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <Flame className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-[10px] text-muted-foreground">Streak</span>
              </div>
              <p className="text-xl font-black text-foreground">{progress.streak}<span className="text-xs text-muted-foreground ml-1">days</span></p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2">
            <StatBlock label="Tokens" value={progress.tokens} icon="✦" accent delay={0} />
            <StatBlock label="Mastery" value={`${masteryAvg}%`} icon="◉" delay={0} />
            <StatBlock label="XP" value={todayXP} icon="⚡" delay={0} />
          </div>
          {/* Primary goal quick view */}
          {primaryGoal && !primaryGoal.completed && (
            <Link to="/goals" className="mt-2 block">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-center gap-3 hover:border-primary/40 transition-colors">
                <TrendingUp className="h-4 w-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-foreground truncate">{primaryGoal.title}</p>
                  <p className="text-[10px] text-muted-foreground">{primaryGoal.currentValue}/{primaryGoal.targetValue} {primaryGoal.targetMetric}</p>
                </div>
                <span className="text-xs font-bold text-primary">{goalProgress}%</span>
              </div>
            </Link>
          )}
        </motion.div>
      </div>

      {/* Focus Today */}
      {focusSuggestion && focusSuggestion.id !== topSuggestion?.id && (
        <div className="px-5 mb-4">
          <NextMoveCard suggestion={focusSuggestion} delay={0.32} />
        </div>
      )}

      {/* Pattern Insight */}
      {topInsight && (
        <div className="px-5 mb-4">
          <InsightCard insight={topInsight} delay={0.35} />
        </div>
      )}

      {/* Section 4: Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="flex justify-between px-8 mb-8"
      >
        {QUICK_ACTIONS.map(({ icon: Icon, label, to, isOwl }) => (
          <Link key={to} to={to} className="flex flex-col items-center gap-1.5 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-2 border border-border group-hover:border-primary/30 transition-colors">
              {isOwl ? (
                <OwlIcon size={18} />
              ) : (
                Icon && <Icon className="h-[18px] w-[18px] text-muted-foreground group-hover:text-primary transition-colors" />
              )}
            </div>
            <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
          </Link>
        ))}
      </motion.div>

      {/* Section 5: Today's Mission */}
      <div className="px-5 mb-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Link
            to="/feed"
            className="glass-card p-5 flex items-center gap-4 group hover:border-primary/20 transition-all block"
          >
            <div className="flex-1 min-w-0">
              <p className="section-label mb-2">Today's Mission</p>
              <p className="text-[15px] font-semibold text-foreground leading-snug">{nextLesson.title}</p>
              <p className="text-[12px] text-muted-foreground mt-1">{nextLesson.track} · +{nextLesson.tokens} tokens</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
          </Link>
        </motion.div>
      </div>

      {/* Section 6: Mastery Arena */}
      <div className="px-5 mb-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.43 }}>
          <Link
            to="/drills"
            className="flex items-center gap-3 py-3 px-4 rounded-2xl bg-primary/5 border border-primary/20 hover:border-primary/40 transition-all group"
          >
            <Flame className="h-4 w-4 text-primary" />
            <span className="text-[13px] text-foreground font-medium group-hover:text-primary transition-colors">
              Mastery Arena — Neural Syntax Engine
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
          </Link>
        </motion.div>
      </div>

      {/* Section 7: Focus Sprint */}
      <div className="px-5 mb-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <Link
            to="/feed"
            className="flex items-center gap-3 py-3 px-4 rounded-2xl bg-surface-2/50 border border-border hover:border-primary/20 transition-all group"
          >
            <Zap className="h-4 w-4 text-primary" />
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
