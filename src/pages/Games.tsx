import { useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Flame, Zap, Star, ChevronRight, Trophy, Target, Gamepad2, Crown, Rocket } from "lucide-react";
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
  badge?: string;
}

const GAMES: ArcadeGame[] = [
  {
    id: "echoes-of-zero",
    title: "Echoes of Zero",
    subtitle: "Survival Extraction",
    icon: "👁",
    route: "/games/echoes-of-zero",
    gradient: "from-red-500/25 via-red-900/10 to-transparent",
    glowColor: "shadow-red-500/10",
    description: "Scavenge corrupted data shards in a dark megastructure while a reality-warping Glitch Entity hunts you. Collect 3 shards and extract alive.",
    xpReward: "+30 XP",
    tokenReward: "+8 tokens",
    tags: ["Survival", "Horror"],
    badge: "NEW",
  },
  {
    id: "quantum-pulse",
    title: "Quantum Pulse",
    subtitle: "Rhythm Bullet Hell",
    icon: "💠",
    route: "/games/quantum-pulse",
    gradient: "from-violet-500/25 via-pink-900/10 to-transparent",
    glowColor: "shadow-violet-500/10",
    description: "Pilot a Phase Ship through waves of music-synced bullet patterns. Dodge, chain combos, and collect bursts in this precision score-attack.",
    xpReward: "+35 XP",
    tokenReward: "+10 tokens",
    tags: ["Rhythm", "Precision"],
    badge: "NEW",
  },
  {
    id: "neural-nexus",
    title: "Neural Nexus",
    subtitle: "Grand Strategy Sandbox",
    icon: "🏙️",
    route: "/games/neural-nexus",
    gradient: "from-cyan-500/25 via-cyan-900/10 to-transparent",
    glowColor: "shadow-cyan-500/10",
    description: "Choose a specialization, build an AI Megalopolis across 40 turns. Manage factions, survive crises, and maximize influence.",
    xpReward: "+40 XP",
    tokenReward: "+12 tokens",
    tags: ["Strategy", "Sandbox"],
    badge: "NEW",
  },
  {
    id: "synthesis-ascent",
    title: "Synthesis Ascent",
    subtitle: "Roguelite Action",
    icon: "🚀",
    route: "/games/synthesis-ascent",
    gradient: "from-violet-500/25 via-violet-900/10 to-transparent",
    glowColor: "shadow-violet-500/10",
    description: "Battle through an infinite Data Tower. Collect Wisdom Modules to build devastating synergies. Survive waves of Cognitive Blocks.",
    xpReward: "+30 XP",
    tokenReward: "+8 tokens",
    tags: ["Roguelite", "Action"],
  },
  {
    id: "chrono-drift",
    title: "Chrono-Drift",
    subtitle: "Physics Racer",
    icon: "🏎️",
    route: "/games/chrono-drift",
    gradient: "from-indigo-500/25 via-indigo-900/10 to-transparent",
    glowColor: "shadow-indigo-500/10",
    description: "Pilot a Hover-Bike at breakneck speed through procedural data highways. Dodge, drift, and collect turbo boosts.",
    xpReward: "+25 XP",
    tokenReward: "+6 tokens",
    tags: ["Racing", "Endless"],
  },
  {
    id: "mind-serpent",
    title: "Mind Serpent",
    subtitle: "AI Data Stream",
    icon: "🐍",
    route: "/games/mind-serpent",
    gradient: "from-emerald-500/25 via-emerald-900/10 to-transparent",
    glowColor: "shadow-emerald-500/10",
    description: "Navigate a data serpent through neural pathways. Consume AI concepts, fork for bonus captures, dodge misinformation traps.",
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
    description: "Pilot an AI drone through a procedural data highway. Dodge obstacles, collect upgrades, make split-second decisions.",
    xpReward: "+30 XP",
    tokenReward: "+8 tokens",
    tags: ["Runner", "Decision"],
  },
  {
    id: "syntax-smash",
    title: "Syntax Smash",
    subtitle: "Code Catapult",
    icon: "🏗️",
    route: "/games/syntax-smash",
    gradient: "from-amber-500/25 via-amber-900/10 to-transparent",
    glowColor: "shadow-amber-500/10",
    description: "Launch logic blocks to demolish bug fortresses. Functions explode, variables are heavy, conditionals split mid-air.",
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Gamepad2 className="h-4 w-4 text-primary" />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Project Legend</p>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-black ml-1">2026</span>
          </div>
          <h1 className="font-display text-3xl font-black text-foreground leading-tight mt-2">
            Knowledge<br />Arcade
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-md leading-relaxed">
            Six high-octane titles. Real mechanics. Real skills. Every round feeds your mastery.
          </p>
        </motion.div>
        <HiddenOwl locationId="games-header" className="absolute right-6 top-16" size={18} />
      </div>

      {/* Stats Bar */}
      <div className="px-5 mt-5 mb-5">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="text-center flex-1">
              <p className="text-xl font-black text-foreground tabular-nums">{stats.gamesPlayed}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider font-medium">Played</p>
            </div>
            <div className="w-px h-10 bg-border/50" />
            <div className="text-center flex-1">
              <p className="text-xl font-black text-foreground tabular-nums">{stats.totalScore.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider font-medium">Score</p>
            </div>
            <div className="w-px h-10 bg-border/50" />
            <div className="text-center flex-1">
              <p className="text-xl font-black text-accent-gold tabular-nums flex items-center justify-center gap-1">
                <Flame className="h-4 w-4" />{stats.bestStreak}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider font-medium">Streak</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Game Cards */}
      <div className="px-5 space-y-3">
        {GAMES.map((game, i) => (
          <motion.div key={game.id} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.07, duration: 0.4 }}>
            <Link to={game.route} className="block group">
              <div className={`relative rounded-2xl border border-border/40 bg-gradient-to-br ${game.gradient} overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-xl ${game.glowColor}`}>
                {game.badge && (
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[9px] font-black">{game.badge}</div>
                )}
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-14 h-14 rounded-xl bg-background/70 border border-border/30 flex items-center justify-center text-3xl shrink-0 shadow-inner">
                      {game.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-black text-foreground tracking-tight">{game.title}</h3>
                      <p className="text-[10px] font-semibold text-primary/80 mb-1">{game.subtitle}</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{game.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {game.tags.map(tag => (
                          <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted/50 text-muted-foreground font-semibold border border-border/30">{tag}</span>
                        ))}
                        <span className="text-[9px] text-accent-gold flex items-center gap-0.5 font-bold ml-auto"><Zap className="h-3 w-3" />{game.xpReward}</span>
                        <span className="text-[9px] text-primary flex items-center gap-0.5 font-bold"><Star className="h-3 w-3" />{game.tokenReward}</span>
                      </div>
                      {(stats.bestScores[game.id] || 0) > 0 && (
                        <div className="mt-1.5 flex items-center gap-1">
                          <Trophy className="h-3 w-3 text-accent-gold" />
                          <span className="text-[9px] text-muted-foreground font-medium">Best: <b className="text-foreground">{stats.bestScores[game.id]}</b></span>
                        </div>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Leaderboard — Personal Best Rankings */}
      <div className="px-5 mt-7">
        <h2 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
          <Crown className="h-4 w-4 text-primary" /> Personal Leaderboard
        </h2>
        <div className="rounded-2xl border border-border/50 bg-card/60 overflow-hidden">
          {GAMES.filter(g => (stats.bestScores[g.id] || 0) > 0)
            .sort((a, b) => (stats.bestScores[b.id] || 0) - (stats.bestScores[a.id] || 0))
            .slice(0, 5)
            .map((game, i) => (
              <Link key={game.id} to={game.route} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors border-b border-border/20 last:border-b-0">
                <span className={`text-sm font-black w-6 text-center ${i === 0 ? "text-primary" : i === 1 ? "text-amber-400" : "text-muted-foreground"}`}>
                  #{i + 1}
                </span>
                <span className="text-lg">{game.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground">{game.title}</p>
                  <p className="text-[10px] text-muted-foreground">{game.subtitle}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-foreground">{stats.bestScores[game.id]?.toLocaleString()}</p>
                  <p className="text-[9px] text-muted-foreground">pts</p>
                </div>
              </Link>
            ))}
          {GAMES.filter(g => (stats.bestScores[g.id] || 0) > 0).length === 0 && (
            <div className="p-6 text-center">
              <p className="text-xs text-muted-foreground">Play games to populate your leaderboard</p>
            </div>
          )}
        </div>
      </div>

      {/* Achievements */}
      <div className="px-5 mt-7">
        <h2 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wider">Achievements</h2>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
          {Object.entries(ACHIEVEMENTS).map(([id, ach]) => {
            const unlocked = unlockedAchievements.includes(id);
            return (
              <div key={id} className={`shrink-0 w-20 rounded-xl border p-3 text-center transition-all ${unlocked ? "bg-primary/10 border-primary/30" : "bg-card/30 border-border/30 opacity-40"}`}>
                <div className="text-2xl mb-1">{ach.icon}</div>
                <p className="text-[9px] font-bold text-foreground leading-tight">{ach.title}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Classic games */}
      <div className="px-5 mt-7">
        <div className="rounded-2xl border border-border/30 bg-card/30 p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Classic Games</p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "AI Navigator", route: "/games/ai-navigator", icon: "🐍" },
              { label: "Logic Link", route: "/games/logic-link", icon: "🧩" },
              { label: "Prompt Pro", route: "/games/prompt-pro", icon: "⌨️" },
            ].map(g => (
              <Link key={g.route} to={g.route} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/30 border border-border/30 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/20 transition-colors">
                <span>{g.icon}</span> {g.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="px-5 mt-5 mb-4">
        <div className="rounded-2xl border border-border/20 bg-card/20 p-5 text-center">
          <p className="text-xs text-muted-foreground">Game performance feeds directly into your mastery scores & token wallet.</p>
          <Link to="/courses" className="text-xs font-bold text-primary hover:underline mt-1 inline-block">Explore Courses →</Link>
        </div>
      </div>
    </div>
  );
}
