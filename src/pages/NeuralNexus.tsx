import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Play, RotateCcw, Trophy, Building2, Zap, Shield, Coins, Users, Sword, Lightbulb, Factory, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { recordGameResult } from "@/lib/arcade-engine";

const GRID = 7;
const CELL = 44;

type CellType = "empty" | "power" | "data" | "defense" | "housing" | "factory" | "lab" | "market" | "comm";
type Specialization = "engineer" | "trader" | "politician" | "warrior";

interface GridCell { type: CellType; level: number; hp: number }
interface GameEvent { id: number; text: string; type: "threat" | "bonus" | "faction" | "crisis" }

const BUILDINGS: Record<Exclude<CellType, "empty">, { icon: string; label: string; cost: number; income: number; influence: number; color: string; desc: string }> = {
  power:   { icon: "⚡", label: "Power Node",  cost: 8,  income: 2,  influence: 0, color: "#fbbf24", desc: "+2 credits/turn" },
  data:    { icon: "📡", label: "Data Hub",    cost: 14, income: 4,  influence: 2, color: "#60a5fa", desc: "+4 credits, +2 influence" },
  defense: { icon: "🛡️", label: "Firewall",    cost: 18, income: 0,  influence: 1, color: "#a78bfa", desc: "Protects from threats" },
  housing: { icon: "🏠", label: "AI Housing",  cost: 6,  income: 1,  influence: 1, color: "#34d399", desc: "+1 each" },
  factory: { icon: "🏭", label: "Factory",     cost: 22, income: 7,  influence: 0, color: "#f87171", desc: "+7 credits/turn" },
  lab:     { icon: "🔬", label: "Research Lab", cost: 20, income: 2,  influence: 4, color: "#c084fc", desc: "+2 credits, +4 influence" },
  market:  { icon: "🏪", label: "Market",      cost: 16, income: 5,  influence: 1, color: "#fb923c", desc: "+5 credits, +1 influence" },
  comm:    { icon: "📻", label: "Comm Tower",   cost: 12, income: 1,  influence: 3, color: "#38bdf8", desc: "+1 credit, +3 influence" },
};

const EVENTS: { text: string; type: GameEvent["type"]; effect: (s: any) => string }[] = [
  { text: "🦠 Virus Outbreak!", type: "threat", effect: (s) => {
    const hasDefense = s.grid.flat().some((c: GridCell) => c.type === "defense");
    if (!hasDefense) { s.grid.forEach((row: GridCell[]) => row.forEach(c => { if (c.type !== "empty") c.hp--; })); return "Undefended cells damaged!"; }
    return "Firewalls absorbed the attack!";
  }},
  { text: "📉 Market Crash!", type: "crisis", effect: (s) => { s.credits = Math.max(0, s.credits - 15); return "-15 credits!"; }},
  { text: "⚡ Power Surge!", type: "bonus", effect: (s) => {
    let bonus = 0;
    s.grid.forEach((row: GridCell[]) => row.forEach(c => { if (c.type === "power") { bonus += 5 * c.level; } }));
    s.credits += bonus; return bonus > 0 ? `+${bonus} credits from Power Nodes!` : "No Power Nodes to benefit.";
  }},
  { text: "🧬 AI Evolution!", type: "bonus", effect: (s) => {
    const cells = s.grid.flat().filter((c: GridCell) => c.type !== "empty");
    if (cells.length > 0) { const c = cells[Math.floor(Math.random() * cells.length)]; c.level++; c.hp++; return `A building evolved to level ${c.level}!`; }
    return "Nothing to evolve.";
  }},
  { text: "🔥 Data Breach!", type: "threat", effect: (s) => {
    const targets = s.grid.flat().filter((c: GridCell) => c.type === "data" || c.type === "comm");
    targets.forEach((t: GridCell) => { t.hp -= 2; });
    return targets.length > 0 ? "Data Hubs & Comm Towers took damage!" : "No data infrastructure targeted.";
  }},
  { text: "🎁 Benefactor Grant!", type: "bonus", effect: (s) => { s.credits += 25; return "+25 credits!"; }},
  { text: "🏛️ Faction Demand!", type: "faction", effect: (s) => {
    const labCount = s.grid.flat().filter((c: GridCell) => c.type === "lab").length;
    if (labCount >= 1) { s.influence += 10; return "+10 influence for your Research Labs!"; }
    s.influence -= 5; return "-5 influence — no Research Labs to satisfy demands!";
  }},
  { text: "🌪️ System Instability!", type: "crisis", effect: (s) => {
    const cell = s.grid.flat().filter((c: GridCell) => c.type !== "empty" && c.type !== "defense");
    if (cell.length > 0) { const target = cell[Math.floor(Math.random() * cell.length)]; target.hp -= 2; return `A ${BUILDINGS[target.type as keyof typeof BUILDINGS]?.label} took critical damage!`; }
    return "Nothing affected.";
  }},
];

const SPECIALIZATIONS: Record<Specialization, { icon: string; label: string; desc: string; bonus: string }> = {
  engineer:   { icon: "🔧", label: "Engineer",   desc: "Buildings cost 20% less",         bonus: "cost" },
  trader:     { icon: "💰", label: "Trader",      desc: "Markets generate +3 extra income", bonus: "market" },
  politician: { icon: "🎭", label: "Politician",  desc: "+2 influence per turn",           bonus: "influence" },
  warrior:    { icon: "⚔️", label: "Warrior",     desc: "Firewalls protect adjacent cells", bonus: "defense" },
};

export default function NeuralNexus() {
  const [gameState, setGameState] = useState<"menu" | "spec" | "playing" | "over">("menu");
  const [spec, setSpec] = useState<Specialization | null>(null);
  const [grid, setGrid] = useState<GridCell[][]>([]);
  const [credits, setCredits] = useState(60);
  const [turn, setTurn] = useState(1);
  const [influence, setInfluence] = useState(0);
  const [selectedBuild, setSelectedBuild] = useState<Exclude<CellType, "empty">>("power");
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [eventId, setEventId] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [lastEventResult, setLastEventResult] = useState("");

  const initGrid = (): GridCell[][] =>
    Array.from({ length: GRID }, () => Array.from({ length: GRID }, () => ({ type: "empty" as CellType, level: 0, hp: 0 })));

  const startGame = useCallback((chosenSpec: Specialization) => {
    setSpec(chosenSpec);
    setGrid(initGrid());
    setCredits(chosenSpec === "trader" ? 80 : 60);
    setTurn(1);
    setInfluence(chosenSpec === "politician" ? 5 : 0);
    setEvents([]);
    setEventId(0);
    setResult(null);
    setLastEventResult("");
    setGameState("playing");
  }, []);

  const getBuildCost = (key: Exclude<CellType, "empty">, level: number) => {
    const base = BUILDINGS[key].cost * level;
    return spec === "engineer" ? Math.floor(base * 0.8) : base;
  };

  const placeBuilding = (row: number, col: number) => {
    if (gameState !== "playing") return;
    const cell = grid[row][col];
    const bld = BUILDINGS[selectedBuild];

    if (cell.type !== "empty") {
      if (cell.type === selectedBuild) {
        const upgCost = getBuildCost(selectedBuild, cell.level + 1);
        if (credits >= upgCost) {
          const ng = grid.map(r => r.map(c => ({ ...c })));
          ng[row][col].level++;
          ng[row][col].hp += 2;
          setCredits(prev => prev - upgCost);
          setGrid(ng);
        }
      }
      return;
    }

    const cost = getBuildCost(selectedBuild, 1);
    if (credits < cost) return;
    const ng = grid.map(r => r.map(c => ({ ...c })));
    ng[row][col] = { type: selectedBuild, level: 1, hp: 4 };
    setCredits(prev => prev - cost);
    setGrid(ng);
  };

  const endTurn = () => {
    let income = 0;
    let infGain = spec === "politician" ? 2 : 0;
    const ng = grid.map(r => r.map(c => ({ ...c })));

    ng.forEach(row => row.forEach(c => {
      if (c.type !== "empty") {
        const bld = BUILDINGS[c.type];
        let inc = bld.income * c.level;
        let inf = bld.influence * c.level;
        if (spec === "trader" && c.type === "market") inc += 3 * c.level;
        income += inc;
        infGain += inf;
      }
    }));

    // Events every 2-3 turns
    let eventResult = "";
    if (turn % 2 === 0 || (turn > 15 && turn % 2 !== 0 && Math.random() > 0.4)) {
      const evt = EVENTS[Math.floor(Math.random() * EVENTS.length)];
      const state = { grid: ng, credits: credits + income, influence: influence + infGain };
      eventResult = evt.effect(state);
      income = state.credits - credits; // re-derive
      infGain = state.influence - influence;

      setEventId(prev => {
        const nid = prev + 1;
        setEvents(evts => [...evts.slice(-3), { id: nid, text: `${evt.text} ${eventResult}`, type: evt.type }]);
        return nid;
      });
      setLastEventResult(eventResult);
    }

    // Remove destroyed
    ng.forEach((row, r) => row.forEach((c, col) => {
      if (c.type !== "empty" && c.hp <= 0) ng[r][col] = { type: "empty", level: 0, hp: 0 };
    }));

    const newInfluence = influence + infGain;
    const newTurn = turn + 1;

    setGrid(ng);
    setCredits(prev => prev + income);
    setInfluence(newInfluence);
    setTurn(newTurn);

    if (newTurn > 40) {
      const score = newInfluence + ng.flat().filter(c => c.type !== "empty").reduce((a, c) => a + c.level * 12, 0);
      const r = recordGameResult("neural-nexus", score, newInfluence);
      setResult({ score, turns: 40, buildings: ng.flat().filter(c => c.type !== "empty").length, xp: r.xpEarned, tokens: r.tokensEarned });
      setGameState("over");
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
            <p className="text-[10px] text-muted-foreground">
              {gameState === "playing" ? `${spec ? SPECIALIZATIONS[spec].icon : ""} Turn ${turn}/40 • ${SPECIALIZATIONS[spec!]?.label}` : "Grand Strategy Sandbox"}
            </p>
          </div>
        </div>

        {gameState === "playing" && (
          <>
            <div className="flex items-center justify-between mb-2 px-1 gap-2">
              <div className="flex items-center gap-1 text-xs font-bold text-accent-gold"><Coins className="h-3 w-3" /> {credits}</div>
              <div className="flex items-center gap-1 text-xs font-bold text-primary"><Zap className="h-3 w-3" /> {influence}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground"><Building2 className="h-3 w-3" /> {totalBuildings}</div>
            </div>

            {events.slice(-2).map(ev => (
              <div key={ev.id} className={`text-[10px] px-3 py-1.5 rounded-lg mb-1.5 border ${
                ev.type === "threat" || ev.type === "crisis" ? "bg-destructive/10 border-destructive/20 text-destructive" : "bg-accent-gold/10 border-accent-gold/20 text-accent-gold"
              }`}>{ev.text}</div>
            ))}

            <div className="flex gap-1 mb-2 overflow-x-auto pb-1 scrollbar-hide">
              {(Object.entries(BUILDINGS) as [Exclude<CellType, "empty">, typeof BUILDINGS.power][]).map(([key, bld]) => (
                <button
                  key={key}
                  onClick={() => setSelectedBuild(key)}
                  className={`shrink-0 px-2 py-1 rounded-lg text-[9px] font-bold border transition-all ${
                    selectedBuild === key ? "bg-primary/20 border-primary/40 text-primary" : "bg-card/40 border-border/30 text-muted-foreground"
                  }`}
                  title={bld.desc}
                >
                  {bld.icon} {getBuildCost(key, 1)}c
                </button>
              ))}
            </div>

            <div className="mx-auto rounded-xl border border-border/30 bg-card/20 p-1.5" style={{ width: GRID * CELL + 12 }}>
              <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${GRID}, 1fr)` }}>
                {grid.map((row, r) => row.map((cell, c) => {
                  const bld = cell.type !== "empty" ? BUILDINGS[cell.type] : null;
                  return (
                    <button
                      key={`${r}-${c}`}
                      onClick={() => placeBuilding(r, c)}
                      className={`rounded-md border flex flex-col items-center justify-center text-center transition-all ${
                        cell.type === "empty" ? "bg-muted/20 border-border/20 hover:bg-muted/40 hover:border-primary/20" : "border-border/40"
                      }`}
                      style={{ width: CELL, height: CELL, ...(bld ? { backgroundColor: bld.color + "12", borderColor: bld.color + "30" } : {}) }}
                    >
                      {bld ? (
                        <>
                          <span className="text-base leading-none">{bld.icon}</span>
                          <span className="text-[7px] font-bold text-muted-foreground">L{cell.level} ♥{cell.hp}</span>
                        </>
                      ) : (
                        <span className="text-[8px] text-muted-foreground/30">+</span>
                      )}
                    </button>
                  );
                }))}
              </div>
            </div>

            <Button onClick={endTurn} className="w-full mt-2 font-bold gap-2 text-sm">
              END TURN <span className="text-xs opacity-70">({turn}/40)</span>
            </Button>
          </>
        )}

        {gameState === "menu" && (
          <div className="flex flex-col items-center justify-center gap-4 p-8 mt-8">
            <div className="text-5xl">🏙️</div>
            <h2 className="text-2xl font-black text-foreground text-center">NEURAL NEXUS</h2>
            <p className="text-xs text-muted-foreground text-center max-w-[280px]">
              Build an AI-Powered Megalopolis. Choose a specialization, place buildings, manage resources, survive dynamic events, and maximize influence across 40 turns.
            </p>
            <Button onClick={() => setGameState("spec")} className="gap-2 font-bold"><Play className="h-4 w-4" /> CHOOSE ROLE</Button>
          </div>
        )}

        {gameState === "spec" && (
          <div className="flex flex-col items-center gap-4 p-6 mt-4">
            <h2 className="text-lg font-black text-foreground">Choose Your Specialization</h2>
            <div className="grid grid-cols-2 gap-3 w-full">
              {(Object.entries(SPECIALIZATIONS) as [Specialization, typeof SPECIALIZATIONS.engineer][]).map(([key, sp]) => (
                <button
                  key={key}
                  onClick={() => startGame(key)}
                  className="flex flex-col items-center gap-1 p-4 rounded-xl border border-border/40 bg-card/40 hover:border-primary/40 hover:bg-primary/5 transition-all"
                >
                  <span className="text-3xl">{sp.icon}</span>
                  <span className="text-sm font-black text-foreground">{sp.label}</span>
                  <span className="text-[9px] text-muted-foreground text-center">{sp.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {gameState === "over" && result && (
          <div className="flex flex-col items-center justify-center gap-3 p-8 mt-8">
            <Trophy className="h-10 w-10 text-accent-gold" />
            <h2 className="text-xl font-black text-foreground">CITY COMPLETE</h2>
            <div className="grid grid-cols-2 gap-3 w-full max-w-[240px]">
              <div className="text-center p-2 rounded-lg bg-card/50 border border-border/30">
                <p className="text-lg font-black text-foreground">{result.score.toLocaleString()}</p>
                <p className="text-[9px] text-muted-foreground">SCORE</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-card/50 border border-border/30">
                <p className="text-lg font-black text-foreground">{result.buildings}</p>
                <p className="text-[9px] text-muted-foreground">BUILDINGS</p>
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
              <Button onClick={() => setGameState("spec")} className="gap-2 font-bold"><RotateCcw className="h-4 w-4" /> REPLAY</Button>
              <Link to="/games"><Button variant="outline">ARCADE</Button></Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
