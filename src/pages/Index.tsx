import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Target, Gamepad2, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import StatBlock from "@/components/StatBlock";
import { QUOTES, MICRO_LESSONS } from "@/lib/data";
import { useProgress } from "@/hooks/useProgress";

export default function Index() {
  const [quote, setQuote] = useState("");
  const { progress } = useProgress();

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

  const nextLesson = MICRO_LESSONS[0];
  const masteryAvg = Object.values(progress.masteryScores).length > 0
    ? Math.round(Object.values(progress.masteryScores).reduce((a, b) => a + b, 0) / Object.values(progress.masteryScores).length)
    : 0;

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-5 pt-14 pb-8">
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="section-label text-primary mb-2">
          Wisdom AI
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="font-display text-h1 text-foreground">
          Good evening
        </motion.h1>
      </div>

      {/* Quote */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mx-5 mb-8">
        <div className="editorial-divider mb-4" />
        <p className="text-body italic leading-relaxed text-muted-foreground">"{quote}"</p>
        <div className="editorial-divider mt-4" />
        <p className="mt-3 section-label">Daily Wisdom</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 px-5 mb-6">
        <StatBlock label="Wisdom Tokens" value={progress.tokens} icon="✦" accent delay={0.1} />
        <StatBlock label="Day Streak" value={progress.streak} icon="🔥" delay={0.15} />
        <StatBlock label="Mastery" value={`${masteryAvg}%`} icon="📊" delay={0.2} />
        <StatBlock label="Lessons Done" value={progress.completedLessons.length} icon="✅" delay={0.25} />
      </div>

      {/* Games + Mastery shortcut cards */}
      <div className="grid grid-cols-2 gap-3 px-5 mb-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
          <Link to="/games" className="glass-card p-4 flex flex-col items-center gap-3 text-center group hover:border-primary/20 transition-all block glow-red">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <Gamepad2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-body font-semibold text-foreground">Games</p>
              <p className="text-micro text-muted-foreground mt-0.5">Learn by playing</p>
            </div>
          </Link>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}>
          <Link to="/mastery" className="glass-card p-4 flex flex-col items-center gap-3 text-center group hover:border-primary/20 transition-all block glow-red">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-body font-semibold text-foreground">Mastery</p>
              <p className="text-micro text-muted-foreground mt-0.5">{masteryAvg}% avg score</p>
            </div>
          </Link>
        </motion.div>
      </div>

      {/* Today's Mission */}
      <div className="px-5">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <h2 className="section-label mb-4">Today's Mission</h2>
          <Link to="/feed" className="glass-card p-5 flex items-center gap-4 group hover:border-primary/20 transition-all block">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Target className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body font-semibold text-foreground">{nextLesson.title}</p>
              <p className="text-caption text-muted-foreground mt-0.5">{nextLesson.track} · +{nextLesson.tokens} tokens</p>
            </div>
            <ChevronRight className="h-4 w-4 text-text-tertiary group-hover:text-foreground transition-colors" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
