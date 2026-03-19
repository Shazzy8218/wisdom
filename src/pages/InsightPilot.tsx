import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Play, RotateCcw, Trophy, Zap, Star, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { recordGameResult, AI_CONCEPTS, shuffleArray } from "@/lib/arcade-engine";

const W = 360;
const H = 560;
const LANE_COUNT = 3;
const LANE_W = W / LANE_COUNT;
const DRONE_SIZE = 32;
const OBSTACLE_H = 18;
const FUEL_SIZE = 14;
const DECISION_H = 60;

interface Obstacle { x: number; y: number; lane: number; label: string }
interface Fuel { x: number; y: number; lane: number; type: "fuel" | "shield" | "turbo"; label: string }
interface Decision { y: number; question: string; options: { label: string; lane: number; correct: boolean }[] }

const SCENARIOS = [
  { q: "High traffic detected — optimize for?", correct: "Speed", wrong: ["Cost", "Accuracy"] },
  { q: "User wants creative output — set?", correct: "High Temperature", wrong: ["Low Temperature", "Zero-shot"] },
  { q: "Need factual answers — use?", correct: "RAG Pipeline", wrong: ["High Temperature", "Random Sampling"] },
  { q: "Processing documents — best approach?", correct: "Embeddings", wrong: ["Brute Force", "Random Walk"] },
  { q: "Complex reasoning needed — apply?", correct: "Chain-of-Thought", wrong: ["Single Token", "Greedy Decode"] },
  { q: "Training on domain data — use?", correct: "Fine-tuning", wrong: ["Zero-shot", "Random Init"] },
  { q: "Building autonomous system?", correct: "AI Agent", wrong: ["Static Script", "Hard-coded Rules"] },
  { q: "Reducing hallucinations?", correct: "Retrieval Grounding", wrong: ["Higher Temperature", "Longer Prompts"] },
];

export default function InsightPilot() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<"menu" | "playing" | "over">("menu");
  const [score, setScore] = useState(0);
  const [distance, setDistance] = useState(0);
  const [result, setResult] = useState<{ xp: number; tokens: number } | null>(null);
  const [activeDecision, setActiveDecision] = useState<Decision | null>(null);

  const stateRef = useRef({ lane: 1, y: H - 80, score: 0, dist: 0, speed: 3, shield: false, shieldTimer: 0, alive: true });
  const obstaclesRef = useRef<Obstacle[]>([]);
  const fuelsRef = useRef<Fuel[]>([]);
  const decisionsRef = useRef<Decision[]>([]);
  const gameRef = useRef(gameState);
  const frameRef = useRef(0);
  const spawnTimerRef = useRef(0);
  const decisionTimerRef = useRef(0);

  useEffect(() => { gameRef.current = gameState; }, [gameState]);

  const startGame = useCallback(() => {
    stateRef.current = { lane: 1, y: H - 80, score: 0, dist: 0, speed: 3, shield: false, shieldTimer: 0, alive: true };
    obstaclesRef.current = [];
    fuelsRef.current = [];
    decisionsRef.current = [];
    spawnTimerRef.current = 0;
    decisionTimerRef.current = 0;
    setScore(0); setDistance(0); setResult(null); setActiveDecision(null);
    setGameState("playing");
  }, []);

  const endGame = useCallback(() => {
    stateRef.current.alive = false;
    const s = stateRef.current.score;
    const r = recordGameResult("insight-pilot", s);
    setResult({ xp: r.xpEarned, tokens: r.tokensEarned });
    setGameState("over");
  }, []);

  // Game loop
  useEffect(() => {
    if (gameState !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let scenarioPool = shuffleArray([...SCENARIOS]);
    let scenarioIdx = 0;

    const loop = () => {
      if (gameRef.current !== "playing" || !stateRef.current.alive) return;
      const st = stateRef.current;
      st.dist += st.speed * 0.1;
      st.score += Math.floor(st.speed * 0.5);
      setScore(st.score);
      setDistance(Math.floor(st.dist));

      // Increase speed over time
      st.speed = Math.min(12, 3 + st.dist * 0.008);

      // Shield countdown
      if (st.shield) { st.shieldTimer--; if (st.shieldTimer <= 0) st.shield = false; }

      // Spawn obstacles
      spawnTimerRef.current++;
      if (spawnTimerRef.current > Math.max(25, 60 - st.dist * 0.3)) {
        spawnTimerRef.current = 0;
        const lane = Math.floor(Math.random() * LANE_COUNT);
        const concepts = AI_CONCEPTS.filter(c => c.category === "foundations");
        const label = concepts[Math.floor(Math.random() * concepts.length)].term;
        obstaclesRef.current.push({ x: lane * LANE_W + LANE_W / 2, y: -20, lane, label: "BUG" });
        // Also spawn fuel sometimes
        if (Math.random() < 0.3) {
          let fLane: number;
          do { fLane = Math.floor(Math.random() * LANE_COUNT); } while (fLane === lane);
          const types: ("fuel" | "shield" | "turbo")[] = ["fuel", "fuel", "shield", "turbo"];
          const type = types[Math.floor(Math.random() * types.length)];
          fuelsRef.current.push({ x: fLane * LANE_W + LANE_W / 2, y: -20, lane: fLane, type, label: type === "shield" ? "Shield" : type === "turbo" ? "Boost" : "Data" });
        }
      }

      // Spawn decisions periodically
      decisionTimerRef.current++;
      if (decisionTimerRef.current > 300 && decisionsRef.current.length === 0) {
        decisionTimerRef.current = 0;
        if (scenarioIdx >= scenarioPool.length) { scenarioPool = shuffleArray([...SCENARIOS]); scenarioIdx = 0; }
        const sc = scenarioPool[scenarioIdx++];
        const lanes = shuffleArray([0, 1, 2]);
        const correctLane = lanes[0];
        const options = [
          { label: sc.correct, lane: correctLane, correct: true },
          { label: sc.wrong[0], lane: lanes[1], correct: false },
          { label: sc.wrong[1], lane: lanes[2], correct: false },
        ].sort((a, b) => a.lane - b.lane);
        decisionsRef.current.push({ y: -DECISION_H, question: sc.q, options });
        setActiveDecision({ y: -DECISION_H, question: sc.q, options });
      }

      // Move obstacles
      obstaclesRef.current = obstaclesRef.current.filter(o => {
        o.y += st.speed * 2;
        return o.y < H + 20;
      });
      fuelsRef.current = fuelsRef.current.filter(f => {
        f.y += st.speed * 2;
        return f.y < H + 20;
      });
      // Move decisions
      decisionsRef.current = decisionsRef.current.filter(d => {
        d.y += st.speed * 1.5;
        return d.y < H + 20;
      });

      // Collision — drone
      const droneX = st.lane * LANE_W + LANE_W / 2;
      const droneY = st.y;

      // Obstacle collision
      for (const o of obstaclesRef.current) {
        if (Math.abs(o.x - droneX) < DRONE_SIZE && Math.abs(o.y - droneY) < DRONE_SIZE) {
          if (st.shield) {
            o.y = H + 100; // destroy
          } else {
            endGame(); return;
          }
        }
      }

      // Fuel collision
      fuelsRef.current = fuelsRef.current.filter(f => {
        if (Math.abs(f.x - droneX) < DRONE_SIZE && Math.abs(f.y - droneY) < DRONE_SIZE) {
          if (f.type === "shield") { st.shield = true; st.shieldTimer = 120; }
          else if (f.type === "turbo") { st.score += 50; setScore(st.score); }
          else { st.score += 15; setScore(st.score); }
          return false;
        }
        return true;
      });

      // Decision zone collision
      for (const d of decisionsRef.current) {
        if (d.y > droneY - DECISION_H && d.y < droneY + DRONE_SIZE) {
          const chosen = d.options.find(o => o.lane === st.lane);
          if (chosen) {
            if (chosen.correct) {
              st.score += 100;
              st.speed = Math.min(12, st.speed + 1);
              setScore(st.score);
            } else {
              st.speed = Math.max(2, st.speed - 2);
            }
            decisionsRef.current = [];
            setActiveDecision(null);
          }
        }
      }

      // --- DRAW ---
      // Background
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "hsl(220, 30%, 8%)");
      grad.addColorStop(1, "hsl(0, 0%, 3%)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Lane lines
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      for (let i = 1; i < LANE_COUNT; i++) {
        const lx = i * LANE_W;
        for (let dy = (st.dist * 10) % 30; dy < H; dy += 30) {
          ctx.beginPath();
          ctx.moveTo(lx, dy);
          ctx.lineTo(lx, dy + 15);
          ctx.stroke();
        }
      }

      // Speed lines
      ctx.strokeStyle = `rgba(255,255,255,${Math.min(0.08, st.speed * 0.008)})`;
      for (let i = 0; i < 6; i++) {
        const sx = Math.random() * W;
        const sy = (st.dist * 20 + i * 100) % H;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx, sy + st.speed * 8);
        ctx.stroke();
      }

      // Decision zone
      for (const d of decisionsRef.current) {
        ctx.fillStyle = "rgba(99, 102, 241, 0.08)";
        ctx.fillRect(0, d.y, W, DECISION_H);
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.font = "bold 10px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(d.question, W / 2, d.y + 15);
        for (const opt of d.options) {
          const ox = opt.lane * LANE_W + LANE_W / 2;
          ctx.fillStyle = "rgba(99, 102, 241, 0.2)";
          ctx.beginPath();
          ctx.roundRect(ox - 45, d.y + 22, 90, 28, 6);
          ctx.fill();
          ctx.strokeStyle = "rgba(99, 102, 241, 0.5)";
          ctx.stroke();
          ctx.fillStyle = "rgba(255,255,255,0.9)";
          ctx.font = "bold 9px Inter, sans-serif";
          ctx.fillText(opt.label, ox, d.y + 40);
        }
      }

      // Obstacles
      for (const o of obstaclesRef.current) {
        ctx.fillStyle = "rgba(239, 68, 68, 0.3)";
        ctx.beginPath();
        ctx.roundRect(o.x - 20, o.y - OBSTACLE_H / 2, 40, OBSTACLE_H, 4);
        ctx.fill();
        ctx.strokeStyle = "rgba(239, 68, 68, 0.7)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = "rgba(239,68,68,0.9)";
        ctx.font = "bold 8px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("BUG", o.x, o.y + 3);
      }

      // Fuel/power-ups
      for (const f of fuelsRef.current) {
        const colors = { fuel: "52, 211, 153", shield: "99, 102, 241", turbo: "250, 204, 21" };
        const c = colors[f.type];
        ctx.fillStyle = `rgba(${c}, 0.3)`;
        ctx.beginPath();
        ctx.arc(f.x, f.y, FUEL_SIZE, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(${c}, 0.7)`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = `rgba(${c}, 1)`;
        ctx.font = "bold 7px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(f.label, f.x, f.y + 3);
      }

      // Drone
      ctx.fillStyle = st.shield ? "rgba(99, 102, 241, 0.9)" : "hsl(45, 90%, 55%)";
      ctx.beginPath();
      ctx.moveTo(droneX, droneY - DRONE_SIZE / 2);
      ctx.lineTo(droneX - DRONE_SIZE / 2, droneY + DRONE_SIZE / 2);
      ctx.lineTo(droneX + DRONE_SIZE / 2, droneY + DRONE_SIZE / 2);
      ctx.closePath();
      ctx.fill();
      if (st.shield) {
        ctx.strokeStyle = "rgba(99, 102, 241, 0.4)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(droneX, droneY, DRONE_SIZE, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Engine glow
      ctx.fillStyle = `rgba(250, 204, 21, ${0.3 + Math.random() * 0.3})`;
      ctx.beginPath();
      ctx.arc(droneX, droneY + DRONE_SIZE / 2 + 4, 4 + Math.random() * 3, 0, Math.PI * 2);
      ctx.fill();

      // HUD on canvas
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "bold 10px Inter, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`${Math.floor(st.dist)}m`, 10, 18);
      ctx.textAlign = "right";
      ctx.fillText(`${Math.floor(st.speed * 10)} km/h`, W - 10, 18);

      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameRef.current);
  }, [gameState, endGame]);

  // Controls
  const switchLane = useCallback((dir: "left" | "right") => {
    if (gameRef.current !== "playing") return;
    const st = stateRef.current;
    if (dir === "left" && st.lane > 0) st.lane--;
    if (dir === "right" && st.lane < LANE_COUNT - 1) st.lane++;
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") { e.preventDefault(); switchLane("left"); }
      if (e.key === "ArrowRight" || e.key === "d") { e.preventDefault(); switchLane("right"); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [switchLane]);

  const touchRef = useRef<number | null>(null);
  const onTouchStart = useCallback((e: React.TouchEvent) => { touchRef.current = e.touches[0].clientX; }, []);
  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchRef.current === null) return;
    const dx = e.changedTouches[0].clientX - touchRef.current;
    if (Math.abs(dx) > 20) switchLane(dx > 0 ? "right" : "left");
    touchRef.current = null;
  }, [switchLane]);

  return (
    <div className="min-h-screen pb-24 flex flex-col">
      <div className="px-5 pt-6 pb-3 flex items-center gap-3">
        <Link to="/games" className="p-2 rounded-xl bg-card/60 border border-border/50"><ArrowLeft className="h-4 w-4 text-muted-foreground" /></Link>
        <div className="flex-1">
          <h1 className="font-display text-lg font-bold text-foreground">✈️ Insight Pilot</h1>
          <p className="text-[11px] text-muted-foreground">Logic Labyrinth</p>
        </div>
        {gameState === "playing" && (
          <div className="flex items-center gap-3">
            {stateRef.current.shield && <Shield className="h-4 w-4 text-indigo-400 animate-pulse" />}
            <span className="text-sm font-bold text-foreground tabular-nums">{score}</span>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {gameState === "menu" && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-5">
            <div className="text-7xl mb-2">✈️</div>
            <h2 className="font-display text-2xl font-black text-foreground">Insight Pilot</h2>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
              Pilot your AI drone through the data highway. <span className="text-sky-400 font-semibold">Dodge bugs</span>, collect <span className="text-emerald-400 font-semibold">power-ups</span>, and make <span className="text-indigo-400 font-semibold">strategic decisions</span> at every fork.
            </p>
            <Button onClick={startGame} size="lg" className="gap-2 text-base font-bold"><Play className="h-5 w-5" /> PLAY</Button>
          </motion.div>
        )}

        {gameState === "playing" && (
          <div className="relative">
            {activeDecision && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-3 py-1 whitespace-nowrap z-10">
                ⚡ Decision Fork Ahead!
              </motion.div>
            )}
            <canvas ref={canvasRef} width={W} height={H} className="rounded-2xl border border-border/40" style={{ maxWidth: "100%", height: "auto" }} />
            <div className="mt-3 flex gap-2 justify-center md:hidden">
              <button onClick={() => switchLane("left")} className="flex-1 h-12 rounded-xl bg-card/80 border border-border/40 text-muted-foreground text-lg font-bold active:bg-primary/20">← LEFT</button>
              <button onClick={() => switchLane("right")} className="flex-1 h-12 rounded-xl bg-card/80 border border-border/40 text-muted-foreground text-lg font-bold active:bg-primary/20">RIGHT →</button>
            </div>
          </div>
        )}

        {gameState === "over" && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4">
            <Trophy className="h-14 w-14 text-accent-gold mx-auto" />
            <h2 className="font-display text-2xl font-black text-foreground">Flight Over</h2>
            <p className="text-4xl font-black text-foreground tabular-nums">{score}</p>
            <p className="text-sm text-muted-foreground">{distance}m traveled</p>
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
