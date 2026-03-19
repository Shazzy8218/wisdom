// Shared arcade utilities — stats, XP integration, content pools

import { loadCachedProgress, saveCacheProgress, saveCloudProgress } from "@/lib/progress";

// ---------- Arcade Stats (localStorage) ----------

export interface ArcadeStats {
  gamesPlayed: number;
  totalScore: number;
  bestStreak: number;
  bestScores: Record<string, number>; // gameId -> best score
  achievements: string[];
}

const STATS_KEY = "wisdom-arcade-stats";

export function getArcadeStats(): ArcadeStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { gamesPlayed: 0, totalScore: 0, bestStreak: 0, bestScores: {}, achievements: [], ...parsed };
    }
  } catch {}
  return { gamesPlayed: 0, totalScore: 0, bestStreak: 0, bestScores: {}, achievements: [] };
}

export function saveArcadeStats(stats: ArcadeStats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

export function recordGameResult(gameId: string, score: number, streak?: number) {
  const stats = getArcadeStats();
  stats.gamesPlayed += 1;
  stats.totalScore += score;
  if (streak && streak > stats.bestStreak) stats.bestStreak = streak;
  stats.bestScores[gameId] = Math.max(stats.bestScores[gameId] || 0, score);

  // Check achievements
  const checks: [string, () => boolean][] = [
    ["first-game", () => stats.gamesPlayed >= 1],
    ["arcade-veteran", () => stats.gamesPlayed >= 25],
    ["score-hunter", () => stats.totalScore >= 1000],
    ["score-legend", () => stats.totalScore >= 10000],
    ["streak-master", () => stats.bestStreak >= 15],
    ["serpent-ace", () => (stats.bestScores["mind-serpent"] || 0) >= 200],
    ["pilot-pro", () => (stats.bestScores["insight-pilot"] || 0) >= 300],
    ["syntax-king", () => (stats.bestScores["syntax-smash"] || 0) >= 500],
    ["ascent-legend", () => (stats.bestScores["synthesis-ascent"] || 0) >= 400],
    ["drift-master", () => (stats.bestScores["chrono-drift"] || 0) >= 500],
    ["nexus-architect", () => (stats.bestScores["neural-nexus"] || 0) >= 300],
  ];
  for (const [id, check] of checks) {
    if (check() && !stats.achievements.includes(id)) {
      stats.achievements.push(id);
    }
  }

  saveArcadeStats(stats);

  // Award XP & tokens to progress
  const xpEarned = Math.floor(score / 4);
  const tokensEarned = Math.floor(score / 10);
  if (xpEarned > 0 || tokensEarned > 0) {
    const p = loadCachedProgress();
    p.xp += xpEarned;
    p.tokens += tokensEarned;
    p.tokenHistory.push({
      action: `Arcade: ${gameId}`,
      amount: tokensEarned,
      date: new Date().toISOString(),
    });
    saveCacheProgress(p);
    saveCloudProgress(p).catch(() => {});
  }

  return { xpEarned, tokensEarned, stats };
}

// ---------- Achievement definitions ----------

export const ACHIEVEMENTS: Record<string, { icon: string; title: string; desc: string }> = {
  "first-game": { icon: "🎮", title: "First Play", desc: "Played your first arcade game" },
  "arcade-veteran": { icon: "🏅", title: "Arcade Veteran", desc: "Played 25 games" },
  "score-hunter": { icon: "🎯", title: "Score Hunter", desc: "Earned 1,000 total points" },
  "score-legend": { icon: "👑", title: "Score Legend", desc: "Earned 10,000 total points" },
  "streak-master": { icon: "🔥", title: "Streak Master", desc: "Hit a 15+ streak" },
  "serpent-ace": { icon: "🐍", title: "Serpent Ace", desc: "Scored 200+ in Mind Serpent" },
  "pilot-pro": { icon: "✈️", title: "Pilot Pro", desc: "Scored 300+ in Insight Pilot" },
  "syntax-king": { icon: "🏗️", title: "Syntax King", desc: "Scored 500+ in Syntax Smash" },
};

// ---------- Content pools (AI concept data) ----------

export const AI_CONCEPTS = [
  { term: "LLM", def: "Large Language Model", category: "foundations" },
  { term: "GPT", def: "Generative Pre-trained Transformer", category: "foundations" },
  { term: "RAG", def: "Retrieval-Augmented Generation", category: "advanced" },
  { term: "Fine-tuning", def: "Training on specific data", category: "advanced" },
  { term: "Tokenizer", def: "Text-to-token converter", category: "foundations" },
  { term: "Embedding", def: "Vector representation of data", category: "foundations" },
  { term: "Prompt Engineering", def: "Crafting optimal AI inputs", category: "prompting" },
  { term: "Chain-of-Thought", def: "Step-by-step reasoning", category: "prompting" },
  { term: "Zero-shot", def: "No examples given", category: "prompting" },
  { term: "Few-shot", def: "Learning from examples", category: "prompting" },
  { term: "Transformer", def: "Attention-based architecture", category: "foundations" },
  { term: "Attention", def: "Weighted focus mechanism", category: "foundations" },
  { term: "RLHF", def: "Human feedback training", category: "advanced" },
  { term: "Vector DB", def: "Stores embeddings for search", category: "advanced" },
  { term: "AI Agent", def: "Autonomous AI system", category: "advanced" },
  { term: "Context Window", def: "Token input limit", category: "foundations" },
  { term: "Temperature", def: "Controls output randomness", category: "prompting" },
  { term: "Top-p Sampling", def: "Nucleus sampling method", category: "advanced" },
  { term: "Hallucination", def: "AI generating false info", category: "foundations" },
  { term: "Retrieval", def: "Fetching relevant context", category: "advanced" },
  { term: "System Prompt", def: "Initial behavior instruction", category: "prompting" },
  { term: "Multi-modal", def: "Processing multiple data types", category: "advanced" },
  { term: "Inference", def: "Running model predictions", category: "foundations" },
  { term: "Neural Network", def: "Connected layers of nodes", category: "foundations" },
  { term: "Backpropagation", def: "Error-based weight updates", category: "foundations" },
  { term: "Overfitting", def: "Memorizing training data", category: "foundations" },
  { term: "API Gateway", def: "Model access endpoint", category: "advanced" },
  { term: "Latent Space", def: "Compressed data representation", category: "advanced" },
];

export const TRAP_CONCEPTS = [
  "Virus", "Spam", "Malware", "Phishing", "Scam",
  "Clickbait", "Data leak", "Exploit", "Trojan", "Ransomware",
  "SQL Injection", "XSS Attack", "Brute Force", "Fake News", "Deepfake Abuse",
];

export function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
