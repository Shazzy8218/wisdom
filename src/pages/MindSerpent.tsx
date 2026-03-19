import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Play, RotateCcw, Trophy, Heart, Zap, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AI_CONCEPTS, TRAP_CONCEPTS, shuffleArray, recordGameResult } from "@/lib/arcade-engine";

const CANVAS_W = 360;
const CANVAS_H = 480;
const CELL = 20;
const COLS = Math.floor(CANVAS_W / CELL);
const ROWS = Math.floor(CANVAS_H / CELL);
const INITIAL_SPEED = 160;

type Pos = { x: number; y: number };
type DataNode = { pos: Pos; label: string; good: boolean; glow: number; bonus?: boolean };
type Dir = "UP" | "DOWN" | "LEFT" | "RIGHT";

const DIR_VEC: Record<Dir, Pos> = {
  UP: { x: 0, y: -1 }, DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 }, RIGHT: { x: 1, y: 0 },
};

function rndPos(exclude: Pos[]): Pos {
  let p: Pos;
  do { p = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) }; }
  while (exclude.some(e => e.x === p.x && e.y === p.y));
  return p;
}

function spawnNodes(snake: Pos[], existing: DataNode[]): DataNode[] {
  const occ = [...snake, ...existing.map(n => n.pos)];
  const items = [...existing];
  while (items.length < 5) {
    const isGood = Math.random() > 0.25;
    if (isGood) {
      const c = AI_CONCEPTS[Math.floor(Math.random() * AI_CONCEPTS.length)];
      const bonus = Math.random() < 0.15;
      items.push({ pos: rndPos(occ), label: c.term, good: true, glow: 0, bonus });
    } else {
      const t = TRAP_CONCEPTS[Math.floor(Math.random() * TRAP_CONCEPTS.length)];
      items.push({ pos: rndPos(occ), label: t, good: false, glow: 0 });
    }
    occ.push(items[items.length - 1].pos);
  }
  return items;
}

export default function MindSerpent() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<"menu" | "playing" | "over">("menu");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [streak, setStreak] = useState(0);
  const [flash, setFlash] = useState<string | null>(null);
  const [result, setResult] = useState<{ xp: number; tokens: number } | null>(null);
  const [forked, setForked] = useState(false);

  // Refs for game loop
  const snakeRef = useRef<Pos[]>([{ x: 9, y: 12 }]);
  const forkRef = useRef<Pos[] | null>(null);
  const dirRef = useRef<Dir>("RIGHT");
  const nodesRef = useRef<DataNode[]>([]);
  const speedRef = useRef(INITIAL_SPEED);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const streakRef = useRef(0);
  const gameRef = useRef(gameState);
  const lastTickRef = useRef(0);
  const animFrameRef = useRef(0);

  useEffect(() => { gameRef.current = gameState; }, [gameState]);

  const startGame = useCallback(() => {
    snakeRef.current = [{ x: 9, y: 12 }];
    forkRef.current = null;
    dirRef.current = "RIGHT";
    speedRef.current = INITIAL_SPEED;
    scoreRef.current = 0;
    livesRef.current = 3;
    streakRef.current = 0;
    nodesRef.current = spawnNodes([{ x: 9, y: 12 }], []);
    setScore(0); setLives(3); setStreak(0); setFlash(null); setResult(null); setForked(false);
    setGameState("playing");
    lastTickRef.current = performance.now();
  }, []);

  const endGame = useCallback(() => {
    const s = scoreRef.current;
    const r = recordGameResult("mind-serpent", s, streakRef.current);
    setResult({ xp: r.xpEarned, tokens: r.tokensEarned });
    setGameState("over");
  }, []);

  // Canvas rendering + game loop
  useEffect(() => {
    if (gameState !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const loop = (now: number) => {
      if (gameRef.current !== "playing") return;

      // Tick logic
      if (now - lastTickRef.current >= speedRef.current) {
        lastTickRef.current = now;
        const s = snakeRef.current;
        const d = DIR_VEC[dirRef.current];
        const head = s[0];
        const next: Pos = { x: (head.x + d.x + COLS) % COLS, y: (head.y + d.y + ROWS) % ROWS };

        // Self collision
        if (s.some(p => p.x === next.x && p.y === next.y)) {
          livesRef.current -= 1;
          setLives(livesRef.current);
          if (livesRef.current <= 0) { endGame(); return; }
          setFlash("💥 Self-collision!");
          setTimeout(() => setFlash(null), 1000);
          snakeRef.current = [{ x: 9, y: 12 }];
          dirRef.current = "RIGHT";
          forkRef.current = null;
          setForked(false);
        } else {
          let newSnake = [next, ...s];
          let nodes = nodesRef.current;
          let ate = false;

          const hitIdx = nodes.findIndex(n => n.pos.x === next.x && n.pos.y === next.y);
          if (hitIdx !== -1) {
            const node = nodes[hitIdx];
            nodes = nodes.filter((_, i) => i !== hitIdx);
            if (node.good) {
              const pts = node.bonus ? 25 : 10;
              scoreRef.current += pts;
              streakRef.current += 1;
              setScore(scoreRef.current);
              setStreak(streakRef.current);
              setFlash(`✅ ${node.label} +${pts}`);
              speedRef.current = Math.max(70, speedRef.current - 5);
              ate = true;
              // Fork mechanic: every 5 streak, serpent forks
              if (streakRef.current % 5 === 0 && !forkRef.current) {
                forkRef.current = [next];
                setForked(true);
                setTimeout(() => { forkRef.current = null; setForked(false); }, 4000);
              }
            } else {
              livesRef.current -= 1;
              streakRef.current = 0;
              setLives(livesRef.current);
              setStreak(0);
              setFlash(`❌ ${node.label}`);
              if (livesRef.current <= 0) { endGame(); return; }
              newSnake = newSnake.slice(0, Math.max(1, newSnake.length - 2));
            }
            setTimeout(() => setFlash(null), 1000);
            nodes = spawnNodes(newSnake, nodes);
          }
          if (!ate) newSnake.pop();
          snakeRef.current = newSnake;
          nodesRef.current = nodes;

          // Update fork snake
          if (forkRef.current) {
            const fHead = forkRef.current[0];
            // Fork moves opposite direction 
            const fd = DIR_VEC[dirRef.current === "LEFT" ? "RIGHT" : dirRef.current === "RIGHT" ? "LEFT" : dirRef.current === "UP" ? "DOWN" : "UP"];
            const fNext = { x: (fHead.x + fd.x + COLS) % COLS, y: (fHead.y + fd.y + ROWS) % ROWS };
            forkRef.current = [fNext, ...forkRef.current];
            if (forkRef.current.length > 5) forkRef.current.pop();
            // Fork collects nodes too
            const fHit = nodesRef.current.findIndex(n => n.pos.x === fNext.x && n.pos.y === fNext.y);
            if (fHit !== -1 && nodesRef.current[fHit].good) {
              scoreRef.current += 10;
              setScore(scoreRef.current);
              nodesRef.current = spawnNodes(snakeRef.current, nodesRef.current.filter((_, i) => i !== fHit));
            }
          }
        }
      }

      // Draw
      ctx.fillStyle = "hsl(0, 0%, 3%)";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Grid dots
      ctx.fillStyle = "rgba(255,255,255,0.03)";
      for (let x = 0; x < COLS; x++) for (let y = 0; y < ROWS; y++) {
        ctx.fillRect(x * CELL + CELL / 2, y * CELL + CELL / 2, 1, 1);
      }

      // Nodes
      for (const node of nodesRef.current) {
        const nx = node.pos.x * CELL;
        const ny = node.pos.y * CELL;
        if (node.good) {
          if (node.bonus) {
            ctx.fillStyle = "rgba(250, 204, 21, 0.25)";
            ctx.fillRect(nx + 1, ny + 1, CELL - 2, CELL - 2);
            ctx.strokeStyle = "rgba(250, 204, 21, 0.6)";
          } else {
            ctx.fillStyle = "rgba(52, 211, 153, 0.2)";
            ctx.fillRect(nx + 1, ny + 1, CELL - 2, CELL - 2);
            ctx.strokeStyle = "rgba(52, 211, 153, 0.5)";
          }
        } else {
          ctx.fillStyle = "rgba(239, 68, 68, 0.2)";
          ctx.fillRect(nx + 1, ny + 1, CELL - 2, CELL - 2);
          ctx.strokeStyle = "rgba(239, 68, 68, 0.5)";
        }
        ctx.lineWidth = 1;
        ctx.strokeRect(nx + 1, ny + 1, CELL - 2, CELL - 2);
        // Label
        ctx.fillStyle = node.good ? (node.bonus ? "rgba(250,204,21,0.9)" : "rgba(52,211,153,0.9)") : "rgba(239,68,68,0.8)";
        ctx.font = "bold 7px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(node.label.slice(0, 5), nx + CELL / 2, ny + CELL / 2 + 3);
      }

      // Snake
      const s = snakeRef.current;
      for (let i = 0; i < s.length; i++) {
        const alpha = 1 - i * 0.03;
        ctx.fillStyle = i === 0 ? "hsl(45, 90%, 55%)" : `hsla(45, 80%, 50%, ${Math.max(0.3, alpha)})`;
        ctx.beginPath();
        ctx.roundRect(s[i].x * CELL + 2, s[i].y * CELL + 2, CELL - 4, CELL - 4, 3);
        ctx.fill();
      }

      // Fork snake
      if (forkRef.current) {
        for (let i = 0; i < forkRef.current.length; i++) {
          ctx.fillStyle = `hsla(280, 70%, 60%, ${Math.max(0.3, 0.8 - i * 0.15)})`;
          ctx.beginPath();
          ctx.roundRect(forkRef.current[i].x * CELL + 2, forkRef.current[i].y * CELL + 2, CELL - 4, CELL - 4, 3);
          ctx.fill();
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [gameState, endGame]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (gameRef.current !== "playing") return;
      const map: Record<string, Dir> = { ArrowUp: "UP", ArrowDown: "DOWN", ArrowLeft: "LEFT", ArrowRight: "RIGHT", w: "UP", s: "DOWN", a: "LEFT", d: "RIGHT" };
      const nd = map[e.key];
      if (!nd) return;
      e.preventDefault();
      const c = dirRef.current;
      if ((c === "UP" && nd === "DOWN") || (c === "DOWN" && nd === "UP") || (c === "LEFT" && nd === "RIGHT") || (c === "RIGHT" && nd === "LEFT")) return;
      dirRef.current = nd;
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Touch swipe
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);
  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current || gameRef.current !== "playing") return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    if (Math.abs(dx) < 15 && Math.abs(dy) < 15) return;
    let nd: Dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "RIGHT" : "LEFT") : (dy > 0 ? "DOWN" : "UP");
    const c = dirRef.current;
    if ((c === "UP" && nd === "DOWN") || (c === "DOWN" && nd === "UP") || (c === "LEFT" && nd === "RIGHT") || (c === "RIGHT" && nd === "LEFT")) return;
    dirRef.current = nd;
  }, []);

  return (
    <div className="min-h-screen pb-24 flex flex-col">
      <div className="px-5 pt-6 pb-3 flex items-center gap-3">
        <Link to="/games" className="p-2 rounded-xl bg-card/60 border border-border/50"><ArrowLeft className="h-4 w-4 text-muted-foreground" /></Link>
        <div className="flex-1">
          <h1 className="font-display text-lg font-bold text-foreground">🐍 Mind Serpent</h1>
          <p className="text-[11px] text-muted-foreground">AI Data Stream</p>
        </div>
        {gameState === "playing" && (
          <div className="flex items-center gap-3">
            {forked && <span className="text-[10px] font-bold text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded-full animate-pulse">⚡ FORKED</span>}
            {streak > 2 && <span className="text-[10px] font-bold text-accent-gold">🔥{streak}</span>}
            <span className="text-sm font-bold text-foreground tabular-nums">{score}</span>
            <span className="flex gap-0.5">
              {[0, 1, 2].map(i => <Heart key={i} className={`h-3.5 w-3.5 ${i < lives ? "text-primary fill-primary" : "text-border"}`} />)}
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {gameState === "menu" && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-5">
            <div className="text-7xl mb-2">🐍</div>
            <h2 className="font-display text-2xl font-black text-foreground">Mind Serpent</h2>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
              Navigate the data stream. Collect <span className="text-emerald-400 font-semibold">AI concepts</span>, dodge <span className="text-primary font-semibold">traps</span>. Hit 5-streaks to <span className="text-purple-400 font-semibold">fork</span> your serpent.
            </p>
            <div className="flex flex-wrap gap-2 justify-center text-[10px] text-muted-foreground">
              <span className="px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">✓ Good nodes</span>
              <span className="px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">★ Bonus nodes</span>
              <span className="px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">✗ Traps</span>
            </div>
            <Button onClick={startGame} size="lg" className="gap-2 text-base font-bold"><Play className="h-5 w-5" /> PLAY</Button>
          </motion.div>
        )}

        {gameState === "playing" && (
          <div className="relative">
            {flash && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs font-bold text-foreground bg-card/90 border border-border/50 rounded-full px-3 py-1 whitespace-nowrap z-10">{flash}</motion.div>
            )}
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              className="rounded-2xl border border-border/40 bg-background"
              style={{ maxWidth: "100%", height: "auto" }}
            />
            {/* Mobile D-pad */}
            <div className="mt-3 flex flex-col items-center gap-1 md:hidden">
              <button onClick={() => { if (dirRef.current !== "DOWN") dirRef.current = "UP"; }} className="w-14 h-11 rounded-xl bg-card/80 border border-border/40 text-muted-foreground text-lg active:bg-primary/20">↑</button>
              <div className="flex gap-1">
                <button onClick={() => { if (dirRef.current !== "RIGHT") dirRef.current = "LEFT"; }} className="w-14 h-11 rounded-xl bg-card/80 border border-border/40 text-muted-foreground text-lg active:bg-primary/20">←</button>
                <button onClick={() => { if (dirRef.current !== "UP") dirRef.current = "DOWN"; }} className="w-14 h-11 rounded-xl bg-card/80 border border-border/40 text-muted-foreground text-lg active:bg-primary/20">↓</button>
                <button onClick={() => { if (dirRef.current !== "LEFT") dirRef.current = "RIGHT"; }} className="w-14 h-11 rounded-xl bg-card/80 border border-border/40 text-muted-foreground text-lg active:bg-primary/20">→</button>
              </div>
            </div>
          </div>
        )}

        {gameState === "over" && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4">
            <Trophy className="h-14 w-14 text-accent-gold mx-auto" />
            <h2 className="font-display text-2xl font-black text-foreground">Game Over</h2>
            <p className="text-4xl font-black text-foreground tabular-nums">{score}</p>
            {result && (
              <div className="flex items-center justify-center gap-4 text-sm">
                <span className="text-accent-gold flex items-center gap-1 font-bold"><Zap className="h-4 w-4" /> +{result.xp} XP</span>
                <span className="text-primary flex items-center gap-1 font-bold"><Star className="h-4 w-4" /> +{result.tokens} tokens</span>
              </div>
            )}
            <div className="flex gap-3 justify-center pt-2">
              <Button onClick={startGame} className="gap-2 font-bold"><RotateCcw className="h-4 w-4" /> Play Again</Button>
              <Button variant="outline" asChild><Link to="/games">Arcade</Link></Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
