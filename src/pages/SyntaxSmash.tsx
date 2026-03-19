import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Play, RotateCcw, Trophy, Zap, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { recordGameResult, shuffleArray } from "@/lib/arcade-engine";

const W = 360;
const H = 520;
const GRAVITY = 0.35;
const SLING_X = 60;
const SLING_Y = H - 100;

interface Block {
  x: number; y: number; vx: number; vy: number;
  w: number; h: number; type: "function" | "variable" | "conditional" | "loop";
  color: string; alive: boolean; hp: number;
}

interface Projectile {
  x: number; y: number; vx: number; vy: number;
  type: "function" | "variable" | "conditional";
  radius: number; active: boolean; trail: { x: number; y: number }[];
}

interface Level {
  blocks: Block[];
  bugLabel: string;
}

const BLOCK_TYPES = [
  { type: "function" as const, label: "fn()", color: "hsl(280, 60%, 55%)", w: 35, h: 25, hp: 1 },
  { type: "variable" as const, label: "let x", color: "hsl(200, 60%, 50%)", w: 40, h: 30, hp: 2 },
  { type: "conditional" as const, label: "if/else", color: "hsl(35, 80%, 50%)", w: 35, h: 22, hp: 1 },
  { type: "loop" as const, label: "for()", color: "hsl(145, 50%, 45%)", w: 38, h: 28, hp: 2 },
];

const BUG_LABELS = [
  "Undefined Variable", "Missing Semicolon", "Off-by-One", "Null Pointer",
  "Race Condition", "Memory Leak", "Infinite Loop", "Type Mismatch",
  "Stack Overflow", "Deadlock", "Buffer Overrun", "Uncaught Exception",
];

function generateLevel(levelNum: number): Level {
  const blocks: Block[] = [];
  const towerX = W - 120;
  const rows = Math.min(6, 3 + Math.floor(levelNum / 2));
  const cols = Math.min(3, 2 + Math.floor(levelNum / 3));

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const bt = BLOCK_TYPES[Math.floor(Math.random() * BLOCK_TYPES.length)];
      blocks.push({
        x: towerX + col * (bt.w + 4),
        y: H - 60 - row * (bt.h + 3),
        vx: 0, vy: 0,
        w: bt.w, h: bt.h,
        type: bt.type,
        color: bt.color,
        alive: true,
        hp: bt.hp + (levelNum > 4 ? 1 : 0),
      });
    }
  }

  return { blocks, bugLabel: BUG_LABELS[levelNum % BUG_LABELS.length] };
}

const PROJ_TYPES: { type: Projectile["type"]; label: string; color: string; desc: string }[] = [
  { type: "function", label: "fn()", color: "hsl(280, 70%, 60%)", desc: "Explodes on impact — damages nearby blocks" },
  { type: "variable", label: "let x", color: "hsl(200, 70%, 55%)", desc: "Heavy — pushes through blocks" },
  { type: "conditional", label: "if/else", color: "hsl(35, 90%, 55%)", desc: "Splits into two mid-flight" },
];

export default function SyntaxSmash() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<"menu" | "playing" | "over">("menu");
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [shots, setShots] = useState(0);
  const [projType, setProjType] = useState(0);
  const [result, setResult] = useState<{ xp: number; tokens: number } | null>(null);

  const levelRef = useRef<Level>(generateLevel(1));
  const projRef = useRef<Projectile | null>(null);
  const splitProjRef = useRef<Projectile | null>(null);
  const dragRef = useRef<{ dragging: boolean; dx: number; dy: number }>({ dragging: false, dx: 0, dy: 0 });
  const scoreRef = useRef(0);
  const shotsRef = useRef(0);
  const levelNumRef = useRef(1);
  const gameRef = useRef(gameState);
  const frameRef = useRef(0);
  const projTypeRef = useRef(0);

  useEffect(() => { gameRef.current = gameState; }, [gameState]);

  const startGame = useCallback(() => {
    levelNumRef.current = 1;
    scoreRef.current = 0;
    shotsRef.current = 0;
    projTypeRef.current = 0;
    levelRef.current = generateLevel(1);
    projRef.current = null;
    splitProjRef.current = null;
    dragRef.current = { dragging: false, dx: 0, dy: 0 };
    setScore(0); setLevel(1); setShots(0); setProjType(0); setResult(null);
    setGameState("playing");
  }, []);

  const nextLevel = useCallback(() => {
    levelNumRef.current++;
    levelRef.current = generateLevel(levelNumRef.current);
    projRef.current = null;
    splitProjRef.current = null;
    setLevel(levelNumRef.current);
    // Bonus for completing level
    scoreRef.current += 100;
    setScore(scoreRef.current);
  }, []);

  const endGame = useCallback(() => {
    const r = recordGameResult("syntax-smash", scoreRef.current);
    setResult({ xp: r.xpEarned, tokens: r.tokensEarned });
    setGameState("over");
  }, []);

  // Canvas loop
  useEffect(() => {
    if (gameState !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const updateProj = (p: Projectile): boolean => {
      if (!p.active) return false;
      p.trail.push({ x: p.x, y: p.y });
      if (p.trail.length > 20) p.trail.shift();
      p.vy += GRAVITY;
      p.x += p.vx;
      p.y += p.vy;
      if (p.y > H + 20 || p.x > W + 20 || p.x < -20) { p.active = false; return false; }

      // Collision with blocks
      for (const b of levelRef.current.blocks) {
        if (!b.alive) continue;
        if (p.x > b.x - 2 && p.x < b.x + b.w + 2 && p.y > b.y - 2 && p.y < b.y + b.h + 2) {
          b.hp--;
          if (b.hp <= 0) {
            b.alive = false;
            scoreRef.current += 25;
            setScore(scoreRef.current);
          }
          // Function type explodes — damage neighbors
          if (p.type === "function") {
            for (const nb of levelRef.current.blocks) {
              if (!nb.alive || nb === b) continue;
              const dist = Math.hypot(nb.x - b.x, nb.y - b.y);
              if (dist < 60) { nb.hp--; if (nb.hp <= 0) { nb.alive = false; scoreRef.current += 25; setScore(scoreRef.current); } }
            }
            p.active = false;
          }
          // Variable type pushes through
          else if (p.type === "variable") {
            p.vx *= 0.7;
            p.vy *= 0.5;
          }
          // Conditional — already handled via split
          else {
            p.active = false;
          }
          return true;
        }
      }
      return true;
    };

    const loop = () => {
      if (gameRef.current !== "playing") return;

      // Update projectiles
      if (projRef.current) {
        updateProj(projRef.current);
        // Conditional split at peak
        if (projRef.current.type === "conditional" && projRef.current.vy > 0 && !splitProjRef.current && projRef.current.active) {
          splitProjRef.current = {
            x: projRef.current.x,
            y: projRef.current.y,
            vx: projRef.current.vx + 3,
            vy: projRef.current.vy - 2,
            type: "conditional",
            radius: 8,
            active: true,
            trail: [],
          };
          projRef.current.vx -= 2;
        }
      }
      if (splitProjRef.current) updateProj(splitProjRef.current);

      // Check level complete
      const aliveBlocks = levelRef.current.blocks.filter(b => b.alive);
      if (aliveBlocks.length === 0) {
        if (levelNumRef.current >= 10) { endGame(); }
        else { nextLevel(); }
      }

      // --- DRAW ---
      ctx.fillStyle = "hsl(0, 0%, 3%)";
      ctx.fillRect(0, 0, W, H);

      // Ground
      ctx.fillStyle = "rgba(255,255,255,0.03)";
      ctx.fillRect(0, H - 50, W, 50);
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, H - 50); ctx.lineTo(W, H - 50); ctx.stroke();

      // Slingshot
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(SLING_X - 8, SLING_Y + 30); ctx.lineTo(SLING_X - 5, SLING_Y - 10); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(SLING_X + 8, SLING_Y + 30); ctx.lineTo(SLING_X + 5, SLING_Y - 10); ctx.stroke();

      // Draw drag line
      if (dragRef.current.dragging && !projRef.current?.active) {
        const { dx, dy } = dragRef.current;
        ctx.strokeStyle = "rgba(250, 204, 21, 0.4)";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(SLING_X, SLING_Y); ctx.lineTo(SLING_X + dx, SLING_Y + dy); ctx.stroke();
        ctx.setLineDash([]);
        // Projectile preview
        ctx.fillStyle = PROJ_TYPES[projTypeRef.current].color;
        ctx.beginPath();
        ctx.arc(SLING_X + dx, SLING_Y + dy, 10, 0, Math.PI * 2);
        ctx.fill();
        // Trajectory preview
        const power = Math.min(18, Math.hypot(dx, dy) * 0.12);
        const angle = Math.atan2(-dy, -dx);
        let px = SLING_X, py = SLING_Y, pvx = Math.cos(angle) * power, pvy = Math.sin(angle) * power;
        ctx.fillStyle = "rgba(250,204,21,0.15)";
        for (let i = 0; i < 30; i++) {
          pvy += GRAVITY;
          px += pvx; py += pvy;
          if (py > H) break;
          ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI * 2); ctx.fill();
        }
      } else if (!projRef.current?.active && !splitProjRef.current?.active) {
        // Ready projectile at sling
        ctx.fillStyle = PROJ_TYPES[projTypeRef.current].color;
        ctx.beginPath();
        ctx.arc(SLING_X, SLING_Y, 10, 0, Math.PI * 2);
        ctx.fill();
      }

      // Blocks
      for (const b of levelRef.current.blocks) {
        if (!b.alive) continue;
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.roundRect(b.x, b.y, b.w, b.h, 3);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.lineWidth = 1;
        ctx.stroke();
        // HP indicator
        if (b.hp > 1) {
          ctx.fillStyle = "rgba(255,255,255,0.8)";
          ctx.font = "bold 8px Inter, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(`${b.hp}`, b.x + b.w / 2, b.y + b.h / 2 + 3);
        }
      }

      // Bug label
      ctx.fillStyle = "rgba(239, 68, 68, 0.7)";
      ctx.font = "bold 9px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`🐛 ${levelRef.current.bugLabel}`, W - 80, H - 60);

      // Projectiles
      const drawProj = (p: Projectile) => {
        if (!p.active) return;
        // Trail
        for (let i = 0; i < p.trail.length; i++) {
          const alpha = i / p.trail.length * 0.3;
          ctx.fillStyle = `rgba(250, 204, 21, ${alpha})`;
          ctx.beginPath();
          ctx.arc(p.trail[i].x, p.trail[i].y, p.radius * 0.4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = PROJ_TYPES.find(t => t.type === p.type)?.color || "hsl(45,90%,55%)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.3)";
        ctx.lineWidth = 1;
        ctx.stroke();
      };
      if (projRef.current) drawProj(projRef.current);
      if (splitProjRef.current) drawProj(splitProjRef.current);

      // HUD
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "bold 10px Inter, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`Level ${levelNumRef.current}`, 10, 18);
      ctx.textAlign = "right";
      ctx.fillText(`${scoreRef.current} pts`, W - 10, 18);
      ctx.fillText(`Shots: ${shotsRef.current}`, W - 10, 32);

      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameRef.current);
  }, [gameState, endGame, nextLevel]);

  // Drag to launch
  const getCanvasPos = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    const clientX = "touches" in e ? e.touches[0]?.clientX ?? (e as React.TouchEvent).changedTouches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = "touches" in e ? e.touches[0]?.clientY ?? (e as React.TouchEvent).changedTouches[0].clientY : (e as React.MouseEvent).clientY;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const handleStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (projRef.current?.active || splitProjRef.current?.active) return;
    const pos = getCanvasPos(e);
    if (Math.hypot(pos.x - SLING_X, pos.y - SLING_Y) < 50) {
      dragRef.current = { dragging: true, dx: pos.x - SLING_X, dy: pos.y - SLING_Y };
    }
  }, []);

  const handleMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!dragRef.current.dragging) return;
    const pos = getCanvasPos(e);
    dragRef.current.dx = pos.x - SLING_X;
    dragRef.current.dy = pos.y - SLING_Y;
  }, []);

  const handleEnd = useCallback(() => {
    if (!dragRef.current.dragging) return;
    const { dx, dy } = dragRef.current;
    dragRef.current.dragging = false;
    const dist = Math.hypot(dx, dy);
    if (dist < 15) return;
    const power = Math.min(18, dist * 0.12);
    const angle = Math.atan2(-dy, -dx);
    const pt = PROJ_TYPES[projTypeRef.current];
    projRef.current = {
      x: SLING_X, y: SLING_Y,
      vx: Math.cos(angle) * power,
      vy: Math.sin(angle) * power,
      type: pt.type,
      radius: 10,
      active: true,
      trail: [],
    };
    splitProjRef.current = null;
    shotsRef.current++;
    setShots(shotsRef.current);
    // Cycle projectile type
    projTypeRef.current = (projTypeRef.current + 1) % PROJ_TYPES.length;
    setProjType(projTypeRef.current);
  }, []);

  return (
    <div className="min-h-screen pb-24 flex flex-col">
      <div className="px-5 pt-6 pb-3 flex items-center gap-3">
        <Link to="/games" className="p-2 rounded-xl bg-card/60 border border-border/50"><ArrowLeft className="h-4 w-4 text-muted-foreground" /></Link>
        <div className="flex-1">
          <h1 className="font-display text-lg font-bold text-foreground">🏗️ Syntax Smash</h1>
          <p className="text-[11px] text-muted-foreground">Code Catapult</p>
        </div>
        {gameState === "playing" && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Lvl <b className="text-foreground">{level}</b></span>
            <span className="text-muted-foreground">Shots <b className="text-foreground">{shots}</b></span>
            <span className="font-bold text-foreground">{score}</span>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4">
        {gameState === "menu" && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-5">
            <div className="text-7xl mb-2">🏗️</div>
            <h2 className="font-display text-2xl font-black text-foreground">Syntax Smash</h2>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
              Launch logic blocks to destroy bug fortresses. Each block type has unique physics — <span className="text-purple-400 font-semibold">functions explode</span>, <span className="text-sky-400 font-semibold">variables push through</span>, <span className="text-amber-400 font-semibold">conditionals split</span>.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {PROJ_TYPES.map(p => (
                <span key={p.type} className="text-[10px] px-2 py-1 rounded-lg border border-border/30 text-muted-foreground" style={{ borderColor: p.color + "40" }}>
                  <span style={{ color: p.color }}>{p.label}</span> — {p.desc}
                </span>
              ))}
            </div>
            <Button onClick={startGame} size="lg" className="gap-2 text-base font-bold"><Play className="h-5 w-5" /> PLAY</Button>
          </motion.div>
        )}

        {gameState === "playing" && (
          <div className="relative">
            {/* Current block type indicator */}
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center gap-2 text-[10px] font-bold z-10">
              <span className="text-muted-foreground">Next:</span>
              <span className="px-2 py-0.5 rounded-full border border-border/30" style={{ color: PROJ_TYPES[projType].color, borderColor: PROJ_TYPES[projType].color + "40" }}>
                {PROJ_TYPES[projType].label}
              </span>
            </div>
            <canvas
              ref={canvasRef}
              width={W}
              height={H}
              className="rounded-2xl border border-border/40 touch-none"
              style={{ maxWidth: "100%", height: "auto" }}
              onMouseDown={handleStart}
              onMouseMove={handleMove}
              onMouseUp={handleEnd}
              onMouseLeave={handleEnd}
              onTouchStart={handleStart}
              onTouchMove={handleMove}
              onTouchEnd={handleEnd}
            />
            <p className="text-[10px] text-muted-foreground text-center mt-2">Drag from slingshot to aim & launch</p>
          </div>
        )}

        {gameState === "over" && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4">
            <Trophy className="h-14 w-14 text-accent-gold mx-auto" />
            <h2 className="font-display text-2xl font-black text-foreground">Fortress Cleared!</h2>
            <p className="text-4xl font-black text-foreground tabular-nums">{score}</p>
            <p className="text-sm text-muted-foreground">{shots} shots fired across {level} levels</p>
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
