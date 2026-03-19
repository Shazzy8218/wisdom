import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Play, RotateCcw, Trophy, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { recordGameResult } from "@/lib/arcade-engine";

const W = 380;
const H = 600;
const PLAYER_R = 12;
const BEAT_INTERVAL = 550; // ms per beat

interface Bullet { x: number; y: number; vx: number; vy: number; r: number; color: string; age: number }
interface Pickup { x: number; y: number; type: "score" | "burst"; timer: number }

const PALETTES = [
  ["#a78bfa", "#7c3aed", "#6d28d9"],
  ["#f472b6", "#ec4899", "#db2777"],
  ["#60a5fa", "#3b82f6", "#2563eb"],
  ["#34d399", "#10b981", "#059669"],
  ["#fbbf24", "#f59e0b", "#d97706"],
];

export default function QuantumPulse() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<"menu" | "playing" | "over">("menu");
  const stateRef = useRef<any>(null);
  const keysRef = useRef<Set<string>>(new Set());

  const startGame = useCallback(() => {
    stateRef.current = {
      px: W / 2,
      py: H * 0.75,
      score: 0,
      combo: 0,
      maxCombo: 0,
      hp: 3,
      bullets: [] as Bullet[],
      pickups: [] as Pickup[],
      beat: 0,
      beatTimer: 0,
      tick: 0,
      wavePhase: 0,
      burstActive: 0,
      particles: [] as { x: number; y: number; vx: number; vy: number; life: number; color: string }[],
      palette: PALETTES[0],
      bgPulse: 0,
      difficulty: 1,
    };
    setGameState("playing");
  }, []);

  // Keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => { keysRef.current.add(e.key.toLowerCase()); e.preventDefault(); };
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    window.addEventListener("keydown", down, { passive: false });
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  // Touch movement
  const touchRef = useRef<{ x: number; y: number } | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) touchRef.current = { x: t.clientX - rect.left, y: t.clientY - rect.top };
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const t = e.touches[0];
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect && stateRef.current) {
      const nx = t.clientX - rect.left;
      const ny = t.clientY - rect.top;
      stateRef.current.px = Math.max(PLAYER_R, Math.min(W - PLAYER_R, nx));
      stateRef.current.py = Math.max(PLAYER_R, Math.min(H - PLAYER_R, ny));
    }
  };
  const handleTouchEnd = () => { touchRef.current = null; };

  // Game loop
  useEffect(() => {
    if (gameState !== "playing") return;
    let raf: number;
    let lastTime = performance.now();

    const spawnWave = (s: any) => {
      const phase = s.wavePhase % 6;
      const pal = PALETTES[s.wavePhase % PALETTES.length];
      s.palette = pal;
      const speed = 1.2 + s.difficulty * 0.3;
      const count = 6 + Math.floor(s.difficulty * 2);

      if (phase === 0) {
        // Spiral
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2 + s.tick * 0.01;
          s.bullets.push({ x: W / 2, y: -10, vx: Math.cos(angle) * speed, vy: speed * 1.5, r: 5, color: pal[i % 3], age: 0 });
        }
      } else if (phase === 1) {
        // Rain
        for (let i = 0; i < count; i++) {
          s.bullets.push({ x: Math.random() * W, y: -10 - Math.random() * 40, vx: (Math.random() - 0.5) * 0.5, vy: speed * 1.8, r: 4, color: pal[i % 3], age: 0 });
        }
      } else if (phase === 2) {
        // V-pattern
        for (let i = 0; i < count; i++) {
          const side = i < count / 2 ? -1 : 1;
          s.bullets.push({ x: W / 2, y: -10, vx: side * (i % (count / 2)) * 0.4, vy: speed * 1.5, r: 5, color: pal[i % 3], age: 0 });
        }
      } else if (phase === 3) {
        // Wall with gap
        const gap = Math.floor(Math.random() * (count - 2)) + 1;
        for (let i = 0; i < count; i++) {
          if (i === gap || i === gap + 1) continue;
          s.bullets.push({ x: (i / count) * W + 15, y: -10, vx: 0, vy: speed * 2, r: 6, color: pal[i % 3], age: 0 });
        }
      } else if (phase === 4) {
        // Aimed at player
        for (let i = 0; i < Math.ceil(count * 0.6); i++) {
          const angle = Math.atan2(s.py - (-10), s.px - (W / 2)) + (Math.random() - 0.5) * 0.6;
          s.bullets.push({ x: W / 2, y: -10, vx: Math.cos(angle) * speed * 1.5, vy: Math.sin(angle) * speed * 1.5, r: 5, color: pal[i % 3], age: 0 });
        }
      } else {
        // Circle burst
        for (let i = 0; i < count + 4; i++) {
          const angle = (i / (count + 4)) * Math.PI * 2;
          s.bullets.push({ x: W / 2, y: H * 0.3, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, r: 5, color: pal[i % 3], age: 0 });
        }
      }
      s.wavePhase++;
    };

    const loop = (time: number) => {
      const dt = Math.min(time - lastTime, 33);
      lastTime = time;
      const s = stateRef.current;
      if (!s) { raf = requestAnimationFrame(loop); return; }

      s.tick++;
      s.bgPulse = Math.max(0, s.bgPulse - 0.02);

      // Keyboard movement
      const spd = 4.5;
      const k = keysRef.current;
      if (k.has("arrowleft") || k.has("a")) s.px = Math.max(PLAYER_R, s.px - spd);
      if (k.has("arrowright") || k.has("d")) s.px = Math.min(W - PLAYER_R, s.px + spd);
      if (k.has("arrowup") || k.has("w")) s.py = Math.max(PLAYER_R, s.py - spd);
      if (k.has("arrowdown") || k.has("s")) s.py = Math.min(H - PLAYER_R, s.py + spd);

      // Beat timer
      s.beatTimer += dt;
      if (s.beatTimer >= BEAT_INTERVAL) {
        s.beatTimer -= BEAT_INTERVAL;
        s.beat++;
        s.bgPulse = 1;

        // Spawn bullets on beat
        if (s.beat % 2 === 0) spawnWave(s);

        // Score for surviving each beat
        s.score += 5 + s.combo;
        s.combo++;
        s.maxCombo = Math.max(s.maxCombo, s.combo);

        // Spawn pickups occasionally
        if (s.beat % 7 === 0) {
          s.pickups.push({ x: Math.random() * (W - 40) + 20, y: -10, type: Math.random() > 0.7 ? "burst" : "score", timer: 300 });
        }

        // Increase difficulty
        if (s.beat % 12 === 0) s.difficulty += 0.25;
      }

      if (s.burstActive > 0) s.burstActive--;

      // Update bullets
      s.bullets = s.bullets.filter((b: Bullet) => {
        b.x += b.vx;
        b.y += b.vy;
        b.age++;
        if (b.x < -20 || b.x > W + 20 || b.y < -20 || b.y > H + 20) return false;

        // Burst clears nearby bullets
        if (s.burstActive > 0) {
          const d = Math.sqrt((b.x - s.px) ** 2 + (b.y - s.py) ** 2);
          if (d < 80) {
            s.score += 2;
            for (let i = 0; i < 3; i++) {
              s.particles.push({ x: b.x, y: b.y, vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 3, life: 20, color: b.color });
            }
            return false;
          }
        }

        // Collision
        const dx = b.x - s.px;
        const dy = b.y - s.py;
        if (Math.sqrt(dx * dx + dy * dy) < b.r + PLAYER_R - 4) {
          s.hp--;
          s.combo = 0;
          s.bgPulse = 1;
          for (let i = 0; i < 8; i++) {
            s.particles.push({ x: s.px, y: s.py, vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5, life: 30, color: "#ff4444" });
          }
          if (s.hp <= 0) {
            const r = recordGameResult("quantum-pulse", s.score, s.maxCombo);
            stateRef.current = { ...s, result: { score: s.score, combo: s.maxCombo, beats: s.beat, xp: r.xpEarned, tokens: r.tokensEarned } };
            setGameState("over");
          }
          return false;
        }
        return true;
      });

      // Update pickups
      s.pickups = s.pickups.filter((p: Pickup) => {
        p.y += 1.5;
        p.timer--;
        if (p.y > H + 20 || p.timer <= 0) return false;
        const d = Math.sqrt((p.x - s.px) ** 2 + (p.y - s.py) ** 2);
        if (d < PLAYER_R + 14) {
          if (p.type === "score") { s.score += 50; s.combo += 3; }
          if (p.type === "burst") { s.burstActive = 30; }
          for (let i = 0; i < 6; i++) {
            s.particles.push({ x: p.x, y: p.y, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4, life: 25, color: p.type === "burst" ? "#fbbf24" : "#60a5fa" });
          }
          return false;
        }
        return true;
      });

      // Update particles
      s.particles = s.particles.filter((p: any) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        return p.life > 0;
      });

      // Render
      const canvas = canvasRef.current;
      if (!canvas) { raf = requestAnimationFrame(loop); return; }
      const ctx = canvas.getContext("2d")!;

      // Background with beat pulse
      const bgI = Math.floor(s.bgPulse * 15);
      ctx.fillStyle = `rgb(${5 + bgI}, ${3 + bgI}, ${15 + bgI * 2})`;
      ctx.fillRect(0, 0, W, H);

      // Beat rings
      if (s.bgPulse > 0.3) {
        const ringR = (1 - s.bgPulse) * 300;
        ctx.strokeStyle = `rgba(${parseInt(s.palette[0].slice(1, 3), 16)}, ${parseInt(s.palette[0].slice(3, 5), 16)}, ${parseInt(s.palette[0].slice(5, 7), 16)}, ${s.bgPulse * 0.2})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(W / 2, H / 2, ringR, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Particles
      s.particles.forEach((p: any) => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 30;
        ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
      });
      ctx.globalAlpha = 1;

      // Bullets
      s.bullets.forEach((b: Bullet) => {
        ctx.fillStyle = b.color;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
        // Glow
        ctx.globalAlpha = 0.2;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r + 4, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Pickups
      s.pickups.forEach((p: Pickup) => {
        const pulse = 0.7 + Math.sin(s.tick * 0.1) * 0.3;
        ctx.fillStyle = p.type === "burst" ? `rgba(251, 191, 36, ${pulse})` : `rgba(96, 165, 250, ${pulse})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = "12px sans-serif";
        ctx.fillText(p.type === "burst" ? "💥" : "⭐", p.x - 7, p.y + 5);
      });

      // Player
      if (s.burstActive > 0) {
        ctx.strokeStyle = "rgba(251, 191, 36, 0.4)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(s.px, s.py, 80, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Ship glow
      ctx.fillStyle = `rgba(96, 165, 250, 0.15)`;
      ctx.beginPath();
      ctx.arc(s.px, s.py, PLAYER_R + 8, 0, Math.PI * 2);
      ctx.fill();
      // Ship body
      ctx.fillStyle = "#60a5fa";
      ctx.beginPath();
      ctx.moveTo(s.px, s.py - PLAYER_R);
      ctx.lineTo(s.px - PLAYER_R * 0.8, s.py + PLAYER_R * 0.6);
      ctx.lineTo(s.px + PLAYER_R * 0.8, s.py + PLAYER_R * 0.6);
      ctx.closePath();
      ctx.fill();
      // Core
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(s.px, s.py, 3, 0, Math.PI * 2);
      ctx.fill();

      // HUD
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(0, 0, W, 36);
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "bold 12px sans-serif";
      ctx.fillText(`♪ Beat ${s.beat}`, 10, 24);
      ctx.fillText(`Score: ${s.score}`, W / 2 - 30, 24);
      ctx.fillText(`❤️×${s.hp}`, W - 55, 24);
      // Combo
      if (s.combo > 5) {
        ctx.fillStyle = s.palette[0];
        ctx.font = `bold ${14 + Math.min(s.combo, 20)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(`${s.combo}x COMBO`, W / 2, H - 30);
        ctx.textAlign = "left";
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [gameState]);

  const s = stateRef.current;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center pb-24">
      <div className="w-full max-w-md px-4 pt-4">
        <div className="flex items-center gap-3 mb-3">
          <Link to="/games"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
          <div>
            <h1 className="text-lg font-black text-foreground">Quantum Pulse</h1>
            <p className="text-[10px] text-muted-foreground">Rhythm Bullet Hell • Dodge, survive, combo</p>
          </div>
        </div>

        {gameState === "playing" && (
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            className="rounded-xl border border-border/30 mx-auto block"
            style={{ touchAction: "none" }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />
        )}

        {gameState === "menu" && (
          <div className="flex flex-col items-center justify-center gap-4 p-8 mt-8">
            <div className="text-5xl">💠</div>
            <h2 className="text-2xl font-black text-foreground text-center">QUANTUM PULSE</h2>
            <p className="text-xs text-muted-foreground text-center max-w-[280px]">
              Pilot your Phase Ship through waves of music-synced bullet patterns. Dodge, collect power-ups, and chain combos. Every beat survived earns points.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 font-bold">Rhythm</span>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20 font-bold">Bullet Hell</span>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground border border-border/30 font-bold">Score Attack</span>
            </div>
            <Button onClick={startGame} className="gap-2 font-bold"><Play className="h-4 w-4" /> DROP THE BEAT</Button>
          </div>
        )}

        {gameState === "over" && s?.result && (
          <div className="flex flex-col items-center justify-center gap-3 p-8 mt-8">
            <Trophy className="h-10 w-10 text-accent-gold" />
            <h2 className="text-xl font-black text-foreground">SIGNAL LOST</h2>
            <div className="grid grid-cols-2 gap-3 w-full max-w-[240px]">
              <div className="text-center p-2 rounded-lg bg-card/50 border border-border/30">
                <p className="text-lg font-black text-foreground">{s.result.score.toLocaleString()}</p>
                <p className="text-[9px] text-muted-foreground">SCORE</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-card/50 border border-border/30">
                <p className="text-lg font-black text-foreground">{s.result.combo}x</p>
                <p className="text-[9px] text-muted-foreground">MAX COMBO</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-accent-gold/10 border border-accent-gold/20">
                <p className="text-lg font-black text-accent-gold">+{s.result.xp}</p>
                <p className="text-[9px] text-muted-foreground">XP</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-lg font-black text-primary">+{s.result.tokens}</p>
                <p className="text-[9px] text-muted-foreground">TOKENS</p>
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <Button onClick={startGame} className="gap-2 font-bold"><RotateCcw className="h-4 w-4" /> REPLAY</Button>
              <Link to="/games"><Button variant="outline">ARCADE</Button></Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
