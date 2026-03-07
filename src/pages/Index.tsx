import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Flame, Sparkles, Target, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import StatBlock from "@/components/StatBlock";
import { QUOTES, MICRO_LESSONS, TRACKS } from "@/lib/data";

export default function Index() {
  const [quote, setQuote] = useState("");

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

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-5 pt-12 pb-6">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-1"
        >
          Wisdom AI
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="font-display text-2xl font-bold text-foreground"
        >
          Good evening
        </motion.h1>
      </div>

      {/* Quote */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mx-5 mb-6 rounded-2xl border border-border bg-card/50 p-5"
      >
        <p className="text-sm italic leading-relaxed text-muted-foreground">"{quote}"</p>
        <p className="mt-2 text-[10px] uppercase tracking-widest text-text-tertiary">Daily Wisdom</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 px-5 mb-6">
        <StatBlock label="Wisdom Tokens" value={142} icon="✦" accent delay={0.1} />
        <StatBlock label="Day Streak" value={7} icon="🔥" delay={0.15} />
        <StatBlock label="Mastery" value="5%" icon="📊" delay={0.2} />
        <StatBlock label="Lessons Done" value={11} icon="✅" delay={0.25} />
      </div>

      {/* Today's Mission */}
      <div className="px-5 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Today's Mission
          </h2>
          <Link to="/feed" className="glass-card p-4 flex items-center gap-4 group hover:border-primary/20 transition-colors block">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Target className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{nextLesson.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{nextLesson.track} · +{nextLesson.tokens} tokens</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </Link>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div className="px-5">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Continue Learning
        </h2>
        <div className="space-y-2">
          {TRACKS.slice(0, 4).map((track, i) => (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + i * 0.05 }}
            >
              <Link
                to="/paths"
                className="glass-card p-3.5 flex items-center gap-3 group hover:border-primary/10 transition-colors block"
              >
                <span className="text-xl">{track.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{track.name}</p>
                  <p className="text-[11px] text-muted-foreground">{track.completed}/{track.lessons} lessons</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-16 rounded-full bg-secondary overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${(track.completed / track.lessons) * 100}%` }}
                      transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                    />
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-text-tertiary" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
