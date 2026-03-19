import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Play, RotateCcw, Trophy, Building2, Users, Zap, Shield, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { recordGameResult } from "@/lib/arcade-engine";

const W = 360;
const H = 560;
const GRID = 6;
const CELL = 50;
const GRID_OX = (W - GRID * CELL) / 2;
const GRID_OY = 120;

type CellType = "empty" | "power" | "data" | "defense" | "housing" | "factory";
type Faction = "monarchs" | "enforcers" | "syndicates";

interface GridCell { type: CellType; level: number; faction: Faction | null; hp: number; producing: number }
interface Event { id: number; text: string; timer: number; type: "threat" | "bonus" | "info" }

const BUILDINGS: Record<Exclude<CellType, "empty">, { icon: string; label: string; cost: number; income: number; color: string }> = {
  power: { icon: "⚡", label: "Power Node", cost: 10, income: 2, color: "#fbbf24" },
  data: { icon: "📡", label: "Data Hub", cost: 15, income: 4, color: "#60a5fa" },
  defense: { icon: "🛡️", label: "Firewall", cost: 20, income: 0, color: "#a78bfa" },
  housing: { icon: "🏠", label: "AI Housing", cost: 8, income: 1, color: "#34d399" },
  factory: { icon: "🏭", label: "Factory", cost: 25, income: 6, color: "#f87171" },
};

const THREATS = [
  "Data Breach detected! Firewalls absorb damage.",
  "Market crash! Income halved this cycle.",
  "Virus outbreak! Undefended cells lose HP.",
  "Power surge! All Power Nodes generate 2x.",
  "AI Evolution! Random building upgrades.",
];

export default function NeuralNexus() {
  const [gameState, setGameState] = useState<"menu" | "playing" | "over">("menu");
  const [grid, setGrid] = useState<GridCell[][]>([]);
  const [credits, setCredits] = useState(50);
  const [turn, setTurn] = useState(1);
  const [influence, setInfluence] = useState(0);
  const [selectedBuild, setSelectedBuild] = useState<Exclude<CellType, "empty">>("power");
  const [events, setEvents] = useState<Event[]>([]);
  const [eventId, setEventId] = useState(0);
  const [result, setResult] = useState<{ score: number; turns: number; xp: number; tokens: number } | null>(null);

  const initGrid = (): GridCell[][] =>
    Array.from({ length: GRID }, () => Array.from({ length: GRID }, () => ({ type: "empty" as CellType, level: 0, faction: null, hp: 0, producing: 0 })));

  const startGame = useCallback(() => {
    setGrid(initGrid());
    setCredits(50);
    setTurn(1);
    setInfluence(0);
    setEvents([]);
    setEventId(0);
    setGameState("playing");
  }, []);

  const calculateScore = (g: GridCell[][], inf: number) => {
    let s = inf;
    g.forEach(row => row.forEach(c => { if (c.type !== "empty") s += c.level * 10 + 5; }));
    return s;
  };

  const endGame = useCallback((g: GridCell[][], inf: number, t: number) => {
    const score = calculateScore(g, inf);
    const r = recordGameResult("neural-nexus", score, t);
    setResult({ score, turns: t, xp: r.xpEarned, tokens: r.tokensEarned });
    setGameState("over");
  }, []);

  const placeBuilding = (row: number, col: number) => {
    if (gameState !== "playing") return;
    const cell = grid[row][col];
    const bld = BUILDINGS[selectedBuild];

    if (cell.type !== "empty") {
      // Upgrade
      if (cell.type === selectedBuild && credits >= bld.cost * (cell.level + 1)) {
        const newGrid = grid.map(r => r.map(c => ({ ...c })));
        newGrid[row][col].level++;
        newGrid[row][col].hp += 2;
        setCredits(prev => prev - bld.cost * newGrid[row][col].level);
        setGrid(newGrid);
      }
      return;
    }

    if (credits < bld.cost) return;

    const newGrid = grid.map(r => r.map(c => ({ ...c })));
    newGrid[row][col] = { type: selectedBuild, level: 1, faction: "monarchs", hp: 3, producing: 0 };
    setCredits(prev => prev - bld.cost);
    setGrid(newGrid);
  };

  const endTurn = () => {
    let income = 0;
    const newGrid = grid.map(r => r.map(c => ({ ...c })));

    // Calculate income
    newGrid.forEach(row => row.forEach(c => {
      if (c.type !== "empty" && c.type !== "defense") {
        const bld = BUILDINGS[c.type];
        const inc = bld.income * c.level;
        income += inc;
        c.producing = inc;
      }
    }));

    // Random event every 3 turns
    if (turn % 3 === 0) {
      const threatText = THREATS[Math.floor(Math.random() * THREATS.length)];
      const isThreat = Math.random() > 0.4;

      if (isThreat && threatText.includes("Virus")) {
        // Damage undefended cells
        const hasDefense = newGrid.flat().some(c => c.type === "defense");
        if (!hasDefense) {
          newGrid.forEach(row => row.forEach(c => { if (c.type !== "empty") c.hp--; }));
        }
      }
      if (isThreat && threatText.includes("Market")) {
        income = Math.floor(income / 2);
      }
      if (threatText.includes("Power surge")) {
        newGrid.forEach(row => row.forEach(c => { if (c.type === "power") income += BUILDINGS.power.income * c.level; }));
      }
      if (threatText.includes("Evolution")) {
        const cells = newGrid.flat().filter(c => c.type !== "empty");
        if (cells.length > 0) {
          const lucky = cells[Math.floor(Math.random() * cells.length)];
          lucky.level++;
        }
      }

      setEventId(prev => {
        const newId = prev + 1;
        setEvents(evts => [...evts.slice(-4), { id: newId, text: threatText, timer: 60, type: isThreat ? "threat" : "bonus" }]);
        return newId;
      });
    }

    // Remove destroyed buildings
    newGrid.forEach((row, r) => row.forEach((c, col) => {
      if (c.type !== "empty" && c.hp <= 0) {
        newGrid[r][col] = { type: "empty", level: 0, faction: null, hp: 0, producing: 0 };
      }
    }));

    const newInfluence = influence + income;
    const newTurn = turn + 1;

    setGrid(newGrid);
    setCredits(prev => prev + income);
    setInfluence(newInfluence);
    setTurn(newTurn);

    // Game ends at turn 30
    if (newTurn > 30) {
      endGame(newGrid, newInfluence, 30);
    }
  };

  const totalBuildings = grid.flat().filter(c => c.type !== "empty").length;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center pb-24">
      <div className="w-full max-w-md px-4 pt-4">
        <div className="flex items-center gap-3 mb-3">
          <Link to="/games"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
          <div>
            <h1 className="text-lg font-black text-foreground">Neural Nexus</h1>
            <p className="text-[10px] text-muted-foreground">Grand Strategy • Turn {turn}/30</p>
          </div>
        </div>

        {gameState === "playing" && (
          <>
            {/* Resource bar */}
            <div className="flex items-center justify-between mb-3 px-1 gap-2">
              <div className="flex items-center gap-1 text-xs font-bold text-accent-gold">
                <Coins className="h-3 w-3" /> {credits}
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-primary">
                <Zap className="h-3 w-3" /> {influence} influence
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Building2 className="h-3 w-3" /> {totalBuildings}
              </div>
            </div>

            {/* Events */}
            {events.slice(-2).map(ev => (
              <div key={ev.id} className={`text-[10px] px-3 py-1.5 rounded-lg mb-2 border ${ev.type === "threat" ? "bg-destructive/10 border-destructive/20 text-destructive" : "bg-accent-gold/10 border-accent-gold/20 text-accent-gold"}`}>
                {ev.text}
              </div>
            ))}

            {/* Build selector */}
            <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1 scrollbar-hide">
              {(Object.entries(BUILDINGS) as [Exclude<CellType, "empty">, typeof BUILDINGS.power][]).map(([key, bld]) => (
                <button
                  key={key}
                  onClick={() => setSelectedBuild(key)}
                  className={`shrink-0 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                    selectedBuild === key
                      ? "bg-primary/20 border-primary/40 text-primary"
                      : "bg-card/40 border-border/30 text-muted-foreground"
                  }`}
                >
                  {bld.icon} {bld.label} ({bld.cost}c)
                </button>
              ))}
            </div>

            {/* Grid */}
            <div className="mx-auto rounded-xl border border-border/30 bg-card/20 p-2" style={{ width: GRID * CELL + 16 }}>
              <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${GRID}, 1fr)` }}>
                {grid.map((row, r) => row.map((cell, c) => {
                  const bld = cell.type !== "empty" ? BUILDINGS[cell.type] : null;
                  return (
                    <button
                      key={`${r}-${c}`}
                      onClick={() => placeBuilding(r, c)}
                      className={`w-[46px] h-[46px] rounded-lg border flex flex-col items-center justify-center text-center transition-all ${
                        cell.type === "empty"
                          ? "bg-muted/20 border-border/20 hover:bg-muted/40 hover:border-primary/20"
                          : "border-border/40"
                      }`}
                      style={bld ? { backgroundColor: bld.color + "15", borderColor: bld.color + "40" } : {}}
                    >
                      {bld ? (
                        <>
                          <span className="text-lg leading-none">{bld.icon}</span>
                          <span className="text-[8px] font-bold text-muted-foreground">L{cell.level}</span>
                        </>
                      ) : (
                        <span className="text-[8px] text-muted-foreground/40">+</span>
                      )}
                    </button>
                  );
                }))}
              </div>
            </div>

            <Button onClick={endTurn} className="w-full mt-3 font-bold gap-2">
              END TURN <span className="text-xs opacity-70">(Turn {turn}/30)</span>
            </Button>
          </>
        )}

        {gameState === "menu" && (
          <div className="flex flex-col items-center justify-center gap-4 p-8 mt-8">
            <div className="text-5xl">🏙️</div>
            <h2 className="text-2xl font-black text-foreground text-center">NEURAL NEXUS</h2>
            <p className="text-xs text-muted-foreground text-center max-w-[280px]">
              Build and defend an AI-Powered Megalopolis. Place buildings, earn credits, survive threats, and maximize your influence across 30 turns.
            </p>
            <Button onClick={startGame} className="gap-2 font-bold"><Play className="h-4 w-4" /> BUILD</Button>
          </div>
        )}

        {gameState === "over" && result && (
          <div className="flex flex-col items-center justify-center gap-3 p-8 mt-8">
            <Trophy className="h-10 w-10 text-accent-gold" />
            <h2 className="text-xl font-black text-foreground">CITY COMPLETE</h2>
            <div className="grid grid-cols-2 gap-3 w-full max-w-[240px]">
              <div className="text-center p-2 rounded-lg bg-card/50 border border-border/30">
                <p className="text-lg font-black text-foreground">{result.score.toLocaleString()}</p>
                <p className="text-[9px] text-muted-foreground">INFLUENCE</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-card/50 border border-border/30">
                <p className="text-lg font-black text-foreground">{result.turns}</p>
                <p className="text-[9px] text-muted-foreground">TURNS</p>
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
              <Button onClick={startGame} className="gap-2 font-bold"><RotateCcw className="h-4 w-4" /> REPLAY</Button>
              <Link to="/games"><Button variant="outline">ARCADE</Button></Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
