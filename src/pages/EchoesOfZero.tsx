import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Play, RotateCcw, Trophy, Eye, EyeOff, Package, Heart, Skull } from "lucide-react";
import { Button } from "@/components/ui/button";
import { recordGameResult, AI_CONCEPTS, shuffleArray } from "@/lib/arcade-engine";

const W = 380;
const H = 600;
const TILE = 32;
const COLS = Math.floor(W / TILE);
const ROWS = Math.floor(H / TILE);
const FOG_RADIUS = 3.5;
const GLITCH_SPEED = 0.012;
const PLAYER_MOVE_CD = 120;

interface Pos { x: number; y: number }
interface Loot { pos: Pos; type: "shard" | "medkit" | "boost"; value: number; label: string }

function dist(a: Pos, b: Pos) { return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2); }

function generateMap(): boolean[][] {
  const map: boolean[][] = [];
  for (let r = 0; r < ROWS; r++) {
    map[r] = [];
    for (let c = 0; c < COLS; c++) {
      // Border walls
      if (r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1) { map[r][c] = true; continue; }
      // Random walls ~22%
      map[r][c] = Math.random() < 0.22;
    }
  }
  // Ensure start/exit clear
  map[1][1] = false; map[2][1] = false; map[1][2] = false;
  map[ROWS - 2][COLS - 2] = false; map[ROWS - 3][COLS - 2] = false; map[ROWS - 2][COLS - 3] = false;
  return map;
}

function spawnLoot(map: boolean[][]): Loot[] {
  const concepts = shuffleArray(AI_CONCEPTS).slice(0, 8);
  const loot: Loot[] = [];
  const used = new Set<string>();
  for (let i = 0; i < 12; i++) {
    let tries = 0;
    while (tries < 100) {
      const x = 2 + Math.floor(Math.random() * (COLS - 4));
      const y = 2 + Math.floor(Math.random() * (ROWS - 4));
      const key = `${x},${y}`;
      if (!map[y][x] && !used.has(key) && !(x <= 2 && y <= 2)) {
        used.add(key);
        if (i < 6) {
          const c = concepts[i % concepts.length];
          loot.push({ pos: { x, y }, type: "shard", value: 15 + Math.floor(Math.random() * 20), label: c.term });
        } else if (i < 9) {
          loot.push({ pos: { x, y }, type: "medkit", value: 1, label: "❤️" });
        } else {
          loot.push({ pos: { x, y }, type: "boost", value: 1, label: "⚡" });
        }
        break;
      }
      tries++;
    }
  }
  return loot;
}

function spawnGlitch(map: boolean[][]): Pos {
  for (let i = 0; i < 200; i++) {
    const x = Math.floor(COLS / 2) + Math.floor(Math.random() * 6 - 3);
    const y = Math.floor(ROWS / 2) + Math.floor(Math.random() * 6 - 3);
    if (!map[y]?.[x]) return { x, y };
  }
  return { x: COLS - 3, y: ROWS - 3 };
}

export default function EchoesOfZero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<"menu" | "playing" | "extracted" | "dead">("menu");
  const stateRef = useRef<any>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const lastMoveRef = useRef(0);

  const startGame = useCallback(() => {
    const map = generateMap();
    const loot = spawnLoot(map);
    const glitchPos = spawnGlitch(map);
    stateRef.current = {
      map,
      player: { x: 1, y: 1 } as Pos,
      glitch: { x: glitchPos.x, y: glitchPos.y, fx: glitchPos.x, fy: glitchPos.y },
      loot,
      hp: 3,
      score: 0,
      shards: 0,
      boosted: 0,
      extractZone: { x: COLS - 2, y: ROWS - 2 },
      glitchAlerted: false,
      tick: 0,
      flashMsg: "",
      flashTimer: 0,
    };
    setGameState("playing");
  }, []);

  // Keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => keysRef.current.add(e.key.toLowerCase());
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  // Touch controls
  const handleTouch = useCallback((dir: string) => {
    keysRef.current.add(dir);
    setTimeout(() => keysRef.current.delete(dir), 160);
  }, []);

  // Game loop
  useEffect(() => {
    if (gameState !== "playing") return;
    let raf: number;
    let lastTime = 0;

    const loop = (time: number) => {
      const dt = time - lastTime;
      lastTime = time;
      const s = stateRef.current;
      if (!s) { raf = requestAnimationFrame(loop); return; }

      s.tick++;
      if (s.flashTimer > 0) s.flashTimer--;

      // Player movement
      const now = performance.now();
      const moveCd = s.boosted > 0 ? PLAYER_MOVE_CD * 0.6 : PLAYER_MOVE_CD;
      if (now - lastMoveRef.current > moveCd) {
        let dx = 0, dy = 0;
        const k = keysRef.current;
        if (k.has("arrowup") || k.has("w")) dy = -1;
        if (k.has("arrowdown") || k.has("s")) dy = 1;
        if (k.has("arrowleft") || k.has("a")) dx = -1;
        if (k.has("arrowright") || k.has("d")) dx = 1;

        if (dx !== 0 || dy !== 0) {
          const nx = s.player.x + dx;
          const ny = s.player.y + dy;
          if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && !s.map[ny][nx]) {
            s.player.x = nx;
            s.player.y = ny;
            lastMoveRef.current = now;
          }
        }
      }

      if (s.boosted > 0) s.boosted--;

      // Pick up loot
      s.loot = s.loot.filter((l: Loot) => {
        if (l.pos.x === s.player.x && l.pos.y === s.player.y) {
          if (l.type === "shard") { s.score += l.value; s.shards++; s.flashMsg = `+${l.value} ${l.label}`; s.flashTimer = 40; }
          if (l.type === "medkit") { s.hp = Math.min(s.hp + 1, 5); s.flashMsg = "+1 HP"; s.flashTimer = 30; }
          if (l.type === "boost") { s.boosted = 180; s.flashMsg = "SPEED BOOST!"; s.flashTimer = 40; }
          return false;
        }
        return true;
      });

      // Check extraction
      if (s.player.x === s.extractZone.x && s.player.y === s.extractZone.y && s.shards >= 3) {
        const r = recordGameResult("echoes-of-zero", s.score, s.shards);
        stateRef.current = { ...s, result: { score: s.score, shards: s.shards, xp: r.xpEarned, tokens: r.tokensEarned } };
        setGameState("extracted");
        return;
      }

      // Glitch Entity AI — pursue player with pathfinding-lite
      const g = s.glitch;
      const gdx = s.player.x - g.x;
      const gdy = s.player.y - g.y;
      const gDist = Math.sqrt(gdx * gdx + gdy * gdy);
      const speed = gDist < 5 ? GLITCH_SPEED * 2.5 : GLITCH_SPEED * (1 + s.tick * 0.00005);

      // Move towards player, avoid walls
      if (gDist > 0.5) {
        const ndx = gdx / gDist;
        const ndy = gdy / gDist;
        let nfx = g.fx + ndx * speed * dt;
        let nfy = g.fy + ndy * speed * dt;
        const testX = Math.round(nfx);
        const testY = Math.round(nfy);
        if (testX >= 0 && testX < COLS && testY >= 0 && testY < ROWS && !s.map[testY][testX]) {
          g.fx = nfx;
          g.fy = nfy;
          g.x = testX;
          g.y = testY;
        } else {
          // Try perpendicular
          g.fx += ndy * speed * dt * 0.7;
          g.fy += -ndx * speed * dt * 0.7;
          g.x = Math.round(g.fx);
          g.y = Math.round(g.fy);
        }
      }

      // Check collision with Glitch
      if (Math.abs(s.player.x - g.x) <= 0.6 && Math.abs(s.player.y - g.y) <= 0.6) {
        s.hp--;
        s.flashMsg = "GLITCH HIT! -1 HP";
        s.flashTimer = 50;
        // Teleport glitch away
        g.fx = Math.max(1, Math.min(COLS - 2, s.player.x + (Math.random() > 0.5 ? 5 : -5)));
        g.fy = Math.max(1, Math.min(ROWS - 2, s.player.y + (Math.random() > 0.5 ? 5 : -5)));
        g.x = Math.round(g.fx);
        g.y = Math.round(g.fy);
        if (s.hp <= 0) {
          const r = recordGameResult("echoes-of-zero", Math.floor(s.score * 0.3), s.shards);
          stateRef.current = { ...s, result: { score: Math.floor(s.score * 0.3), shards: s.shards, xp: r.xpEarned, tokens: r.tokensEarned } };
          setGameState("dead");
          return;
        }
      }

      // Render
      const canvas = canvasRef.current;
      if (!canvas) { raf = requestAnimationFrame(loop); return; }
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#0a0a0f";
      ctx.fillRect(0, 0, W, H);

      // Draw tiles
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const d = dist(s.player, { x: c, y: r });
          if (d > FOG_RADIUS + 1.5) continue; // fog of war
          const alpha = d > FOG_RADIUS ? Math.max(0, 1 - (d - FOG_RADIUS) / 1.5) : 1;
          if (s.map[r][c]) {
            ctx.fillStyle = `rgba(40, 30, 60, ${alpha})`;
            ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
            ctx.strokeStyle = `rgba(80, 60, 120, ${alpha * 0.5})`;
            ctx.strokeRect(c * TILE, r * TILE, TILE, TILE);
          } else {
            ctx.fillStyle = `rgba(15, 15, 25, ${alpha})`;
            ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
            ctx.strokeStyle = `rgba(30, 25, 50, ${alpha * 0.3})`;
            ctx.strokeRect(c * TILE, r * TILE, TILE, TILE);
          }
        }
      }

      // Extraction zone
      const ez = s.extractZone;
      const ezD = dist(s.player, ez);
      if (ezD < FOG_RADIUS + 1.5) {
        const ezA = ezD > FOG_RADIUS ? Math.max(0, 1 - (ezD - FOG_RADIUS) / 1.5) : 1;
        const pulse = 0.4 + Math.sin(s.tick * 0.05) * 0.2;
        ctx.fillStyle = s.shards >= 3 ? `rgba(50, 220, 120, ${ezA * pulse})` : `rgba(220, 50, 50, ${ezA * 0.2})`;
        ctx.fillRect(ez.x * TILE, ez.y * TILE, TILE, TILE);
        ctx.font = "10px monospace";
        ctx.fillStyle = `rgba(200, 255, 200, ${ezA})`;
        ctx.fillText("EXIT", ez.x * TILE + 2, ez.y * TILE + 20);
      }

      // Draw loot
      s.loot.forEach((l: Loot) => {
        const ld = dist(s.player, l.pos);
        if (ld > FOG_RADIUS + 1) return;
        const la = ld > FOG_RADIUS ? Math.max(0, 1 - (ld - FOG_RADIUS) / 1) : 1;
        const glow = 0.6 + Math.sin(s.tick * 0.08 + l.pos.x) * 0.3;
        if (l.type === "shard") {
          ctx.fillStyle = `rgba(160, 120, 255, ${la * glow})`;
          ctx.beginPath();
          ctx.arc(l.pos.x * TILE + TILE / 2, l.pos.y * TILE + TILE / 2, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = `rgba(255, 255, 255, ${la * 0.7})`;
          ctx.font = "7px monospace";
          ctx.fillText(l.label, l.pos.x * TILE + 2, l.pos.y * TILE + 10);
        } else if (l.type === "medkit") {
          ctx.fillStyle = `rgba(255, 80, 80, ${la * glow})`;
          ctx.fillRect(l.pos.x * TILE + 8, l.pos.y * TILE + 8, 16, 16);
          ctx.font = "14px sans-serif";
          ctx.fillText("❤️", l.pos.x * TILE + 6, l.pos.y * TILE + 24);
        } else {
          ctx.fillStyle = `rgba(255, 220, 50, ${la * glow})`;
          ctx.fillRect(l.pos.x * TILE + 8, l.pos.y * TILE + 8, 16, 16);
          ctx.font = "14px sans-serif";
          ctx.fillText("⚡", l.pos.x * TILE + 6, l.pos.y * TILE + 24);
        }
      });

      // Draw Glitch Entity
      const glitchD = dist(s.player, { x: g.x, y: g.y });
      if (glitchD < FOG_RADIUS + 2) {
        const ga = glitchD > FOG_RADIUS ? Math.max(0, 1 - (glitchD - FOG_RADIUS) / 2) : 1;
        // Glitchy appearance
        ctx.save();
        for (let i = 0; i < 5; i++) {
          const ox = (Math.random() - 0.5) * 6;
          const oy = (Math.random() - 0.5) * 6;
          ctx.fillStyle = `rgba(255, 0, 80, ${ga * (0.3 + Math.random() * 0.4)})`;
          ctx.fillRect(g.fx * TILE + 4 + ox, g.fy * TILE + 4 + oy, TILE - 8, TILE - 8);
        }
        ctx.fillStyle = `rgba(255, 0, 0, ${ga})`;
        ctx.font = "18px sans-serif";
        ctx.fillText("👁", g.fx * TILE + 4, g.fy * TILE + 24);
        ctx.restore();
      }

      // Draw player
      ctx.fillStyle = s.boosted > 0 ? "#fbbf24" : "#60a5fa";
      ctx.beginPath();
      ctx.arc(s.player.x * TILE + TILE / 2, s.player.y * TILE + TILE / 2, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "12px sans-serif";
      ctx.fillText("🛡", s.player.x * TILE + 6, s.player.y * TILE + 24);

      // HUD overlay
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(0, 0, W, 32);
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText(`HP: ${"❤️".repeat(s.hp)}${"🖤".repeat(Math.max(0, 5 - s.hp))}`, 8, 20);
      ctx.fillText(`Shards: ${s.shards}/3`, 180, 20);
      ctx.fillText(`Score: ${s.score}`, W - 80, 20);

      // Flash message
      if (s.flashTimer > 0) {
        ctx.fillStyle = `rgba(255,255,255,${Math.min(1, s.flashTimer / 20)})`;
        ctx.font = "bold 14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(s.flashMsg, W / 2, H / 2 - 40);
        ctx.textAlign = "left";
      }

      // Extraction hint
      if (s.shards >= 3) {
        const pulse = 0.5 + Math.sin(s.tick * 0.1) * 0.5;
        ctx.fillStyle = `rgba(50, 255, 120, ${pulse})`;
        ctx.font = "bold 12px monospace";
        ctx.textAlign = "center";
        ctx.fillText("▶ EXTRACT NOW — reach the EXIT!", W / 2, H - 16);
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
            <h1 className="text-lg font-black text-foreground">Echoes of Zero</h1>
            <p className="text-[10px] text-muted-foreground">Survival Extraction • Collect 3 shards & extract</p>
          </div>
        </div>

        {gameState === "playing" && (
          <>
            <canvas ref={canvasRef} width={W} height={H} className="rounded-xl border border-border/30 mx-auto block" style={{ touchAction: "none" }} />
            {/* Mobile D-pad */}
            <div className="mt-3 flex justify-center">
              <div className="grid grid-cols-3 gap-1 w-32">
                <div />
                <button onTouchStart={() => handleTouch("arrowup")} onClick={() => handleTouch("arrowup")} className="h-10 rounded-lg bg-card/60 border border-border/30 flex items-center justify-center text-muted-foreground font-bold active:bg-primary/20">↑</button>
                <div />
                <button onTouchStart={() => handleTouch("arrowleft")} onClick={() => handleTouch("arrowleft")} className="h-10 rounded-lg bg-card/60 border border-border/30 flex items-center justify-center text-muted-foreground font-bold active:bg-primary/20">←</button>
                <button onTouchStart={() => handleTouch("arrowdown")} onClick={() => handleTouch("arrowdown")} className="h-10 rounded-lg bg-card/60 border border-border/30 flex items-center justify-center text-muted-foreground font-bold active:bg-primary/20">↓</button>
                <button onTouchStart={() => handleTouch("arrowright")} onClick={() => handleTouch("arrowright")} className="h-10 rounded-lg bg-card/60 border border-border/30 flex items-center justify-center text-muted-foreground font-bold active:bg-primary/20">→</button>
              </div>
            </div>
          </>
        )}

        {gameState === "menu" && (
          <div className="flex flex-col items-center justify-center gap-4 p-8 mt-8">
            <div className="text-5xl">👁</div>
            <h2 className="text-2xl font-black text-foreground text-center">ECHOES OF ZERO</h2>
            <p className="text-xs text-muted-foreground text-center max-w-[280px]">
              Navigate a dark megastructure. Scavenge corrupted data shards while a reality-warping Glitch Entity hunts you. Collect 3+ shards and reach the extraction zone to survive.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20 font-bold">Survival</span>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold">Extraction</span>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground border border-border/30 font-bold">Horror</span>
            </div>
            <Button onClick={startGame} className="gap-2 font-bold"><Play className="h-4 w-4" /> ENTER THE VOID</Button>
          </div>
        )}

        {(gameState === "extracted" || gameState === "dead") && s?.result && (
          <div className="flex flex-col items-center justify-center gap-3 p-8 mt-8">
            {gameState === "extracted" ? <Trophy className="h-10 w-10 text-accent-gold" /> : <Skull className="h-10 w-10 text-destructive" />}
            <h2 className="text-xl font-black text-foreground">{gameState === "extracted" ? "EXTRACTED!" : "CONSUMED BY GLITCH"}</h2>
            <p className="text-xs text-muted-foreground">{gameState === "extracted" ? "You escaped with your data intact." : "The void claims all. Your salvage is mostly lost."}</p>
            <div className="grid grid-cols-2 gap-3 w-full max-w-[240px]">
              <div className="text-center p-2 rounded-lg bg-card/50 border border-border/30">
                <p className="text-lg font-black text-foreground">{s.result.score}</p>
                <p className="text-[9px] text-muted-foreground">SCORE</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-card/50 border border-border/30">
                <p className="text-lg font-black text-foreground">{s.result.shards}</p>
                <p className="text-[9px] text-muted-foreground">SHARDS</p>
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
              <Button onClick={startGame} className="gap-2 font-bold"><RotateCcw className="h-4 w-4" /> RAID AGAIN</Button>
              <Link to="/games"><Button variant="outline">ARCADE</Button></Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
