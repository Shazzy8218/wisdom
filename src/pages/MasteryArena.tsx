import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Shield, Flame, Trophy, Activity, Crosshair } from "lucide-react";
import { Link } from "react-router-dom";
import { streamChat } from "@/lib/ai-stream";
import { useProgress } from "@/hooks/useProgress";
import { getUserProfileForAI } from "@/hooks/useUserProfile";
import { toast } from "@/hooks/use-toast";
import {
  type ArenaScenario, type DrillResult, type DrillDecision, type SituationUpdate,
  COMPLEXITY_CONFIG, getArenaStats, saveArenaResult,
} from "@/lib/mastery-arena";
import ScenarioConfig from "@/components/arena/ScenarioConfig";
import ArenaHUD from "@/components/arena/ArenaHUD";
import ArenaDebrief from "@/components/arena/ArenaDebrief";

type ArenaState = "hub" | "active" | "processing" | "debrief";

export default function MasteryArena() {
  const [state, setState] = useState<ArenaState>("hub");
  const [scenario, setScenario] = useState<ArenaScenario | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [turnNumber, setTurnNumber] = useState(0);
  const [situationBrief, setSituationBrief] = useState("");
  const [situationLog, setSituationLog] = useState<SituationUpdate[]>([]);
  const [decisions, setDecisions] = useState<DrillDecision[]>([]);
  const [metrics, setMetrics] = useState({ pressure: 50, resources: 70, reputation: 80, morale: 65 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<DrillResult | null>(null);
  const { progress, update } = useProgress();
  const timerRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const stats = getArenaStats();

  const config = scenario ? COMPLEXITY_CONFIG[scenario.complexity] : COMPLEXITY_CONFIG.intermediate;
  const maxTurns = config.turns;

  // Timer
  useEffect(() => {
    if (state === "active" && timeLeft > 0) {
      timerRef.current = window.setTimeout(() => setTimeLeft(t => t - 1), 1000);
      return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }
    if (state === "active" && timeLeft <= 0 && scenario) {
      handleTimerExpired();
    }
  }, [state, timeLeft]);

  const handleTimerExpired = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    runDebrief();
  }, [scenario, decisions, situationLog, turnNumber]);

  const startDrill = useCallback(async (sc: ArenaScenario) => {
    setScenario(sc);
    const cfg = COMPLEXITY_CONFIG[sc.complexity];
    setTimeLeft(Math.round(sc.timeLimit * cfg.timeMult));
    setTurnNumber(0);
    setDecisions([]);
    setSituationLog([]);
    setMetrics({ pressure: 50, resources: 70, reputation: 80, morale: 65 });
    setResult(null);
    setState("active");
    setIsProcessing(true);

    // Generate initial situation brief
    let brief = "";
    abortRef.current = new AbortController();
    await streamChat({
      messages: [{
        role: "user",
        content: `You are the AI Drill Master for a high-stakes simulation. Generate an immersive opening situation brief for this scenario:

SCENARIO: ${sc.title}
DOMAIN: ${sc.domain}
GOAL: ${sc.goal}
DESCRIPTION: ${sc.description}
VARIABLES: ${sc.variables.join("; ")}
COMPLEXITY: ${cfg.label}

Write a compelling 3-4 paragraph situation brief that:
1. Sets the scene with urgency and tension
2. Presents the immediate crisis/challenge
3. Lists 2-3 immediate decision points the user must address
4. Includes simulated communications (e.g., an urgent email or message from a stakeholder)

Use present tense. Be specific with numbers, names, and deadlines. Make it feel real.`
      }],
      mode: "fast-answer",
      context: getUserProfileForAI(),
      onDelta: (t) => { brief += t; setSituationBrief(brief); },
      onDone: () => { setIsProcessing(false); },
      onError: (e) => { setSituationBrief("Situation briefing failed. Proceed with scenario context."); setIsProcessing(false); },
      signal: abortRef.current.signal,
    });
  }, []);

  const handleAction = useCallback(async (action: string) => {
    if (!scenario || isProcessing) return;
    setIsProcessing(true);
    const currentTurn = turnNumber + 1;
    setTurnNumber(currentTurn);

    const decisionHistory = decisions.map((d, i) => `Turn ${i + 1}: "${d.action}" → ${d.consequence}`).join("\n");

    let responseText = "";
    abortRef.current = new AbortController();
    await streamChat({
      messages: [{
        role: "user",
        content: `DRILL MASTER SIMULATION — Turn ${currentTurn}/${maxTurns}

SCENARIO: ${scenario.title} (${COMPLEXITY_CONFIG[scenario.complexity].label})
GOAL: ${scenario.goal}
CURRENT METRICS: Pressure ${metrics.pressure}%, Resources ${metrics.resources}%, Reputation ${metrics.reputation}%, Morale ${metrics.morale}%

PREVIOUS DECISIONS:
${decisionHistory || "None yet"}

CURRENT SITUATION BRIEF:
${situationBrief}

USER'S ACTION/DECISION:
"${action}"

Respond with ONLY valid JSON (no markdown, no backticks):
{
  "consequence": "2-3 sentences describing the immediate cascading consequence of this decision",
  "score": <number -10 to 10, how good was this decision>,
  "biasDetected": "<null or name of cognitive bias if detected, e.g. 'Sunk Cost Fallacy'>",
  "situationUpdate": {
    "type": "<metric|comms|event|warning|intel>",
    "title": "Brief title",
    "content": "What changed in the situation",
    "severity": "<info|caution|critical>"
  },
  "metricChanges": {
    "pressure": <delta -20 to 20>,
    "resources": <delta -20 to 20>,
    "reputation": <delta -20 to 20>,
    "morale": <delta -20 to 20>
  },
  "updatedBrief": "Updated 2-3 paragraph situation brief reflecting new state. Include new developments, stakeholder reactions, and next decision points."
}`
      }],
      mode: "fast-answer",
      context: getUserProfileForAI(),
      onDelta: (t) => { responseText += t; },
      onDone: () => {
        try {
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (!jsonMatch) throw new Error("No JSON");
          const parsed = JSON.parse(jsonMatch[0]);

          const decision: DrillDecision = {
            id: `d-${currentTurn}`,
            timestamp: Date.now(),
            timeElapsed: currentTurn,
            action,
            consequence: parsed.consequence || "Consequences unfold...",
            score: parsed.score || 0,
            biasDetected: parsed.biasDetected || undefined,
          };
          setDecisions(prev => [...prev, decision]);

          if (parsed.situationUpdate) {
            const su: SituationUpdate = {
              id: `su-${Date.now()}`,
              timestamp: Date.now(),
              ...parsed.situationUpdate,
            };
            setSituationLog(prev => [...prev, su]);
          }

          if (parsed.metricChanges) {
            setMetrics(prev => ({
              pressure: Math.max(0, Math.min(100, prev.pressure + (parsed.metricChanges.pressure || 0))),
              resources: Math.max(0, Math.min(100, prev.resources + (parsed.metricChanges.resources || 0))),
              reputation: Math.max(0, Math.min(100, prev.reputation + (parsed.metricChanges.reputation || 0))),
              morale: Math.max(0, Math.min(100, prev.morale + (parsed.metricChanges.morale || 0))),
            }));
          }

          if (parsed.updatedBrief) setSituationBrief(parsed.updatedBrief);

          // Check if drill is complete
          if (currentTurn >= maxTurns) {
            setTimeout(() => runDebrief([...decisions, decision]), 500);
          }
        } catch {
          const decision: DrillDecision = {
            id: `d-${currentTurn}`, timestamp: Date.now(), timeElapsed: currentTurn,
            action, consequence: responseText.slice(0, 200) || "Situation continues to evolve...", score: 0,
          };
          setDecisions(prev => [...prev, decision]);
          if (currentTurn >= maxTurns) setTimeout(() => runDebrief([...decisions, decision]), 500);
        }
        setIsProcessing(false);
      },
      onError: () => { setIsProcessing(false); },
      signal: abortRef.current.signal,
    });
  }, [scenario, turnNumber, maxTurns, decisions, situationBrief, metrics, isProcessing]);

  const runDebrief = useCallback(async (finalDecisions?: DrillDecision[]) => {
    if (!scenario) return;
    setState("processing");
    const allDecisions = finalDecisions || decisions;
    const decisionSummary = allDecisions.map((d, i) => `Turn ${i + 1}: "${d.action}" → ${d.consequence} (Score: ${d.score})`).join("\n");

    let debriefText = "";
    abortRef.current = new AbortController();
    await streamChat({
      messages: [{
        role: "user",
        content: `DRILL MASTER DEBRIEF — Full Performance Audit

SCENARIO: ${scenario.title}
GOAL: ${scenario.goal}
COMPLEXITY: ${COMPLEXITY_CONFIG[scenario.complexity].label}
TURNS PLAYED: ${allDecisions.length}/${maxTurns}
FINAL METRICS: Pressure ${metrics.pressure}%, Resources ${metrics.resources}%, Reputation ${metrics.reputation}%, Morale ${metrics.morale}%

ALL DECISIONS:
${decisionSummary}

Generate a comprehensive debrief. Return ONLY valid JSON (no markdown, no backticks):
{
  "totalScore": <0-100>,
  "maxScore": 100,
  "metrics": {
    "decisionSpeed": <1-10>,
    "strategicForesight": <1-10>,
    "resourceEfficiency": <1-10>,
    "adaptability": <1-10>,
    "composure": <1-10>,
    "overallGrade": "<S|A|B|C|D|F>"
  },
  "biases": ["Array of cognitive biases detected across all decisions with brief explanations"],
  "feedback": "Detailed 3-4 paragraph strategic debrief analyzing the user's decision-making pattern, key strengths, critical mistakes, and what an optimal path would have looked like",
  "playbook": ["Array of 4-6 specific, actionable strategic principles the user should adopt based on this drill"],
  "passed": <true if totalScore >= 60>
}`
      }],
      mode: "fast-answer",
      context: getUserProfileForAI(),
      onDelta: (t) => { debriefText += t; },
      onDone: () => {
        try {
          const jsonMatch = debriefText.match(/\{[\s\S]*\}/);
          if (!jsonMatch) throw new Error("No JSON");
          const parsed = JSON.parse(jsonMatch[0]);

          const drillResult: DrillResult = {
            scenarioId: scenario.id,
            totalScore: parsed.totalScore || 50,
            maxScore: parsed.maxScore || 100,
            decisions: allDecisions,
            situationLog,
            metrics: parsed.metrics || { decisionSpeed: 5, strategicForesight: 5, resourceEfficiency: 5, adaptability: 5, composure: 5, overallGrade: "C" },
            biases: parsed.biases || [],
            feedback: parsed.feedback || "Debrief analysis complete.",
            playbook: parsed.playbook || [],
            passed: parsed.passed ?? (parsed.totalScore >= 60),
            timeUsed: Math.round(scenario.timeLimit * COMPLEXITY_CONFIG[scenario.complexity].timeMult) - timeLeft,
          };

          setResult(drillResult);
          saveArenaResult(drillResult);

          if (drillResult.passed) {
            update(p => ({ ...p, tokens: p.tokens + 25, xp: p.xp + 80 }));
            toast({ title: "Drill Passed! +25 tokens, +80 XP" });
          } else {
            toast({ title: "Drill Failed. Analyze the debrief to improve." });
          }
          setState("debrief");
        } catch {
          const fallback: DrillResult = {
            scenarioId: scenario.id, totalScore: 40, maxScore: 100, decisions: allDecisions, situationLog,
            metrics: { decisionSpeed: 5, strategicForesight: 5, resourceEfficiency: 5, adaptability: 5, composure: 5, overallGrade: "C" },
            biases: [], feedback: debriefText || "Analysis complete.", playbook: [], passed: false,
            timeUsed: Math.round(scenario.timeLimit * COMPLEXITY_CONFIG[scenario.complexity].timeMult) - timeLeft,
          };
          setResult(fallback);
          setState("debrief");
        }
      },
      onError: () => { setState("hub"); },
      signal: abortRef.current.signal,
    });
  }, [scenario, decisions, situationLog, metrics, timeLeft, maxTurns, update]);

  return (
    <div className="min-h-screen pb-24 flex flex-col">
      {/* Header — only show in hub */}
      {(state === "hub" || state === "processing") && (
        <div className="px-5 pt-14 pb-4">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground text-caption mb-4 hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Crosshair className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="section-label text-primary mb-0.5">The Mastery Arena</p>
              <h1 className="font-display text-h2 text-foreground">Neural Syntax Engine</h1>
            </div>
          </div>
          <p className="text-caption text-muted-foreground mb-4">
            AI-powered strategic simulations that forge elite decision-making under pressure.
          </p>

          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Drills", value: stats.totalDrills, icon: Flame },
              { label: "Avg Score", value: stats.avgScore, icon: Activity },
              { label: "Best", value: stats.bestGrade, icon: Trophy },
              { label: "Streak", value: stats.streak, icon: Shield },
            ].map(s => (
              <div key={s.label} className="glass-card p-2.5 text-center">
                <s.icon className="h-3.5 w-3.5 mx-auto mb-1 text-primary" />
                <p className="font-mono text-caption font-bold text-foreground">{s.value}</p>
                <p className="text-[9px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {state === "hub" && <ScenarioConfig onStart={startDrill} />}

      {state === "active" && scenario && (
        <div className="flex-1 flex flex-col">
          <ArenaHUD
            scenario={scenario}
            timeLeft={timeLeft}
            turnNumber={turnNumber}
            maxTurns={maxTurns}
            situationBrief={situationBrief}
            situationLog={situationLog}
            metrics={metrics}
            isProcessing={isProcessing}
            onSubmitAction={handleAction}
            complexityConfig={config}
          />
        </div>
      )}

      {state === "processing" && (
        <div className="flex-1 flex items-center justify-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-body text-muted-foreground font-medium">Running Strategic Debrief...</p>
            <p className="text-caption text-muted-foreground">Analyzing decisions, detecting biases, generating playbook</p>
          </motion.div>
        </div>
      )}

      {state === "debrief" && result && (
        <ArenaDebrief result={result} onRetry={() => setState("hub")} onBack={() => setState("hub")} />
      )}
    </div>
  );
}
