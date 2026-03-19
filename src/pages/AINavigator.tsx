import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Play, RotateCcw, Trophy, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

const GRID_SIZE = 15;
const CELL_PX = 22;
const INITIAL_SPEED = 200;
const SPEED_INCREMENT = 8;

const GOOD_TERMS = [
  "LLM", "GPT", "RAG", "Fine-tune", "Tokenizer", "Embedding",
  "Prompt", "Chain-of-thought", "Zero-shot", "Few-shot", "Transformer",
  "Attention", "RLHF", "Vector DB", "Agent", "Context window",
  "Temperature", "Top-p", "Hallucination", "Retrieval",
];

const BAD_TERMS = [
  "Virus", "Spam", "Malware", "Phishing", "Scam", "Fake news",
  "Clickbait", "Deepfake abuse", "Data leak", "Exploit",
];

type Pos = { x: number; y: number };
type Collectible = { pos: Pos; term: string; good: boolean };

function randomPos(exclude: Pos[]): Pos {
  let pos: Pos;
  do {
    pos = { x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) };
  } while (exclude.some(e => e.x === pos.x && e.y === pos.y));
  return pos;
}

function spawnCollectibles(snake: Pos[], existing: Collectible[]): Collectible[] {
  const occupied = [...snake, ...existing.map(c => c.pos)];
  const items: Collectible[] = [...existing];
  while (items.length < 4) {
    const isGood = Math.random() > 0.3;
    const terms = isGood ? GOOD_TERMS : BAD_TERMS;
    const term = terms[Math.floor(Math.random() * terms.length)];
    items.push({ pos: randomPos(occupied), term, good: isGood });
    occupied.push(items[items.length - 1].pos);
  }
  return items;
}

type Dir = "UP" | "DOWN" | "LEFT" | "RIGHT";
const DIR_MAP: Record<Dir, Pos> = {
  UP: { x: 0, y: -1 }, DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 }, RIGHT: { x: 1, y: 0 },
};

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

export default function AINavigator() {
  const [gameState, setGameState] = useState<"menu" | "playing" | "over">("menu");
  const [snake, setSnake] = useState<Pos[]>([{ x: 7, y: 7 }]);
  const [dir, setDir] = useState<Dir>("RIGHT");
  const [items, setItems] = useState<Collectible[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [flash, setFlash] = useState<string | null>(null);
  const [speed, setSpeed] = useState(INITIAL_SPEED);

  const dirRef = useRef(dir);
  const snakeRef = useRef(snake);
  const itemsRef = useRef(items);
  const livesRef = useRef(lives);
  const scoreRef = useRef(score);
  const speedRef = useRef(speed);
  const gameStateRef = useRef(gameState);

  useEffect(() => { dirRef.current = dir; }, [dir]);
  useEffect(() => { snakeRef.current = snake; }, [snake]);
  useEffect(() => { itemsRef.current = items; }, [items]);
  useEffect(() => { livesRef.current = lives; }, [lives]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  const startGame = useCallback(() => {
    const start: Pos[] = [{ x: 7, y: 7 }];
    setSnake(start);
    setDir("RIGHT");
    setScore(0);
    setLives(3);
    setSpeed(INITIAL_SPEED);
    setItems(spawnCollectibles(start, []));
    setGameState("playing");
    setFlash(null);
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (gameStateRef.current !== "playing") return;
      const map: Record<string, Dir> = {
        ArrowUp: "UP", ArrowDown: "DOWN", ArrowLeft: "LEFT", ArrowRight: "RIGHT",
        w: "UP", s: "DOWN", a: "LEFT", d: "RIGHT",
      };
      const newDir = map[e.key];
      if (!newDir) return;
      e.preventDefault();
      const cur = dirRef.current;
      // Prevent reversing
      if ((cur === "UP" && newDir === "DOWN") || (cur === "DOWN" && newDir === "UP") ||
          (cur === "LEFT" && newDir === "RIGHT") || (cur === "RIGHT" && newDir === "LEFT")) return;
      setDir(newDir);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Touch controls
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current || gameStateRef.current !== "playing") return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
    let newDir: Dir;
    if (Math.abs(dx) > Math.abs(dy)) {
      newDir = dx > 0 ? "RIGHT" : "LEFT";
    } else {
      newDir = dy > 0 ? "DOWN" : "UP";
    }
    const cur = dirRef.current;
    if ((cur === "UP" && newDir === "DOWN") || (cur === "DOWN" && newDir === "UP") ||
        (cur === "LEFT" && newDir === "RIGHT") || (cur === "RIGHT" && newDir === "LEFT")) return;
    setDir(newDir);
    touchStart.current = null;
  }, []);

  // Game loop
  useEffect(() => {
    if (gameState !== "playing") return;
    const interval = setInterval(() => {
      const s = snakeRef.current;
      const d = DIR_MAP[dirRef.current];
      const head = s[0];
      const next: Pos = {
        x: (head.x + d.x + GRID_SIZE) % GRID_SIZE,
        y: (head.y + d.y + GRID_SIZE) % GRID_SIZE,
      };

      // Self collision
      if (s.some(p => p.x === next.x && p.y === next.y)) {
        const newLives = livesRef.current - 1;
        if (newLives <= 0) {
          updateArcadeStats(scoreRef.current);
          setGameState("over");
          return;
        }
        setLives(newLives);
        setFlash("💥 Self-collision! Life lost");
        setTimeout(() => setFlash(null), 1200);
        // Reset snake position
        setSnake([{ x: 7, y: 7 }]);
        setDir("RIGHT");
        return;
      }

      let newSnake = [next, ...s];
      let newItems = [...itemsRef.current];
      let collected = false;

      const hitIdx = newItems.findIndex(it => it.pos.x === next.x && it.pos.y === next.y);
      if (hitIdx !== -1) {
        const item = newItems[hitIdx];
        newItems.splice(hitIdx, 1);
        if (item.good) {
          setScore(prev => prev + 10);
          setFlash(`✅ ${item.term} +10`);
          setSpeed(prev => Math.max(80, prev - SPEED_INCREMENT));
          collected = true;
        } else {
          const newLives = livesRef.current - 1;
          if (newLives <= 0) {
            updateArcadeStats(scoreRef.current);
            setGameState("over");
            return;
          }
          setLives(newLives);
          setFlash(`❌ ${item.term} — Avoid misinformation!`);
          // Shrink snake
          newSnake = newSnake.slice(0, Math.max(1, newSnake.length - 2));
        }
        setTimeout(() => setFlash(null), 1200);
        newItems = spawnCollectibles(newSnake, newItems);
      }

      if (!collected) {
        newSnake.pop(); // Normal movement
      }

      setSnake(newSnake);
      setItems(newItems);
    }, speedRef.current);

    return () => clearInterval(interval);
  }, [gameState]);

  return (
    <div className="min-h-screen pb-24 flex flex-col">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 flex items-center gap-3">
        <Link to="/games" className="p-2 rounded-xl bg-card/60 border border-border/50">
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-lg font-bold text-foreground">🐍 AI Navigator</h1>
          <p className="text-xs text-muted-foreground">Collect correct AI concepts, avoid traps</p>
        </div>
        {gameState === "playing" && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-foreground">{score}</span>
            <span className="flex items-center gap-0.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <Heart key={i} className={`h-4 w-4 ${i < lives ? "text-primary fill-primary" : "text-border"}`} />
              ))}
            </span>
          </div>
        )}
      </div>

      {/* Game Area */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-4"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {gameState === "menu" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-5"
          >
            <div className="text-6xl mb-4">🐍</div>
            <h2 className="font-display text-2xl font-bold text-foreground">AI Navigator</h2>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
              Guide the snake to collect <span className="text-emerald-400 font-semibold">correct AI terms</span> and avoid <span className="text-primary font-semibold">misinformation</span>. Swipe or use arrow keys.
            </p>
            <Button onClick={startGame} size="lg" className="gap-2">
              <Play className="h-4 w-4" /> Start Game
            </Button>
          </motion.div>
        )}

        {gameState === "playing" && (
          <div className="relative">
            {flash && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-bold text-foreground bg-card/80 border border-border/50 rounded-full px-3 py-1 whitespace-nowrap z-10"
              >
                {flash}
              </motion.div>
            )}
            <div
              className="rounded-xl border border-border/50 bg-card/40 overflow-hidden relative"
              style={{ width: GRID_SIZE * CELL_PX, height: GRID_SIZE * CELL_PX }}
            >
              {/* Grid dots */}
              {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
                const x = i % GRID_SIZE;
                const y = Math.floor(i / GRID_SIZE);
                return (
                  <div
                    key={i}
                    className="absolute rounded-full bg-border/20"
                    style={{ left: x * CELL_PX + CELL_PX / 2 - 1, top: y * CELL_PX + CELL_PX / 2 - 1, width: 2, height: 2 }}
                  />
                );
              })}
              {/* Collectibles */}
              {items.map((item, i) => (
                <div
                  key={`item-${i}`}
                  className={`absolute flex items-center justify-center rounded-md text-[9px] font-bold leading-tight text-center ${
                    item.good
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-primary/20 text-primary border border-primary/30"
                  }`}
                  style={{
                    left: item.pos.x * CELL_PX + 1,
                    top: item.pos.y * CELL_PX + 1,
                    width: CELL_PX - 2,
                    height: CELL_PX - 2,
                  }}
                  title={item.term}
                >
                  {item.good ? "✓" : "✗"}
                </div>
              ))}
              {/* Snake */}
              {snake.map((seg, i) => (
                <div
                  key={`s-${i}`}
                  className={`absolute rounded-sm transition-all duration-75 ${
                    i === 0 ? "bg-accent-gold" : "bg-accent-gold/60"
                  }`}
                  style={{
                    left: seg.x * CELL_PX + 2,
                    top: seg.y * CELL_PX + 2,
                    width: CELL_PX - 4,
                    height: CELL_PX - 4,
                  }}
                />
              ))}
            </div>
            {/* Mobile d-pad */}
            <div className="mt-4 flex flex-col items-center gap-1 md:hidden">
              <button onClick={() => setDir("UP")} className="w-12 h-10 rounded-lg bg-card border border-border/50 text-muted-foreground text-lg">↑</button>
              <div className="flex gap-1">
                <button onClick={() => setDir("LEFT")} className="w-12 h-10 rounded-lg bg-card border border-border/50 text-muted-foreground text-lg">←</button>
                <button onClick={() => setDir("DOWN")} className="w-12 h-10 rounded-lg bg-card border border-border/50 text-muted-foreground text-lg">↓</button>
                <button onClick={() => setDir("RIGHT")} className="w-12 h-10 rounded-lg bg-card border border-border/50 text-muted-foreground text-lg">→</button>
              </div>
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
            <h2 className="font-display text-2xl font-bold text-foreground">Game Over</h2>
            <p className="text-3xl font-bold text-foreground">{score} pts</p>
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
