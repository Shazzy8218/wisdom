import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Target, Gamepad2, BarChart3, Wallet, ShoppingBag, TrendingDown, Share2, Sparkles, Clock, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import StatBlock from "@/components/StatBlock";
import { QUOTES, MICRO_LESSONS } from "@/lib/data";
import { useProgress } from "@/hooks/useProgress";
import { CATEGORY_TRACKS } from "@/lib/categories";
import { useLiveClock } from "@/hooks/useLiveClock";
import { useUserProfile } from "@/hooks/useUserProfile";

export default function Index() {
  const [quote, setQuote] = useState("");
  const { progress } = useProgress();
  const clock = useLiveClock();
  const { profile, updateProfile } = useUserProfile();
  const [showNameInput, setShowNameInput] = useState(false);
  const [nameValue, setNameValue] = useState("");

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

  const weakestCategory = useMemo(() => {
    if (Object.keys(progress.masteryScores).length === 0) return CATEGORY_TRACKS[0];
    const sorted = CATEGORY_TRACKS
      .map(t => ({ track: t, score: progress.masteryScores[t.id] || 0 }))
      .sort((a, b) => a.score - b.score);
    return sorted[0]?.track;
  }, [progress.masteryScores]);

  const wisdomOfDay = useMemo(() => {
    const dayIndex = Math.floor(Date.now() / 86400000) % CATEGORY_TRACKS.length;
    const track = CATEGORY_TRACKS[dayIndex];
    const lesson = track.starterLessons[0];
    return { track, lesson };
  }, []);

  const referralCode = useMemo(() => {
    let code = localStorage.getItem("wisdom-referral-code");
    if (!code) {
      code = "WISE-" + Math.random().toString(36).slice(2, 6).toUpperCase();
      localStorage.setItem("wisdom-referral-code", code);
    }
    return code;
  }, []);

  const handleShareApp = async () => {
    const text = `🧠 I'm getting smarter every day with Wisdom AI — the app that teaches you how to use AI like a pro. Use my code ${referralCode} for bonus tokens!\n\nDownload: wisdom.ai`;
    if (navigator.share) {
      try { await navigator.share({ title: "Wisdom AI", text }); } catch {}
    } else {
      navigator.clipboard.writeText(text);
    }
  };

  const handleSetName = () => {
    if (nameValue.trim()) {
      updateProfile({ displayName: nameValue.trim() });
      setShowNameInput(false);
      setNameValue("");
    }
  };

  const displayGreeting = profile.displayName
    ? `${clock.greeting}, ${profile.displayName}`
    : clock.greeting;

  return (
    <div className="min-h-screen pb-24">
      {/* Header with live time */}
      <div className="px-5 pt-14 pb-2">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between mb-1">
          <p className="section-label text-primary">Wisdom AI</p>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span className="text-micro font-mono">{clock.timeStr}</span>
          </div>
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="font-display text-h1 text-foreground">
          {displayGreeting}
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
          className="text-caption text-muted-foreground mt-1">
          {clock.dateStr}
        </motion.p>

        {/* Day progress bar */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-3 mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-micro text-muted-foreground">Day progress</span>
            <span className="text-micro text-muted-foreground font-mono">{clock.dayProgress}%</span>
          </div>
          <div className="h-1 w-full rounded-full bg-surface-2 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary/60"
              initial={{ width: 0 }}
              animate={{ width: `${clock.dayProgress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <p className="text-micro text-muted-foreground/60 mt-1 italic">Time is passing — learn something today.</p>
        </motion.div>

        {/* Set name prompt if no name */}
        {!profile.displayName && !showNameInput && (
          <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
            onClick={() => setShowNameInput(true)}
            className="mt-2 text-caption text-primary underline underline-offset-2">
            Set your name for a personalized experience →
          </motion.button>
        )}
        {showNameInput && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-2 flex gap-2">
            <input value={nameValue} onChange={e => setNameValue(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSetName()}
              placeholder="Your name" autoFocus
              className="flex-1 rounded-xl bg-surface-2 border border-border px-3 py-2 text-caption text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/40" />
            <button onClick={handleSetName} className="rounded-xl bg-primary px-4 py-2 text-caption text-primary-foreground font-medium">Save</button>
          </motion.div>
        )}
      </div>

      {/* Quote */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mx-5 mb-6 mt-4">
        <div className="editorial-divider mb-4" />
        <p className="text-body italic leading-relaxed text-muted-foreground">"{quote}"</p>
        <div className="editorial-divider mt-4" />
        <p className="mt-3 section-label">Daily Wisdom</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 px-5 mb-6">
        <StatBlock label="Tokens" value={progress.tokens} icon="✦" accent delay={0.1} />
        <StatBlock label="Streak" value={progress.streak} icon="🔥" delay={0.15} />
        <StatBlock label="Mastery" value={`${masteryAvg}%`} icon="📊" delay={0.2} />
      </div>

      {/* Focus Sprint */}
      <div className="px-5 mb-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.23 }}>
          <Link to="/feed" className="glass-card p-4 flex items-center gap-3 group hover:border-accent-gold/20 transition-all block border-accent-gold/10">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent-gold/10">
              <Zap className="h-5 w-5 text-accent-gold" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-caption font-semibold text-foreground">10-Minute Wisdom Sprint</p>
              <p className="text-micro text-muted-foreground">Quick learning session · earn bonus tokens</p>
            </div>
            <ChevronRight className="h-4 w-4 text-text-tertiary" />
          </Link>
        </motion.div>
      </div>

      {/* Quick Access Icon Cards */}
      <div className="grid grid-cols-2 gap-3 px-5 mb-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Link to="/wallet" className="glass-card p-4 flex items-center gap-3 group hover:border-accent-gold/20 transition-all block">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent-gold/10">
              <Wallet className="h-5 w-5 text-accent-gold" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-caption font-semibold text-foreground">Wallet</p>
              <p className="text-micro text-accent-gold font-bold">{progress.tokens} ✦</p>
            </div>
          </Link>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
          <Link to="/store" className="glass-card p-4 flex items-center gap-3 group hover:border-primary/20 transition-all block">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
              <ShoppingBag className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-caption font-semibold text-foreground">Store</p>
              <p className="text-micro text-muted-foreground">Unlock packs</p>
            </div>
          </Link>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.31 }}>
          <Link to="/mastery" className="glass-card p-4 flex items-center gap-3 group hover:border-primary/20 transition-all block">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-caption font-semibold text-foreground">Mastery</p>
              <p className="text-micro text-muted-foreground">{masteryAvg}% avg</p>
            </div>
          </Link>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34 }}>
          <Link to="/games" className="glass-card p-4 flex items-center gap-3 group hover:border-primary/20 transition-all block glow-red">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
              <Gamepad2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-caption font-semibold text-foreground">Games</p>
              <p className="text-micro text-muted-foreground">Daily challenge</p>
            </div>
          </Link>
        </motion.div>
      </div>

      {/* Today's Mission */}
      <div className="px-5 mb-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.37 }}>
          <h2 className="section-label mb-3">Today's Mission</h2>
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

      {/* Wisdom of the Day */}
      <div className="px-5 mb-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <h2 className="section-label mb-3">Wisdom of the Day</h2>
          <Link to={`/category/${wisdomOfDay.track.id}/lesson?level=Beginner&mod=0&lesson=0`}
            className="glass-card p-5 group hover:border-accent-gold/20 transition-all block border-accent-gold/10">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{wisdomOfDay.track.icon}</span>
              <span className="section-label text-accent-gold">{wisdomOfDay.track.name}</span>
            </div>
            <p className="text-body font-semibold text-foreground mb-1">{wisdomOfDay.lesson?.title}</p>
            <p className="text-caption text-muted-foreground">{wisdomOfDay.lesson?.hook}</p>
            {wisdomOfDay.lesson?.bragLine && (
              <p className="text-caption italic text-accent-gold/80 mt-2">"{wisdomOfDay.lesson.bragLine}"</p>
            )}
          </Link>
        </motion.div>
      </div>

      {/* Weakest Category */}
      {weakestCategory && (
        <div className="px-5 mb-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.43 }}>
            <h2 className="section-label mb-3">Level Up Your Weakest</h2>
            <Link to={`/category/${weakestCategory.id}`}
              className="glass-card p-4 flex items-center gap-4 group hover:border-destructive/20 transition-all block border-destructive/10">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-destructive/10">
                <TrendingDown className="h-5 w-5 text-destructive" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body font-semibold text-foreground">{weakestCategory.icon} {weakestCategory.name}</p>
                <p className="text-caption text-muted-foreground">{progress.masteryScores[weakestCategory.id] || 0}% mastery — time to improve</p>
              </div>
              <ChevronRight className="h-4 w-4 text-text-tertiary" />
            </Link>
          </motion.div>
        </div>
      )}

      {/* Share */}
      <div className="px-5 mb-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.46 }}>
          <button onClick={handleShareApp}
            className="w-full glass-card p-4 flex items-center gap-4 hover:border-primary/20 transition-all border-primary/10">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
              <Share2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-body font-semibold text-foreground">Invite Friends</p>
              <p className="text-caption text-muted-foreground">Both earn 50 tokens · Code: <span className="text-primary font-mono">{referralCode}</span></p>
            </div>
            <ChevronRight className="h-4 w-4 text-text-tertiary" />
          </button>
        </motion.div>
      </div>
    </div>
  );
}
