import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Play, RotateCcw, Trophy, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const PROMPTS = [
  "Write a professional email summarizing key project updates",
  "Generate a Python function to parse CSV files",
  "Create a marketing plan for a SaaS product launch",
  "Explain the concept of retrieval augmented generation",
  "Design a database schema for an e-commerce platform",
  "Write a prompt that generates creative story ideas",
  "Summarize the key benefits of fine-tuning language models",
  "Create a step-by-step guide for building AI agents",
  "Generate a comparison table of popular vector databases",
  "Write instructions for implementing chain-of-thought prompting",
  "Explain how transformers process sequential data",
  "Draft a proposal for automating customer support with AI",
  "Create a rubric for evaluating AI-generated content quality",
  "Write a system prompt for a helpful coding assistant",
  "Design a workflow for automated content moderation",
];

const ROUND_DURATION = 30; // seconds per round
const TOTAL_ROUNDS = 3;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function updateArcadeStats(score: number) {
  try {
    const raw = localStorage.getItem("wisdom-arcade-stats");
    const stats = raw ? JSON.parse(raw) : { gamesPlayed: 0, totalScore: 0, bestStreak: 0 };
    stats.gamesPlayed += 1;
    stats.totalScore += score;
    if (score > stats.bestStreak) stats.bestStreak = score;
    localStorage.setItem("wisdom-arcade-stats", JSON.stringify(stats));
  } catch {}
}

export default function PromptPro() {
  const [gameState, setGameState] = useState<"menu" | "playing" | "over">("menu");
  const [prompts, setPrompts] = useState<string[]>([]);
  const [round, setRound] = useState(0);
  const [typed, setTyped] = useState("");
  const [timeLeft, setTimeLeft] = useState(ROUND_DURATION);
  const [score, setScore] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [roundScores, setRoundScores] = useState<{ wpm: number; accuracy: number; score: number }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);

  const currentPrompt = prompts[round] || "";

  const startGame = useCallback(() => {
    const selected = shuffle(PROMPTS).slice(0, TOTAL_ROUNDS);
    setPrompts(selected);
    setRound(0);
    setTyped("");
    setTimeLeft(ROUND_DURATION);
    setScore(0);
    setWpm(0);
    setAccuracy(100);
    setRoundScores([]);
    setGameState("playing");
    startTimeRef.current = Date.now();
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Timer
  useEffect(() => {
    if (gameState !== "playing") return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          // Time's up for this round
          finishRound();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameState, round]);

  const finishRound = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    const elapsed = (Date.now() - startTimeRef.current) / 1000 / 60; // minutes
    const wordCount = typed.trim().split(/\s+/).filter(Boolean).length;
    const currentWpm = elapsed > 0 ? Math.round(wordCount / elapsed) : 0;

    let correct = 0;
    const target = currentPrompt;
    for (let i = 0; i < typed.length; i++) {
      if (typed[i] === target[i]) correct++;
    }
    const currentAccuracy = typed.length > 0 ? Math.round((correct / typed.length) * 100) : 0;
    const roundScore = Math.round(currentWpm * (currentAccuracy / 100) * 2);

    setRoundScores(prev => [...prev, { wpm: currentWpm, accuracy: currentAccuracy, score: roundScore }]);
    setScore(prev => prev + roundScore);

    if (round + 1 >= TOTAL_ROUNDS) {
      updateArcadeStats(score + roundScore);
      setGameState("over");
    } else {
      setRound(r => r + 1);
      setTyped("");
      setTimeLeft(ROUND_DURATION);
      startTimeRef.current = Date.now();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [typed, currentPrompt, round, score]);

  const handleType = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (gameState !== "playing") return;
    const val = e.target.value;
    setTyped(val);

    // Live WPM
    const elapsed = (Date.now() - startTimeRef.current) / 1000 / 60;
    const words = val.trim().split(/\s+/).filter(Boolean).length;
    setWpm(elapsed > 0 ? Math.round(words / elapsed) : 0);

    // Live accuracy
    let correct = 0;
    for (let i = 0; i < val.length; i++) {
      if (val[i] === currentPrompt[i]) correct++;
    }
    setAccuracy(val.length > 0 ? Math.round((correct / val.length) * 100) : 100);

    // Auto-complete round if typed full prompt
    if (val.length >= currentPrompt.length) {
      finishRound();
    }
  }, [gameState, currentPrompt, finishRound]);

  // Render target text with color coding
  const renderTarget = () => {
    return currentPrompt.split("").map((char, i) => {
      let cls = "text-muted-foreground/40";
      if (i < typed.length) {
        cls = typed[i] === char ? "text-emerald-400" : "text-primary";
      } else if (i === typed.length) {
        cls = "text-foreground underline";
      }
      return (
        <span key={i} className={cls}>
          {char}
        </span>
      );
    });
  };

  return (
    <div className="min-h-screen pb-24 flex flex-col">
      <div className="px-5 pt-6 pb-4 flex items-center gap-3">
        <Link to="/games" className="p-2 rounded-xl bg-card/60 border border-border/50">
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-lg font-bold text-foreground">⌨️ Prompt Pro</h1>
          <p className="text-xs text-muted-foreground">Type AI prompts fast and accurately</p>
        </div>
        {gameState === "playing" && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-muted-foreground">R{round + 1}/{TOTAL_ROUNDS}</span>
            <span className={`text-sm font-bold flex items-center gap-1 ${timeLeft <= 5 ? "text-primary" : "text-foreground"}`}>
              <Clock className="h-3 w-3" /> {timeLeft}s
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-5">
        {gameState === "menu" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-5"
          >
            <div className="text-6xl mb-4">⌨️</div>
            <h2 className="font-display text-2xl font-bold text-foreground">Prompt Pro</h2>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
              Type real AI prompts as <span className="text-accent-gold font-semibold">fast</span> and <span className="text-emerald-400 font-semibold">accurately</span> as possible. {TOTAL_ROUNDS} rounds, {ROUND_DURATION}s each.
            </p>
            <Button onClick={startGame} size="lg" className="gap-2">
              <Play className="h-4 w-4" /> Start Game
            </Button>
          </motion.div>
        )}

        {gameState === "playing" && (
          <div className="w-full max-w-lg space-y-5">
            {/* Stats bar */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">WPM: <b className="text-foreground">{wpm}</b></span>
              <span className="text-muted-foreground">Accuracy: <b className={accuracy >= 90 ? "text-emerald-400" : accuracy >= 70 ? "text-accent-gold" : "text-primary"}>{accuracy}%</b></span>
              <span className="text-muted-foreground">Score: <b className="text-foreground">{score}</b></span>
            </div>

            {/* Time bar */}
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${timeLeft <= 5 ? "bg-primary" : "bg-accent-gold"}`}
                style={{ width: `${(timeLeft / ROUND_DURATION) * 100}%` }}
              />
            </div>

            {/* Target text */}
            <div className="rounded-xl border border-border/50 bg-card/40 p-4 text-sm font-mono leading-relaxed min-h-[80px]">
              {renderTarget()}
            </div>

            {/* Input */}
            <input
              ref={inputRef}
              type="text"
              value={typed}
              onChange={handleType}
              className="w-full rounded-xl border border-border/50 bg-card/60 px-4 py-3 text-sm text-foreground font-mono focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
              placeholder="Start typing..."
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
          </div>
        )}

        {gameState === "over" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-5 w-full max-w-sm"
          >
            <Trophy className="h-12 w-12 text-accent-gold mx-auto" />
            <h2 className="font-display text-2xl font-bold text-foreground">Complete!</h2>
            <p className="text-3xl font-bold text-foreground">{score} pts</p>

            {/* Round breakdown */}
            <div className="space-y-2 text-left">
              {roundScores.map((rs, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl bg-card/40 border border-border/30 px-4 py-2.5 text-xs">
                  <span className="text-muted-foreground">Round {i + 1}</span>
                  <span className="text-muted-foreground">{rs.wpm} WPM</span>
                  <span className={rs.accuracy >= 90 ? "text-emerald-400" : "text-accent-gold"}>{rs.accuracy}%</span>
                  <span className="font-bold text-foreground">{rs.score} pts</span>
                </div>
              ))}
            </div>

            <p className="text-sm text-muted-foreground">
              +{Math.floor(score / 4)} XP earned • +{Math.floor(score / 10)} tokens
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={startGame} className="gap-2">
                <RotateCcw className="h-4 w-4" /> Play Again
              </Button>
              <Button variant="outline" asChild>
                <Link to="/games">Arcade</Link>
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
