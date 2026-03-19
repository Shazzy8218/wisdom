import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Flame, Zap, Star, ChevronRight, Trophy, Target, Gamepad2 } from "lucide-react";
import HiddenOwl from "@/components/HiddenOwl";
import { getArcadeStats, ACHIEVEMENTS } from "@/lib/arcade-engine";

interface ArcadeGame {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  route: string;
  gradient: string;
  glowColor: string;
  description: string;
  xpReward: string;
  tokenReward: string;
  tags: string[];
}

const GAMES: ArcadeGame[] = [
  {
    id: "mind-serpent",
    title: "Mind Serpent",
    subtitle: "AI Data Stream",
    icon: "🐍",
    route: "/games/mind-serpent",
    gradient: "from-emerald-500/25 via-emerald-900/10 to-transparent",
    glowColor: "shadow-emerald-500/10",
    description: "Navigate a data serpent through neural pathways. Consume correct AI concepts to grow, fork your path for bonus captures, and dodge misinformation traps. Speed increases with every correct node.",
    xpReward: "+25 XP",
    tokenReward: "+5 tokens",
    tags: ["Action", "Strategy"],
  },
  {
    id: "insight-pilot",
    title: "Insight Pilot",
    subtitle: "Logic Labyrinth",
    icon: "✈️",
    route: "/games/insight-pilot",
    gradient: "from-sky-500/25 via-sky-900/10 to-transparent",
    glowColor: "shadow-sky-500/10",
    description: "Pilot an AI drone through a procedural data highway. Dodge obstacles, collect algorithm upgrades, and make split-second prompt decisions at every fork. Wrong choices slow you down.",
    xpReward: "+30 XP",
    tokenReward: "+8 tokens",
    tags: ["Endless Runner", "Decision"],
  },
  {
    id: "syntax-smash",
    title: "Syntax Smash",
    subtitle: "Code Catapult",
    icon: "🏗️",
    route: "/games/syntax-smash",
    gradient: "from-amber-500/25 via-amber-900/10 to-transparent",
    glowColor: "shadow-amber-500/10",
    description: "Launch logic blocks from a slingshot to demolish bug fortresses. Each block type has unique physics — functions explode, variables are heavy, conditionals split mid-air. Strategic destruction meets coding knowledge.",
    xpReward: "+35 XP",
    tokenReward: "+10 tokens",
    tags: ["Physics", "Puzzle"],
  },
];

export default function Games() {
  const stats = useMemo(getArcadeStats, []);
  const unlockedAchievements = stats.achievements || [];

  return (
    <div className="min-h-screen pb-24">
      {/* Hero */}
      <div className="px-5 pt-14 pb-2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Gamepad2 className="h-4 w-4 text-primary" />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Knowledge Arcade</p>
          </div>
          <h1 className="font-display text-3xl font-black text-foreground leading-tight">
            Play Hard.<br />Learn Harder.
          </h1>
          <p className="text-sm text-muted-foreground mt-3 max-w-md leading-relaxed">
            Three high-octane games. Real mechanics. Real skills. Every round reinforces AI mastery through addictive gameplay.
          </p>
        </motion.div>
        <HiddenOwl locationId="games-header" className="absolute right-6 top-16" size={18} />
      </div>

      {/* Stats Bar */}
      <div className="px-5 mt-6 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-4"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="text-center flex-1">
              <p className="text-xl font-black text-foreground tabular-nums">{stats.gamesPlayed}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider font-medium">Played</p>
            </div>
            <div className="w-px h-10 bg-border/50" />
            <div className="text-center flex-1">
              <p className="text-xl font-black text-foreground tabular-nums">{stats.totalScore.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider font-medium">Total Score</p>
            </div>
            <div className="w-px h-10 bg-border/50" />
            <div className="text-center flex-1">
              <p className="text-xl font-black text-accent-gold tabular-nums flex items-center justify-center gap-1">
                <Flame className="h-4 w-4" />{stats.bestStreak}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider font-medium">Best Streak</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Game Cards */}
      <div className="px-5 space-y-4">
        {GAMES.map((game, i) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1, duration: 0.45 }}
          >
            <Link to={game.route} className="block group">
              <div className={`relative rounded-2xl border border-border/40 bg-gradient-to-br ${game.gradient} overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-xl ${game.glowColor}`}>
                {/* Glow dot */}
                <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary/60 animate-pulse" />
                
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-background/70 border border-border/30 flex items-center justify-center text-4xl shrink-0 shadow-inner">
                      {game.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-black text-foreground tracking-tight">{game.title}</h3>
                      </div>
                      <p className="text-xs font-semibold text-primary/80 mb-2">{game.subtitle}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{game.description}</p>
                      
                      <div className="flex items-center gap-3 mt-3">
                        {game.tags.map(tag => (
                          <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground font-semibold border border-border/30">{tag}</span>
                        ))}
                        <span className="text-[10px] text-accent-gold flex items-center gap-0.5 font-bold ml-auto">
                          <Zap className="h-3 w-3" /> {game.xpReward}
                        </span>
                        <span className="text-[10px] text-primary flex items-center gap-0.5 font-bold">
                          <Star className="h-3 w-3" /> {game.tokenReward}
                        </span>
                      </div>

                      {/* Best score */}
                      {(stats.bestScores[game.id] || 0) > 0 && (
                        <div className="mt-2 flex items-center gap-1.5">
                          <Trophy className="h-3 w-3 text-accent-gold" />
                          <span className="text-[10px] text-muted-foreground font-medium">
                            Best: <b className="text-foreground">{stats.bestScores[game.id]}</b>
                          </span>
                        </div>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-2" />
                  </div>
                </div>

                {/* Play button bar */}
                <div className="px-5 pb-4">
                  <div className="h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center gap-2 text-sm font-bold text-primary group-hover:bg-primary/20 transition-colors">
                    <Target className="h-4 w-4" />
                    PLAY NOW
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Achievements */}
      {Object.keys(ACHIEVEMENTS).length > 0 && (
        <div className="px-5 mt-8">
          <h2 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wider">Achievements</h2>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
            {Object.entries(ACHIEVEMENTS).map(([id, ach]) => {
              const unlocked = unlockedAchievements.includes(id);
              return (
                <div
                  key={id}
                  className={`shrink-0 w-20 rounded-xl border p-3 text-center transition-all ${
                    unlocked
                      ? "bg-accent-gold/10 border-accent-gold/30"
                      : "bg-card/30 border-border/30 opacity-40"
                  }`}
                >
                  <div className="text-2xl mb-1">{ach.icon}</div>
                  <p className="text-[9px] font-bold text-foreground leading-tight">{ach.title}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Legacy games link */}
      <div className="px-5 mt-8">
        <div className="rounded-2xl border border-border/30 bg-card/30 p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Classic Games</p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "AI Navigator", route: "/games/ai-navigator", icon: "🐍" },
              { label: "Logic Link", route: "/games/logic-link", icon: "🧩" },
              { label: "Prompt Pro", route: "/games/prompt-pro", icon: "⌨️" },
            ].map(g => (
              <Link
                key={g.route}
                to={g.route}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/30 border border-border/30 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/20 transition-colors"
              >
                <span>{g.icon}</span> {g.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="px-5 mt-6 mb-4">
        <div className="rounded-2xl border border-border/20 bg-card/20 p-5 text-center">
          <p className="text-xs text-muted-foreground">
            Game performance feeds directly into your mastery scores & token wallet.
          </p>
          <Link to="/courses" className="text-xs font-bold text-primary hover:underline mt-1 inline-block">
            Explore Courses →
          </Link>
        </div>
      </div>
    </div>
  );
}
