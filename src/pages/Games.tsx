import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Trophy, Lock, Flame, Target, Star, Shield, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { GAME_CATEGORIES, GAME_ACHIEVEMENTS, type GameCategory, type Game } from "@/lib/data";
import { useProgress } from "@/hooks/useProgress";
import HiddenOwl from "@/components/HiddenOwl";
import { Progress } from "@/components/ui/progress";

const GAME_ROUTES: Record<string, string> = {
  "hallucination-hunter": "/games/hallucination-hunter",
  "prompt-puzzle": "/games/prompt-puzzle",
  "output-duel": "/games/output-duel",
  "time-trial": "/games/time-trial",
  "prompt-surgery": "/games/prompt-surgery",
  "live-fire-drills": "/drills",
};

const DIFFICULTY_BADGE: Record<string, { label: string; class: string }> = {
  beginner: { label: "Beginner", class: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
  intermediate: { label: "Intermediate", class: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
  advanced: { label: "Advanced", class: "bg-red-500/15 text-red-400 border-red-500/20" },
};

function getGameStats(): { gamesPlayed: number; totalScore: number; bestStreak: number } {
  try {
    const raw = localStorage.getItem("wisdom-game-stats");
    if (raw) return JSON.parse(raw);
  } catch {}
  return { gamesPlayed: 0, totalScore: 0, bestStreak: 0 };
}

function getUnlockedAchievements(): string[] {
  try {
    const raw = localStorage.getItem("wisdom-game-achievements");
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function CategorySection({ category, index }: { category: GameCategory; index: number }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="mb-8"
    >
      {/* Category Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left group"
      >
        <div className={`rounded-2xl p-5 bg-gradient-to-r ${category.accentColor} border border-border/50 transition-all duration-300 hover:border-primary/20`}>
          <div className="flex items-start gap-3">
            <span className="text-3xl mt-0.5">{category.icon}</span>
            <div className="flex-1 min-w-0">
              <h2 className="font-display text-lg font-bold text-foreground tracking-tight">
                {category.title}
              </h2>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                {category.strategicObjective}
              </p>
              <div className="flex items-center gap-3 mt-3">
                <span className="section-label">{category.games.length} challenges</span>
                <span className="text-micro text-muted-foreground">•</span>
                <span className="section-label text-accent-gold flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  {category.games.reduce((sum, g) => sum + g.xpReward, 0)} XP total
                </span>
              </div>
            </div>
            <ChevronRight className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${expanded ? "rotate-90" : ""}`} />
          </div>
        </div>
      </button>

      {/* Games List */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 mt-3 pl-2">
              {category.games.map((game, gi) => (
                <GameCard key={game.id} game={game} index={gi} />
              ))}
            </div>

            {/* Wisdom Edge callout */}
            <div className="mt-3 ml-2 p-4 rounded-xl bg-card/50 border border-border/30">
              <div className="flex items-start gap-2">
                <Target className="h-4 w-4 text-accent-gold mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-accent-gold uppercase tracking-wider mb-1">Wisdom Owl's Edge</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{category.wisdomEdge}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

function GameCard({ game, index }: { game: Game; index: number }) {
  const route = GAME_ROUTES[game.id];
  const isPlayable = !!route;
  const diff = DIFFICULTY_BADGE[game.difficulty];

  const inner = (
    <div className="glass-card p-4 flex items-center gap-4 transition-all duration-200 hover:border-primary/20 group">
      <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center text-xl shrink-0">
        {game.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm font-semibold text-foreground">{game.name}</h3>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${diff.class}`}>
            {diff.label}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{game.description}</p>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="text-micro text-muted-foreground flex items-center gap-1">
            <Zap className="h-3 w-3 text-accent-gold" /> {game.xpReward} XP
          </span>
          <span className="text-micro text-muted-foreground flex items-center gap-1">
            <Star className="h-3 w-3 text-primary" /> {game.tokenReward} tokens
          </span>
          {isPlayable ? (
            <span className="text-micro text-emerald-400 font-semibold">● Ready</span>
          ) : (
            <span className="text-micro text-muted-foreground/60 italic flex items-center gap-1">
              <Lock className="h-3 w-3" /> Coming soon
            </span>
          )}
        </div>
      </div>
      <ChevronRight className={`h-4 w-4 shrink-0 ${isPlayable ? "text-muted-foreground group-hover:text-primary transition-colors" : "text-border"}`} />
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      {isPlayable ? (
        <Link to={route} className="block">{inner}</Link>
      ) : (
        <div className="opacity-60 cursor-not-allowed">{inner}</div>
      )}
    </motion.div>
  );
}

export default function Games() {
  const { progress } = useProgress();
  const stats = useMemo(getGameStats, []);
  const unlockedAchievements = useMemo(getUnlockedAchievements, []);
  const totalGames = GAME_CATEGORIES.reduce((sum, c) => sum + c.games.length, 0);
  const playableGames = GAME_CATEGORIES.reduce((sum, c) => sum + c.games.filter(g => GAME_ROUTES[g.id]).length, 0);

  return (
    <div className="min-h-screen pb-24">
      {/* Hero */}
      <div className="px-5 pt-14 pb-6 relative">
        <p className="section-label text-primary mb-2">Strategic Training</p>
        <h1 className="font-display text-h1 text-foreground">Skill<br />Arena</h1>
        <p className="text-body text-muted-foreground mt-2 max-w-md">
          Every game sharpens a real skill. Every round builds muscle memory. This isn't entertainment — it's training.
        </p>
        <HiddenOwl locationId="games-header" className="absolute right-6 top-16" size={18} />
      </div>

      {/* Stats Bar */}
      <div className="px-5 mb-6">
        <div className="glass-card p-4 flex items-center justify-between gap-4">
          <div className="text-center flex-1">
            <p className="stat-number text-lg text-foreground">{stats.gamesPlayed}</p>
            <p className="text-micro text-muted-foreground mt-0.5">Played</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center flex-1">
            <p className="stat-number text-lg text-foreground">{stats.totalScore}</p>
            <p className="text-micro text-muted-foreground mt-0.5">Total Score</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center flex-1">
            <p className="stat-number text-lg text-accent-gold flex items-center justify-center gap-1">
              <Flame className="h-4 w-4" />{stats.bestStreak}
            </p>
            <p className="text-micro text-muted-foreground mt-0.5">Best Streak</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center flex-1">
            <p className="stat-number text-lg text-foreground">{playableGames}/{totalGames}</p>
            <p className="text-micro text-muted-foreground mt-0.5">Available</p>
          </div>
        </div>
      </div>

      {/* Achievements Preview */}
      <div className="px-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-label text-foreground/80">Achievements</h2>
          <span className="text-micro text-muted-foreground">
            {unlockedAchievements.length}/{GAME_ACHIEVEMENTS.length} unlocked
          </span>
        </div>
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {GAME_ACHIEVEMENTS.map((ach) => {
            const unlocked = unlockedAchievements.includes(ach.id);
            return (
              <div
                key={ach.id}
                className={`shrink-0 w-16 flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all ${
                  unlocked
                    ? "bg-accent-gold/10 border-accent-gold/20"
                    : "bg-card/40 border-border/30 opacity-40"
                }`}
                title={`${ach.name}: ${ach.description}`}
              >
                <span className="text-xl">{ach.icon}</span>
                <p className="text-[9px] text-center text-muted-foreground leading-tight font-medium">{ach.name}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="editorial-divider mx-5 mb-6" />

      {/* Game Categories */}
      <div className="px-5">
        {GAME_CATEGORIES.map((category, i) => (
          <CategorySection key={category.id} category={category} index={i} />
        ))}
      </div>

      {/* CTA Footer */}
      <div className="px-5 mt-4">
        <div className="glass-card p-5 text-center">
          <p className="text-sm text-muted-foreground">
            More challenges unlock as you progress through courses.
          </p>
          <Link to="/courses" className="text-sm font-semibold text-primary hover:underline mt-1 inline-block">
            Explore Courses →
          </Link>
        </div>
      </div>
    </div>
  );
}
