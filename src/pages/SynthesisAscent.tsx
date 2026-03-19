import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Play, RotateCcw, Trophy, Shield, Zap, Sword, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AI_CONCEPTS, shuffleArray, recordGameResult } from "@/lib/arcade-engine";

const W = 360;
const H = 560;
const PLAYER_SIZE = 24;
const BULLET_SPEED = 8;
const BASE_ENEMY_SPEED = 1.2;
const SPAWN_INTERVAL_BASE = 900;
const MODULE_INTERVAL = 4000;

interface Vec2 { x: number; y: number }
interface Bullet extends Vec2 { id: number; dmg: number; color: string; piercing?: boolean }
interface Enemy { id: number; x: number; y: number; w: number; h: number; hp: number; maxHp: number; speed: number; label: string; color: string; type: "block" | "drift" | "burst" }
interface WisdomModule { id: number; x: number; y: number; label: string; icon: string; effect: string; timer: number }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number }

const MODULE_DEFS = [
  { icon: "⚡", label: "Rapid Fire", effect: "rapid" },
  { icon: "🛡️", label: "Shield", effect: "shield" },
  { icon: "💥", label: "Spread Shot", effect: "spread" },
  { icon: "🔥", label: "Pierce Shot", effect: "pierce" },
  { icon: "❄️", label: "Slow Field", effect: "slow" },
  { icon: "💎", label: "Score Boost", effect: "score" },
];

export default function SynthesisAscent() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<"menu" | "playing" | "over">("menu");
  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [hp, setHp] = useState(3);
  const [activeModules, setActiveModules] = useState<string[]>([]);
  const [result, setResult] = useState<{ score: number; wave: number; xp: number; tokens: number } | null>(null);

  const stateRef = useRef({
    player: { x: W / 2, y: H - 60 },
    bullets: [] as Bullet[],
    enemies: [] as Enemy[],
    modules: [] as WisdomModule[],
    particles: [] as Particle[],
    score: 0,
    wave: 1,
    hp: 3,
    effects: {} as Record<string, number>,
    nextBullet: 0,
    nextSpawn: 0,
    nextModule: 0,
    enemyId: 0,
    bulletId: 0,
    moduleId: 0,
    frameCount: 0,
    shakeTimer: 0,
    pointerX: W / 2,
    pointerDown: false,
    autoFire: true,
    running: false,
  });

  const startGame = useCallback(() => {
    const s = stateRef.current;
    s.player = { x: W / 2, y: H - 60 };
    s.bullets = []; s.enemies = []; s.modules = []; s.particles = [];
    s.score = 0; s.wave = 1; s.hp = 3; s.effects = {};
    s.nextBullet = 0; s.nextSpawn = 0; s.nextModule = 0;
    s.enemyId = 0; s.bulletId = 0; s.moduleId = 0;
    s.frameCount = 0; s.shakeTimer = 0; s.running = true;
    setScore(0); setWave(1); setHp(3); setActiveModules([]);
    setGameState("playing");
  }, []);

  const endGame = useCallback(() => {
    const s = stateRef.current;
    s.running = false;
    const r = recordGameResult("synthesis-ascent", s.score, s.wave);
    setResult({ score: s.score, wave: s.wave, xp: r.xpEarned, tokens: r.tokensEarned });
    setGameState("over");
  }, []);

  const spawnParticles = (x: number, y: number, color: string, count: number) => {
    const s = stateRef.current;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      s.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 20 + Math.random() * 15, color, size: 2 + Math.random() * 3 });
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf: number;

    const handlePointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      stateRef.current.pointerX = ((e.clientX - rect.left) / rect.width) * W;
    };

    canvas.addEventListener("pointermove", handlePointer);
    canvas.addEventListener("pointerdown", (e) => { handlePointer(e); stateRef.current.pointerDown = true; });
    canvas.addEventListener("pointerup", () => { stateRef.current.pointerDown = false; });

    const handleKey = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (e.key === "ArrowLeft") s.pointerX = Math.max(PLAYER_SIZE, s.player.x - 20);
      if (e.key === "ArrowRight") s.pointerX = Math.min(W - PLAYER_SIZE, s.player.x + 20);
    };
    window.addEventListener("keydown", handleKey);

    const loop = () => {
      const s = stateRef.current;
      if (!s.running) { raf = requestAnimationFrame(loop); return; }

      s.frameCount++;
      const now = s.frameCount;

      // Move player toward pointer
      const dx = s.pointerX - s.player.x;
      s.player.x += dx * 0.15;
      s.player.x = Math.max(PLAYER_SIZE, Math.min(W - PLAYER_SIZE, s.player.x));

      // Auto-fire
      const fireRate = s.effects.rapid ? 4 : 8;
      if (now % fireRate === 0) {
        const hasSpread = !!s.effects.spread;
        const hasPierce = !!s.effects.pierce;
        const bx = s.player.x, by = s.player.y - 12;
        s.bullets.push({ x: bx, y: by, id: s.bulletId++, dmg: 1, color: hasPierce ? "#ff6b35" : "#00ff88", piercing: hasPierce });
        if (hasSpread) {
          s.bullets.push({ x: bx - 8, y: by, id: s.bulletId++, dmg: 1, color: "#00ccff", piercing: hasPierce });
          s.bullets.push({ x: bx + 8, y: by, id: s.bulletId++, dmg: 1, color: "#00ccff", piercing: hasPierce });
        }
      }

      // Move bullets
      s.bullets = s.bullets.filter(b => { b.y -= BULLET_SPEED; return b.y > -10; });

      // Spawn enemies
      const spawnRate = Math.max(15, Math.floor(60 - s.wave * 3));
      if (now % spawnRate === 0) {
        const concept = AI_CONCEPTS[Math.floor(Math.random() * AI_CONCEPTS.length)];
        const types: Enemy["type"][] = ["block", "drift", "burst"];
        const type = types[Math.floor(Math.random() * Math.min(types.length, 1 + Math.floor(s.wave / 3)))];
        const hp = 1 + Math.floor(s.wave / 4);
        const w = 30 + Math.random() * 20;
        const colors = { block: "#e74c6f", drift: "#9b59b6", burst: "#e67e22" };
        s.enemies.push({
          id: s.enemyId++, x: 20 + Math.random() * (W - 40), y: -30,
          w, h: 20, hp, maxHp: hp,
          speed: BASE_ENEMY_SPEED + s.wave * 0.1 * (s.effects.slow ? 0.4 : 1),
          label: concept.term, color: colors[type], type,
        });
      }

      // Move enemies
      s.enemies.forEach(e => {
        e.y += e.speed;
        if (e.type === "drift") e.x += Math.sin(e.y * 0.05) * 2;
      });

      // Bullet-enemy collision
      const hitBullets = new Set<number>();
      s.enemies = s.enemies.filter(e => {
        for (const b of s.bullets) {
          if (hitBullets.has(b.id) && !b.piercing) continue;
          if (b.x > e.x - e.w / 2 && b.x < e.x + e.w / 2 && b.y > e.y - e.h / 2 && b.y < e.y + e.h / 2) {
            e.hp -= b.dmg;
            if (!b.piercing) hitBullets.add(b.id);
            if (e.hp <= 0) {
              const pts = e.maxHp * 10 * (s.effects.score ? 2 : 1);
              s.score += pts;
              spawnParticles(e.x, e.y, e.color, 8);
              s.shakeTimer = 4;
              return false;
            }
          }
        }
        return true;
      });
      s.bullets = s.bullets.filter(b => !hitBullets.has(b.id));

      // Enemy-player collision
      const hasShield = !!s.effects.shield;
      s.enemies = s.enemies.filter(e => {
        if (e.y > H + 20) return false;
        const dist = Math.hypot(e.x - s.player.x, e.y - s.player.y);
        if (dist < 28) {
          if (!hasShield) {
            s.hp--;
            s.shakeTimer = 8;
          }
          spawnParticles(e.x, e.y, "#ff0000", 12);
          return false;
        }
        if (e.y > H - 10) {
          // Passed through
          return false;
        }
        return true;
      });

      // Spawn modules
      if (now % 240 === 0) {
        const def = MODULE_DEFS[Math.floor(Math.random() * MODULE_DEFS.length)];
        s.modules.push({ id: s.moduleId++, x: 30 + Math.random() * (W - 60), y: -20, ...def, timer: 0 });
      }

      // Move modules
      s.modules = s.modules.filter(m => {
        m.y += 1.5;
        if (m.y > H + 20) return false;
        const dist = Math.hypot(m.x - s.player.x, m.y - s.player.y);
        if (dist < 30) {
          s.effects[m.effect] = (s.effects[m.effect] || 0) + 600; // 10 seconds
          spawnParticles(m.x, m.y, "#00ffcc", 10);
          return false;
        }
        return true;
      });

      // Tick effects
      for (const key of Object.keys(s.effects)) {
        s.effects[key]--;
        if (s.effects[key] <= 0) delete s.effects[key];
      }

      // Update particles
      s.particles = s.particles.filter(p => {
        p.x += p.vx; p.y += p.vy; p.life--;
        p.vx *= 0.96; p.vy *= 0.96;
        return p.life > 0;
      });

      // Wave progression
      const newWave = 1 + Math.floor(s.score / 500);
      if (newWave !== s.wave) s.wave = newWave;

      // Shake
      if (s.shakeTimer > 0) s.shakeTimer--;

      // Update react state sparingly
      if (now % 6 === 0) {
        setScore(s.score);
        setWave(s.wave);
        setHp(s.hp);
        setActiveModules(Object.keys(s.effects));
      }

      if (s.hp <= 0) {
        endGame();
        return;
      }

      // ---- DRAW ----
      ctx.save();
      if (s.shakeTimer > 0) {
        ctx.translate(Math.random() * 4 - 2, Math.random() * 4 - 2);
      }

      // Background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, "#0a0015");
      bgGrad.addColorStop(1, "#1a0030");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Grid lines
      ctx.strokeStyle = "rgba(100, 50, 150, 0.08)";
      ctx.lineWidth = 1;
      for (let i = 0; i < W; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke(); }
      for (let i = (now * 0.5) % 40; i < H; i += 40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke(); }

      // Draw modules
      s.modules.forEach(m => {
        ctx.save();
        ctx.shadowColor = "#00ffcc";
        ctx.shadowBlur = 12;
        ctx.fillStyle = "rgba(0, 255, 204, 0.15)";
        ctx.beginPath();
        ctx.arc(m.x, m.y, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = "18px serif";
        ctx.textAlign = "center";
        ctx.fillText(m.icon, m.x, m.y + 6);
        ctx.restore();
      });

      // Draw enemies
      s.enemies.forEach(e => {
        ctx.save();
        ctx.shadowColor = e.color;
        ctx.shadowBlur = 6;
        ctx.fillStyle = e.color;
        const r = 4;
        ctx.beginPath();
        ctx.roundRect(e.x - e.w / 2, e.y - e.h / 2, e.w, e.h, r);
        ctx.fill();
        // HP bar
        if (e.hp < e.maxHp) {
          ctx.fillStyle = "rgba(0,0,0,0.5)";
          ctx.fillRect(e.x - e.w / 2, e.y - e.h / 2 - 6, e.w, 3);
          ctx.fillStyle = "#00ff88";
          ctx.fillRect(e.x - e.w / 2, e.y - e.h / 2 - 6, e.w * (e.hp / e.maxHp), 3);
        }
        // Label
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.font = "bold 8px 'Space Grotesk'";
        ctx.textAlign = "center";
        ctx.fillText(e.label, e.x, e.y + 4);
        ctx.restore();
      });

      // Draw bullets
      s.bullets.forEach(b => {
        ctx.save();
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 8;
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x - 2, b.y - 6, 4, 12);
        ctx.restore();
      });

      // Draw player
      ctx.save();
      ctx.shadowColor = s.effects.shield ? "#00ccff" : "#00ff88";
      ctx.shadowBlur = s.effects.shield ? 20 : 12;
      ctx.fillStyle = "#00ff88";
      ctx.beginPath();
      ctx.moveTo(s.player.x, s.player.y - 14);
      ctx.lineTo(s.player.x - 12, s.player.y + 10);
      ctx.lineTo(s.player.x + 12, s.player.y + 10);
      ctx.closePath();
      ctx.fill();
      if (s.effects.shield) {
        ctx.strokeStyle = "rgba(0, 200, 255, 0.5)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(s.player.x, s.player.y, 20, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      // Draw particles
      s.particles.forEach(p => {
        ctx.globalAlpha = p.life / 35;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      });
      ctx.globalAlpha = 1;

      ctx.restore();
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointermove", handlePointer);
      window.removeEventListener("keydown", handleKey);
    };
  }, [endGame]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center pb-24">
      <div className="w-full max-w-md px-4 pt-4">
        <div className="flex items-center gap-3 mb-4">
          <Link to="/games"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
          <div>
            <h1 className="text-lg font-black text-foreground">Synthesis Ascent</h1>
            <p className="text-[10px] text-muted-foreground">Roguelite Action • Wave {wave}</p>
          </div>
        </div>

        {/* HUD */}
        {gameState === "playing" && (
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <Heart key={i} className={`h-4 w-4 ${i < hp ? "text-destructive fill-destructive" : "text-muted"}`} />
              ))}
            </div>
            <span className="text-xs font-bold text-accent-gold tabular-nums">{score.toLocaleString()} pts</span>
            <div className="flex gap-1">
              {activeModules.map(m => (
                <span key={m} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-bold">{m}</span>
              ))}
            </div>
          </div>
        )}

        {/* Canvas */}
        <div className="relative rounded-2xl overflow-hidden border border-border/40 mx-auto" style={{ width: W, maxWidth: "100%" }}>
          <canvas ref={canvasRef} width={W} height={H} className="w-full" style={{ aspectRatio: `${W}/${H}`, touchAction: "none" }} />

          {/* Menu Overlay */}
          {gameState === "menu" && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur flex flex-col items-center justify-center gap-4 p-6">
              <div className="text-5xl">🚀</div>
              <h2 className="text-2xl font-black text-foreground text-center">SYNTHESIS ASCENT</h2>
              <p className="text-xs text-muted-foreground text-center max-w-[260px]">
                Battle upward through the Data Tower. Collect Wisdom Modules to build devastating loadouts. Survive as long as you can.
              </p>
              <Button onClick={startGame} className="gap-2 font-bold"><Play className="h-4 w-4" /> START RUN</Button>
            </div>
          )}

          {/* Game Over */}
          {gameState === "over" && result && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur flex flex-col items-center justify-center gap-3 p-6">
              <Trophy className="h-10 w-10 text-accent-gold" />
              <h2 className="text-xl font-black text-foreground">RUN COMPLETE</h2>
              <div className="grid grid-cols-2 gap-3 w-full max-w-[240px]">
                <div className="text-center p-2 rounded-lg bg-card/50 border border-border/30">
                  <p className="text-lg font-black text-foreground">{result.score.toLocaleString()}</p>
                  <p className="text-[9px] text-muted-foreground">SCORE</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-card/50 border border-border/30">
                  <p className="text-lg font-black text-foreground">{result.wave}</p>
                  <p className="text-[9px] text-muted-foreground">WAVE</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-accent-gold/10 border border-accent-gold/20">
                  <p className="text-lg font-black text-accent-gold">+{result.xp}</p>
                  <p className="text-[9px] text-muted-foreground">XP</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-lg font-black text-primary">+{result.tokens}</p>
                  <p className="text-[9px] text-muted-foreground">TOKENS</p>
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <Button onClick={startGame} className="gap-2 font-bold"><RotateCcw className="h-4 w-4" /> RETRY</Button>
                <Link to="/games"><Button variant="outline">ARCADE</Button></Link>
              </div>
            </div>
          )}
        </div>

        <p className="text-[10px] text-muted-foreground text-center mt-3">
          Drag / move pointer to steer • Collect power-ups • Destroy Cognitive Blocks
        </p>
      </div>
    </div>
  );
}
