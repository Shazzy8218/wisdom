import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Newspaper, BarChart3, Gamepad2, BookOpen, ChevronRight, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import StatBlock from "@/components/StatBlock";
import { QUOTES, MICRO_LESSONS } from "@/lib/data";
import { useProgress } from "@/hooks/useProgress";
import { CATEGORY_TRACKS } from "@/lib/categories";
import { useLiveClock } from "@/hooks/useLiveClock";
import { useUserProfile } from "@/hooks/useUserProfile";

const QUICK_ACTIONS = [
  { icon: MessageSquare, label: "Chat", to: "/chat" },
  { icon: Newspaper, label: "Feed", to: "/feed" },
  { icon: BarChart3, label: "Mastery", to: "/mastery" },
  { icon: Gamepad2, label: "Games", to: "/games" },
  { icon: BookOpen, label: "Library", to: "/library" },
];

export default function Index() {
  const [quote, setQuote] = useState("");
  const { progress } = useProgress();
  const clock = useLiveClock();
  const { profile } = useUserProfile();

  useEffect(() => {
    const seen = JSON.parse(localStorage.getItem("wisdom-seen-quotes") || "[]") as number[];
    const available = QUOTES.map((_, i) => i).filter((i) => !seen.includes(i));
    if (available.length === 0) {
      localStorage.setItem("wisdom-seen-quotes", "[]");
      setQuote(QUOTES[0]);
    } else {
      const pick = available[Math.floor(Math.random() * available.length)];
      setQuote(QUOTES[pick]);
      localStorage.setItem("wisdom-seen-quotes", JSON.stringify([...seen, pick]));
    }
  }, []);

  const masteryAvg = useMemo(() => {
    const vals = Object.values(progress.masteryScores);
    return vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
  }, [progress.masteryScores]);

  const todayXP = progress.lessonsToday * 25; // approximate XP earned today

  const nextLesson = MICRO_LESSONS[0];

  const displayGreeting = profile.displayName
    ? `${clock.greeting}, ${profile.displayName}`
    : clock.greeting;

  return (
    <div className="min-h-screen pb-24">
      {/* Section 1: Header */}
      <div className="px-5 pt-14 pb-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between mb-1">
          <p className="section-label text-primary">Wisdom AI</p>
          <span className="text-[11px] font-mono text-muted-foreground">{clock.timeStr}</span>
        </motion.div>

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

        {/* Day progress — thin line */}
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

      {/* Section 2: Daily Wisdom */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mx-5 mb-8"
      >
        <div className="editorial-divider mb-4" />
        <p className="section-label mb-3">Daily Wisdom</p>
        <p className="text-[15px] italic leading-relaxed text-muted-foreground">"{quote}"</p>
        <div className="editorial-divider mt-4" />
      </motion.div>

      {/* Section 3: Scoreboard */}
      <div className="grid grid-cols-2 gap-3 px-5 mb-8">
        <StatBlock label="Tokens" value={progress.tokens} icon="✦" accent delay={0.2} />
        <StatBlock label="Streak" value={progress.streak} icon="🔥" delay={0.25} />
        <StatBlock label="Mastery" value={`${masteryAvg}%`} icon="◉" delay={0.3} />
        <StatBlock label="Today" value={todayXP} icon="⚡" delay={0.35} />
      </div>

      {/* Section 4: Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="flex justify-between px-8 mb-8"
      >
        {QUICK_ACTIONS.map(({ icon: Icon, label, to }) => (
          <Link key={to} to={to} className="flex flex-col items-center gap-1.5 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-2 border border-border group-hover:border-primary/30 transition-colors">
              <Icon className="h-[18px] w-[18px] text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
          </Link>
        ))}
      </motion.div>

      {/* Section 5: Today's Mission */}
      <div className="px-5 mb-8">
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

      {/* Section 6: Focus Sprint (single utility) */}
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
