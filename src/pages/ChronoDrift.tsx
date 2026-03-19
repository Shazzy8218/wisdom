import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Play, RotateCcw, Trophy, Gauge, Timer, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { recordGameResult } from "@/lib/arcade-engine";

const W = 360;
const H = 560;
const LANE_W = 60;
const LANES = 5;
const ROAD_W = LANES * LANE_W;
const ROAD_X = (W - ROAD_W) / 2;

interface Obstacle { id: number; lane: number; y: number; w: number; h: number; color: string; type: "wall" | "boost" | "coin" }
interface Trail { x: number; y: number; alpha: number }

export default function ChronoDrift() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<"menu" | "playing" | "over">("menu");
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [result, setResult] = useState<{ score: number; dist: number; xp: number; tokens: number } | null>(null);

  const stateRef = useRef({
    playerLane: 2,
    playerX: 0,
    targetX: 0,
    speed: 3,
    maxSpeed: 3,
    score: 0,
    distance: 0,
    obstacles: [] as Obstacle[],
    trails: [] as Trail[],
    obstacleId: 0,
    frame: 0,
    driftAngle: 0,
    boosted: 0,
    shakeTimer: 0,
    alive: true,
    running: false,
    touchStartX: 0,
  });

  const laneX = (lane: number) => ROAD_X + lane * LANE_W + LANE_W / 2;

  const startGame = useCallback(() => {
    const s = stateRef.current;
    s.playerLane = 2; s.playerX = laneX(2); s.targetX = laneX(2);
    s.speed = 3; s.maxSpeed = 3; s.score = 0; s.distance = 0;
    s.obstacles = []; s.trails = [];
    s.obstacleId = 0; s.frame = 0; s.driftAngle = 0; s.boosted = 0;
    s.shakeTimer = 0; s.alive = true; s.running = true;
    setScore(0); setSpeed(0); setDistance(0);
    setGameState("playing");
  }, []);

  const endGame = useCallback(() => {
    const s = stateRef.current;
    s.running = false; s.alive = false;
    const r = recordGameResult("chrono-drift", s.score, Math.floor(s.distance / 100));
    setResult({ score: s.score, dist: Math.floor(s.distance), xp: r.xpEarned, tokens: r.tokensEarned });
    setGameState("over");
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf: number;

    const handleKey = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (!s.running) return;
      if (e.key === "ArrowLeft" && s.playerLane > 0) {
        s.playerLane--;
        s.targetX = laneX(s.playerLane);
      }
      if (e.key === "ArrowRight" && s.playerLane < LANES - 1) {
        s.playerLane++;
        s.targetX = laneX(s.playerLane);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      stateRef.current.touchStartX = e.touches[0].clientX;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      const s = stateRef.current;
      if (!s.running) return;
      const dx = e.changedTouches[0].clientX - s.touchStartX;
      if (Math.abs(dx) > 30) {
        if (dx < 0 && s.playerLane > 0) { s.playerLane--; s.targetX = laneX(s.playerLane); }
        if (dx > 0 && s.playerLane < LANES - 1) { s.playerLane++; s.targetX = laneX(s.playerLane); }
      }
    };

    window.addEventListener("keydown", handleKey);
    canvas.addEventListener("touchstart", handleTouchStart, { passive: true });
    canvas.addEventListener("touchend", handleTouchEnd, { passive: true });

    const loop = () => {
      const s = stateRef.current;
      if (!s.running) { raf = requestAnimationFrame(loop); return; }
      s.frame++;

      // Speed ramp
      s.maxSpeed = 3 + s.distance * 0.002;
      if (s.boosted > 0) { s.speed = s.maxSpeed * 1.8; s.boosted--; }
      else { s.speed += (s.maxSpeed - s.speed) * 0.02; }

      s.distance += s.speed;
      s.score = Math.floor(s.distance / 5);

      // Move player
      const dx = s.targetX - s.playerX;
      s.playerX += dx * 0.18;
      s.driftAngle = dx * 0.02;

      // Trail
      if (s.frame % 2 === 0) {
        s.trails.push({ x: s.playerX, y: H - 50, alpha: 0.6 });
      }
      s.trails = s.trails.filter(t => { t.alpha -= 0.03; return t.alpha > 0; });

      // Spawn obstacles
      const spawnRate = Math.max(15, 40 - Math.floor(s.distance / 200));
      if (s.frame % spawnRate === 0) {
        const count = 1 + Math.floor(Math.random() * Math.min(3, 1 + s.distance / 500));
        const usedLanes = new Set<number>();
        for (let i = 0; i < count; i++) {
          let lane: number;
          do { lane = Math.floor(Math.random() * LANES); } while (usedLanes.has(lane));
          usedLanes.add(lane);

          const rng = Math.random();
          if (rng < 0.1) {
            s.obstacles.push({ id: s.obstacleId++, lane, y: -30, w: 40, h: 20, color: "#00ff88", type: "boost" });
          } else if (rng < 0.25) {
            s.obstacles.push({ id: s.obstacleId++, lane, y: -30, w: 16, h: 16, color: "#ffd700", type: "coin" });
          } else {
            s.obstacles.push({ id: s.obstacleId++, lane, y: -30, w: 44, h: 24, color: "#e74c6f", type: "wall" });
          }
        }
      }

      // Move obstacles & check collision
      const bikeX = s.playerX;
      const bikeY = H - 50;
      const bikeHW = 14, bikeHH = 18;

      s.obstacles = s.obstacles.filter(o => {
        o.y += s.speed * 1.5;
        if (o.y > H + 40) return false;

        const ox = laneX(o.lane);
        const hit = Math.abs(ox - bikeX) < (o.w / 2 + bikeHW) && Math.abs(o.y - bikeY) < (o.h / 2 + bikeHH);

        if (hit) {
          if (o.type === "wall") {
            s.shakeTimer = 10;
            endGame();
            return false;
          }
          if (o.type === "boost") {
            s.boosted = 90;
            s.score += 50;
            return false;
          }
          if (o.type === "coin") {
            s.score += 25;
            return false;
          }
        }
        return true;
      });

      if (s.shakeTimer > 0) s.shakeTimer--;

      // React state
      if (s.frame % 6 === 0) {
        setScore(s.score);
        setSpeed(Math.floor(s.speed * 30));
        setDistance(Math.floor(s.distance));
      }

      // ---- DRAW ----
      ctx.save();
      if (s.shakeTimer > 0) ctx.translate(Math.random() * 6 - 3, Math.random() * 6 - 3);

      // Sky
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, "#050520");
      sky.addColorStop(1, "#0f0f3a");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // Road
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(ROAD_X, 0, ROAD_W, H);

      // Lane markings (scrolling)
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.setLineDash([20, 20]);
      ctx.lineDashOffset = -(s.frame * s.speed * 1.5) % 40;
      for (let i = 1; i < LANES; i++) {
        const lx = ROAD_X + i * LANE_W;
        ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, H); ctx.stroke();
      }
      ctx.setLineDash([]);

      // Road edges glow
      ctx.shadowColor = "#6366f1";
      ctx.shadowBlur = 12;
      ctx.strokeStyle = "#6366f1";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(ROAD_X, 0); ctx.lineTo(ROAD_X, H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ROAD_X + ROAD_W, 0); ctx.lineTo(ROAD_X + ROAD_W, H); ctx.stroke();
      ctx.shadowBlur = 0;

      // Trail
      s.trails.forEach(t => {
        ctx.globalAlpha = t.alpha * 0.4;
        ctx.fillStyle = s.boosted > 0 ? "#00ff88" : "#6366f1";
        ctx.fillRect(t.x - 3, t.y, 2, 8);
        ctx.fillRect(t.x + 1, t.y, 2, 8);
      });
      ctx.globalAlpha = 1;

      // Obstacles
      s.obstacles.forEach(o => {
        const ox = laneX(o.lane);
        ctx.save();
        if (o.type === "wall") {
          ctx.shadowColor = "#e74c6f";
          ctx.shadowBlur = 6;
          ctx.fillStyle = o.color;
          ctx.fillRect(ox - o.w / 2, o.y - o.h / 2, o.w, o.h);
          ctx.fillStyle = "rgba(0,0,0,0.3)";
          ctx.fillRect(ox - o.w / 2, o.y - o.h / 2, o.w, 4);
        } else if (o.type === "boost") {
          ctx.shadowColor = "#00ff88";
          ctx.shadowBlur = 10;
          ctx.fillStyle = "#00ff88";
          ctx.font = "20px serif";
          ctx.textAlign = "center";
          ctx.fillText("⚡", ox, o.y + 6);
        } else {
          ctx.shadowColor = "#ffd700";
          ctx.shadowBlur = 8;
          ctx.fillStyle = "#ffd700";
          ctx.beginPath();
          ctx.arc(ox, o.y, 8, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      // Player bike
      ctx.save();
      ctx.translate(bikeX, bikeY);
      ctx.rotate(s.driftAngle);
      // Body
      ctx.shadowColor = s.boosted > 0 ? "#00ff88" : "#6366f1";
      ctx.shadowBlur = s.boosted > 0 ? 20 : 10;
      ctx.fillStyle = s.boosted > 0 ? "#00ff88" : "#8b5cf6";
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(-12, 12);
      ctx.lineTo(-4, 16);
      ctx.lineTo(4, 16);
      ctx.lineTo(12, 12);
      ctx.closePath();
      ctx.fill();
      // Cockpit
      ctx.fillStyle = "#00ccff";
      ctx.beginPath();
      ctx.ellipse(0, -6, 4, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      // Engine glow
      ctx.fillStyle = s.boosted > 0 ? "rgba(0,255,136,0.6)" : "rgba(255,100,50,0.6)";
      ctx.beginPath();
      ctx.ellipse(0, 18, 4 + Math.random() * 2, 6 + Math.random() * 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Speed lines
      if (s.speed > 5) {
        ctx.globalAlpha = Math.min(0.3, (s.speed - 5) * 0.03);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1;
        for (let i = 0; i < 6; i++) {
          const sx = Math.random() * W;
          const sy = Math.random() * H;
          ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx, sy + 15 + s.speed * 2); ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      ctx.restore();
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", handleKey);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchend", handleTouchEnd);
    };
  }, [endGame]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center pb-24">
      <div className="w-full max-w-md px-4 pt-4">
        <div className="flex items-center gap-3 mb-4">
          <Link to="/games"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
          <div>
            <h1 className="text-lg font-black text-foreground">Chrono-Drift</h1>
            <p className="text-[10px] text-muted-foreground">Physics Racer • Infinite Track</p>
          </div>
        </div>

        {gameState === "playing" && (
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-1 text-xs font-bold text-foreground">
              <Gauge className="h-3 w-3 text-primary" />{speed} km/h
            </div>
            <span className="text-xs font-bold text-accent-gold tabular-nums">{score.toLocaleString()} pts</span>
            <span className="text-[10px] text-muted-foreground">{distance}m</span>
          </div>
        )}

        <div className="relative rounded-2xl overflow-hidden border border-border/40 mx-auto" style={{ width: W, maxWidth: "100%" }}>
          <canvas ref={canvasRef} width={W} height={H} className="w-full" style={{ aspectRatio: `${W}/${H}`, touchAction: "none" }} />

          {gameState === "menu" && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur flex flex-col items-center justify-center gap-4 p-6">
              <div className="text-5xl">🏎️</div>
              <h2 className="text-2xl font-black text-foreground text-center">CHRONO-DRIFT</h2>
              <p className="text-xs text-muted-foreground text-center max-w-[260px]">
                Pilot a Hover-Bike through an infinite data highway. Swipe to dodge walls, collect boosts, and survive as speed escalates.
              </p>
              <Button onClick={startGame} className="gap-2 font-bold"><Play className="h-4 w-4" /> RACE</Button>
            </div>
          )}

          {gameState === "over" && result && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur flex flex-col items-center justify-center gap-3 p-6">
              <Trophy className="h-10 w-10 text-accent-gold" />
              <h2 className="text-xl font-black text-foreground">RACE OVER</h2>
              <div className="grid grid-cols-2 gap-3 w-full max-w-[240px]">
                <div className="text-center p-2 rounded-lg bg-card/50 border border-border/30">
                  <p className="text-lg font-black text-foreground">{result.score.toLocaleString()}</p>
                  <p className="text-[9px] text-muted-foreground">SCORE</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-card/50 border border-border/30">
                  <p className="text-lg font-black text-foreground">{result.dist}m</p>
                  <p className="text-[9px] text-muted-foreground">DISTANCE</p>
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
          Swipe left/right or arrow keys to dodge • Collect ⚡ for turbo boost
        </p>
      </div>
    </div>
  );
}
