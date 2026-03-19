import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Play, RotateCcw, Trophy, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const PAIRS = [
  { term: "LLM", def: "Large Language Model" },
  { term: "RAG", def: "Retrieval-Augmented Generation" },
  { term: "Fine-tuning", def: "Training on specific data" },
  { term: "Prompt", def: "Input instruction to AI" },
  { term: "Embedding", def: "Vector representation" },
  { term: "Tokenizer", def: "Text-to-token converter" },
  { term: "Hallucination", def: "AI generating false info" },
  { term: "Zero-shot", def: "No examples given" },
  { term: "Few-shot", def: "Learning from examples" },
  { term: "Temperature", def: "Controls randomness" },
  { term: "Transformer", def: "Attention-based architecture" },
  { term: "RLHF", def: "Human feedback training" },
  { term: "Context window", def: "Token input limit" },
  { term: "Agent", def: "Autonomous AI system" },
  { term: "Chain-of-thought", def: "Step-by-step reasoning" },
  { term: "Top-p", def: "Nucleus sampling" },
];

interface Card {
  id: string;
  text: string;
  pairId: number;
  flipped: boolean;
  matched: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateCards(count: number): Card[] {
  const selected = shuffle(PAIRS).slice(0, count);
  const cards: Card[] = [];
  selected.forEach((pair, i) => {
    cards.push({ id: `t-${i}`, text: pair.term, pairId: i, flipped: false, matched: false });
    cards.push({ id: `d-${i}`, text: pair.def, pairId: i, flipped: false, matched: false });
  });
  return shuffle(cards);
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

export default function LogicLink() {
  const PAIR_COUNT = 6;
  const [gameState, setGameState] = useState<"menu" | "playing" | "over">("menu");
  const [cards, setCards] = useState<Card[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [timer, setTimer] = useState(0);
  const [streak, setStreak] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startGame = useCallback(() => {
    setCards(generateCards(PAIR_COUNT));
    setSelected([]);
    setScore(0);
    setMoves(0);
    setTimer(0);
    setStreak(0);
    setGameState("playing");
  }, []);

  // Timer
  useEffect(() => {
    if (gameState === "playing") {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameState]);

  // Check for win
  useEffect(() => {
    if (gameState === "playing" && cards.length > 0 && cards.every(c => c.matched)) {
      if (timerRef.current) clearInterval(timerRef.current);
      updateArcadeStats(score);
      setGameState("over");
    }
  }, [cards, gameState, score]);

  const handleFlip = useCallback((id: string) => {
    if (gameState !== "playing") return;
    const card = cards.find(c => c.id === id);
    if (!card || card.flipped || card.matched || selected.length >= 2) return;

    const newCards = cards.map(c => c.id === id ? { ...c, flipped: true } : c);
    const newSelected = [...selected, id];
    setCards(newCards);
    setSelected(newSelected);

    if (newSelected.length === 2) {
      setMoves(m => m + 1);
      const [a, b] = newSelected.map(sid => newCards.find(c => c.id === sid)!);
      if (a.pairId === b.pairId) {
        // Match!
        setTimeout(() => {
          setCards(prev => prev.map(c => c.pairId === a.pairId ? { ...c, matched: true } : c));
          setSelected([]);
          setScore(s => s + 20 + streak * 5);
          setStreak(s => s + 1);
        }, 400);
      } else {
        // No match
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            newSelected.includes(c.id) ? { ...c, flipped: false } : c
          ));
          setSelected([]);
          setStreak(0);
        }, 800);
      }
    }
  }, [cards, selected, gameState, streak]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="min-h-screen pb-24 flex flex-col">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 flex items-center gap-3">
        <Link to="/games" className="p-2 rounded-xl bg-card/60 border border-border/50">
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-lg font-bold text-foreground">🧩 Logic Link</h1>
          <p className="text-xs text-muted-foreground">Match AI terms with their definitions</p>
        </div>
        {gameState === "playing" && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> {formatTime(timer)}
            </span>
            <span className="text-sm font-bold text-foreground">{score} pts</span>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4">
        {gameState === "menu" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-5"
          >
            <div className="text-6xl mb-4">🧩</div>
            <h2 className="font-display text-2xl font-bold text-foreground">Logic Link</h2>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
              Flip cards and match <span className="text-violet-400 font-semibold">AI terms</span> with their <span className="text-accent-gold font-semibold">definitions</span>. Fewer moves = higher score.
            </p>
            <Button onClick={startGame} size="lg" className="gap-2">
              <Play className="h-4 w-4" /> Start Game
            </Button>
          </motion.div>
        )}

        {gameState === "playing" && (
          <div className="w-full max-w-sm">
            <div className="grid grid-cols-3 gap-2">
              <AnimatePresence>
                {cards.map((card) => (
                  <motion.button
                    key={card.id}
                    layout
                    onClick={() => handleFlip(card.id)}
                    className={`aspect-[3/4] rounded-xl border text-xs font-semibold p-2 flex items-center justify-center text-center transition-all duration-200 ${
                      card.matched
                        ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                        : card.flipped
                        ? "bg-primary/10 border-primary/30 text-foreground"
                        : "bg-card/60 border-border/50 text-transparent hover:border-primary/20 cursor-pointer"
                    }`}
                    whileTap={!card.flipped && !card.matched ? { scale: 0.95 } : undefined}
                  >
                    {card.flipped || card.matched ? card.text : "?"}
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span>Moves: <b className="text-foreground">{moves}</b></span>
              <span>Matched: <b className="text-foreground">{cards.filter(c => c.matched).length / 2}/{PAIR_COUNT}</b></span>
              {streak > 1 && <span className="text-accent-gold font-semibold">🔥 {streak}x streak</span>}
            </div>
          </div>
        )}

        {gameState === "over" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-5"
          >
            <Trophy className="h-12 w-12 text-accent-gold mx-auto" />
            <h2 className="font-display text-2xl font-bold text-foreground">All Matched!</h2>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-foreground">{score} pts</p>
              <p className="text-sm text-muted-foreground">
                {moves} moves • {formatTime(timer)}
              </p>
              <p className="text-sm text-muted-foreground">
                +{Math.floor(score / 4)} XP earned • +{Math.floor(score / 10)} tokens
              </p>
            </div>
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
