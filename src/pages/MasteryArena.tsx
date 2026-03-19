import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Shield, Flame, Trophy, Activity, Crosshair, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { streamChat } from "@/lib/ai-stream";
import { useProgress } from "@/hooks/useProgress";
import { getUserProfileForAI } from "@/hooks/useUserProfile";
import { toast } from "@/hooks/use-toast";
import {
  type ArenaScenario, type DrillResult, type DrillDecision, type SituationUpdate, type CommMessage,
  COMPLEXITY_CONFIG, getArenaStats, saveArenaResult, saveDrillToHistory, COGNITIVE_ARCHETYPES,
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
  const [commsLog, setCommsLog] = useState<CommMessage[]>([]);
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
    setCommsLog([]);
    setMetrics({ pressure: 50, resources: 70, reputation: 80, morale: 65 });
    setResult(null);
    setState("active");
    setIsProcessing(true);

    const aiRole = sc.aiIntervention || "neutral";
    let brief = "";
    abortRef.current = new AbortController();
    await streamChat({
      messages: [{
        role: "user",
        content: `You are the AI Drill Master for THE MASTERY ARENA: NEURAL SYNTAX ENGINE — a hyper-realistic strategic simulation.

AI ROLE: ${aiRole === "antagonist" ? "You are an ACTIVE ANTAGONIST — deliberately counter the user's strategies." : aiRole === "active" ? "You are a FULL ADVERSARY — intelligent opposition adapting to moves." : aiRole === "environmental" ? "You are a CHAOS ENGINE — introduce random disruptive events." : "You are a NEUTRAL observer presenting realistic challenges."}

Generate an immersive opening situation brief:

SCENARIO: ${sc.title}
DOMAIN: ${sc.domain}
GOAL: ${sc.goal}
DESCRIPTION: ${sc.description}
VARIABLES: ${sc.variables.join("; ") || "None specified"}
COMPLEXITY: ${cfg.label} (${cfg.turns} turns)
${sc.desiredOutcome ? `LEARNING OUTCOME: ${sc.desiredOutcome}` : ""}

Write a compelling 3-4 paragraph situation brief that:
1. Sets the scene with urgency, tension, and specific details (names, numbers, deadlines)
2. Presents the immediate crisis with multiple interconnected pressure points
3. Lists 2-3 decision points requiring immediate attention
4. Includes at least one stakeholder communication (urgent email/message) embedded in the brief

Also generate an initial stakeholder communication. After the brief, add on a new line:
---COMMS---
Then provide ONLY valid JSON for the first communication:
{"from":"<name>","role":"<title>","channel":"<email|chat|call|alert>","subject":"<if email>","content":"<message>","urgent":<true|false>,"requiresResponse":<true|false>}

Use present tense. Make it viscerally real.`
      }],
      mode: "fast-answer",
      context: getUserProfileForAI(),
      onDelta: (t) => {
        brief += t;
        const commsIdx = brief.indexOf("---COMMS---");
        if (commsIdx === -1) {
          setSituationBrief(brief);
        } else {
          setSituationBrief(brief.slice(0, commsIdx).trim());
        }
      },
      onDone: () => {
        // Parse comms
        const commsIdx = brief.indexOf("---COMMS---");
        if (commsIdx !== -1) {
          try {
            const commsJson = brief.slice(commsIdx + 11).trim();
            const match = commsJson.match(/\{[\s\S]*\}/);
            if (match) {
              const parsed = JSON.parse(match[0]);
              setCommsLog([{ id: `cm-init`, timestamp: Date.now(), ...parsed }]);
            }
          } catch {}
        }
        setIsProcessing(false);
      },
      onError: () => { setSituationBrief("Situation briefing failed. Proceed with scenario context."); setIsProcessing(false); },
      signal: abortRef.current.signal,
    });
  }, []);

  const handleAction = useCallback(async (action: string) => {
    if (!scenario || isProcessing) return;
    setIsProcessing(true);
    const currentTurn = turnNumber + 1;
    setTurnNumber(currentTurn);

    const decisionHistory = decisions.map((d, i) => `Turn ${i + 1}: "${d.action}" → ${d.consequence} (Score: ${d.score})`).join("\n");
    const commsHistory = commsLog.map(c => `[${c.channel}] ${c.from}: ${c.content}`).join("\n");

    let responseText = "";
    abortRef.current = new AbortController();
    await streamChat({
      messages: [{
        role: "user",
        content: `MASTERY ARENA SIMULATION — Turn ${currentTurn}/${maxTurns}

SCENARIO: ${scenario.title} (${COMPLEXITY_CONFIG[scenario.complexity].label})
GOAL: ${scenario.goal}
AI ROLE: ${scenario.aiIntervention || "neutral"}
METRICS: Pressure ${metrics.pressure}%, Resources ${metrics.resources}%, Reputation ${metrics.reputation}%, Morale ${metrics.morale}%

DECISIONS SO FAR:
${decisionHistory || "None"}

RECENT COMMS:
${commsHistory || "None"}

CURRENT BRIEF:
${situationBrief}

USER'S ACTION: "${action}"

Respond with ONLY valid JSON (no markdown, no backticks):
{
  "consequence": "2-3 sentences — immediate cascading consequence with specific details",
  "score": <-10 to 10>,
  "biasDetected": "<null or bias name like 'Sunk Cost Fallacy', 'Confirmation Bias'>",
  "criticalNode": <true if this decision fundamentally altered the scenario trajectory>,
  "alternativePath": "<null or 1-sentence optimal alternative action>",
  "situationUpdate": {
    "type": "<metric|comms|event|warning|intel|stakeholder>",
    "title": "Brief title",
    "content": "What changed",
    "severity": "<info|caution|critical>",
    "from": "<null or stakeholder name>"
  },
  "newComm": <null or {"from":"<name>","role":"<title>","channel":"<email|chat|call|alert>","subject":"<if email>","content":"<message>","urgent":<bool>,"requiresResponse":<bool>}>,
  "metricChanges": {"pressure":<-20 to 20>,"resources":<-20 to 20>,"reputation":<-20 to 20>,"morale":<-20 to 20>},
  "updatedBrief": "Updated 2-3 paragraph brief reflecting new state, new developments, stakeholder reactions, and next decision points"
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
            id: `d-${currentTurn}`, timestamp: Date.now(), timeElapsed: currentTurn,
            action, consequence: parsed.consequence || "Consequences unfold...",
            score: parsed.score || 0, biasDetected: parsed.biasDetected || undefined,
            criticalNode: parsed.criticalNode || false,
            alternativePath: parsed.alternativePath || undefined,
          };
          setDecisions(prev => [...prev, decision]);

          if (parsed.situationUpdate) {
            setSituationLog(prev => [...prev, { id: `su-${Date.now()}`, timestamp: Date.now(), ...parsed.situationUpdate }]);
          }

          if (parsed.newComm) {
            setCommsLog(prev => [...prev, { id: `cm-${Date.now()}`, timestamp: Date.now(), ...parsed.newComm }]);
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

          if (currentTurn >= maxTurns) {
            setTimeout(() => runDebrief([...decisions, decision]), 500);
          }
        } catch {
          const decision: DrillDecision = {
            id: `d-${currentTurn}`, timestamp: Date.now(), timeElapsed: currentTurn,
            action, consequence: responseText.slice(0, 200) || "Situation evolves...", score: 0,
          };
          setDecisions(prev => [...prev, decision]);
          if (currentTurn >= maxTurns) setTimeout(() => runDebrief([...decisions, decision]), 500);
        }
        setIsProcessing(false);
      },
      onError: () => { setIsProcessing(false); },
      signal: abortRef.current.signal,
    });
  }, [scenario, turnNumber, maxTurns, decisions, situationBrief, metrics, commsLog, isProcessing]);

  const runDebrief = useCallback(async (finalDecisions?: DrillDecision[]) => {
    if (!scenario) return;
    setState("processing");
    const allDecisions = finalDecisions || decisions;
    const decisionSummary = allDecisions.map((d, i) =>
      `Turn ${i + 1}: "${d.action}" → ${d.consequence} (Score: ${d.score}${d.biasDetected ? `, Bias: ${d.biasDetected}` : ""})`
    ).join("\n");

    const archetypeList = COGNITIVE_ARCHETYPES.map(a => a.id).join(", ");

    let debriefText = "";
    abortRef.current = new AbortController();
    await streamChat({
      messages: [{
        role: "user",
        content: `MASTERY ARENA — COMPREHENSIVE STRATEGIC DEBRIEF

SCENARIO: ${scenario.title}
GOAL: ${scenario.goal}
COMPLEXITY: ${COMPLEXITY_CONFIG[scenario.complexity].label}
TURNS: ${allDecisions.length}/${maxTurns}
FINAL METRICS: Pressure ${metrics.pressure}%, Resources ${metrics.resources}%, Reputation ${metrics.reputation}%, Morale ${metrics.morale}%

ALL DECISIONS:
${decisionSummary}

Generate a ruthlessly honest, comprehensive debrief. Return ONLY valid JSON:
{
  "totalScore": <0-100>,
  "maxScore": 100,
  "metrics": {
    "decisionSpeed": <1-10>,
    "strategicForesight": <1-10>,
    "resourceEfficiency": <1-10>,
    "adaptability": <1-10>,
    "composure": <1-10>,
    "communicationClarity": <1-10>,
    "overallGrade": "<S|A|B|C|D|F>"
  },
  "cognitiveArchetype": "<one of: ${archetypeList}>",
  "archetypeDescription": "2-sentence analysis of why this archetype fits the user's decision pattern",
  "biases": ["Array of biases detected with brief explanations"],
  "feedback": "Detailed 4-5 paragraph strategic debrief — analyze decision patterns, key strengths, critical errors, what optimal path would have been. Be ruthlessly honest.",
  "counterfactuals": [
    {"turn": <number>, "alternative": "What they should have done", "projectedOutcome": "What would have happened", "successRate": <0-100>}
  ],
  "playbook": ["6-8 specific, actionable strategic principles"],
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

          const archetype = COGNITIVE_ARCHETYPES.find(a => a.id === parsed.cognitiveArchetype);

          const drillResult: DrillResult = {
            scenarioId: scenario.id,
            totalScore: parsed.totalScore || 50,
            maxScore: parsed.maxScore || 100,
            decisions: allDecisions,
            situationLog,
            commsLog,
            metrics: {
              decisionSpeed: parsed.metrics?.decisionSpeed || 5,
              strategicForesight: parsed.metrics?.strategicForesight || 5,
              resourceEfficiency: parsed.metrics?.resourceEfficiency || 5,
              adaptability: parsed.metrics?.adaptability || 5,
              composure: parsed.metrics?.composure || 5,
              communicationClarity: parsed.metrics?.communicationClarity || 5,
              overallGrade: parsed.metrics?.overallGrade || "C",
            },
            biases: parsed.biases || [],
            feedback: parsed.feedback || "Debrief analysis complete.",
            playbook: parsed.playbook || [],
            cognitiveArchetype: archetype?.name || parsed.cognitiveArchetype || "Unknown",
            archetypeDescription: parsed.archetypeDescription || archetype?.description || "",
            counterfactuals: parsed.counterfactuals || [],
            passed: parsed.passed ?? (parsed.totalScore >= 60),
            timeUsed: Math.round(scenario.timeLimit * COMPLEXITY_CONFIG[scenario.complexity].timeMult) - timeLeft,
          };

          setResult(drillResult);
          saveArenaResult(drillResult);
          saveDrillToHistory(drillResult);

          if (drillResult.passed) {
            update(p => ({ ...p, tokens: p.tokens + 25, xp: p.xp + 80 }));
            toast({ title: "Drill Passed! +25 tokens, +80 XP" });
          } else {
            toast({ title: "Drill Failed. Analyze the debrief to improve." });
          }
          setState("debrief");
        } catch {
          const fallback: DrillResult = {
            scenarioId: scenario.id, totalScore: 40, maxScore: 100, decisions: allDecisions, situationLog, commsLog,
            metrics: { decisionSpeed: 5, strategicForesight: 5, resourceEfficiency: 5, adaptability: 5, composure: 5, communicationClarity: 5, overallGrade: "C" },
            biases: [], feedback: debriefText || "Analysis complete.", playbook: [],
            cognitiveArchetype: "Unknown", archetypeDescription: "", counterfactuals: [],
            passed: false, timeUsed: Math.round(scenario.timeLimit * COMPLEXITY_CONFIG[scenario.complexity].timeMult) - timeLeft,
          };
          setResult(fallback);
          saveDrillToHistory(fallback);
          setState("debrief");
        }
      },
      onError: () => { setState("hub"); },
      signal: abortRef.current.signal,
    });
  }, [scenario, decisions, situationLog, commsLog, metrics, timeLeft, maxTurns, update]);

  const dominantArchetype = stats.archetypeHistory?.length
    ? Object.entries(stats.archetypeHistory.reduce((acc: Record<string, number>, a) => { acc[a] = (acc[a] || 0) + 1; return acc; }, {}))
        .sort(([, a], [, b]) => b - a)[0]?.[0] || "—"
    : "—";

  return (
    <div className="min-h-screen pb-24 flex flex-col">
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
            AI-powered strategic simulations forging elite decision-making under real-world pressure.
          </p>

          <div className="grid grid-cols-5 gap-2">
            {[
              { label: "Drills", value: stats.totalDrills, icon: Flame },
              { label: "Avg", value: stats.avgScore, icon: Activity },
              { label: "Best", value: stats.bestGrade, icon: Trophy },
              { label: "Streak", value: stats.streak, icon: Shield },
              { label: "Type", value: dominantArchetype?.slice(0, 6) || "—", icon: TrendingUp },
            ].map(s => (
              <div key={s.label} className="glass-card p-2 text-center">
                <s.icon className="h-3 w-3 mx-auto mb-0.5 text-primary" />
                <p className="font-mono text-[10px] font-bold text-foreground truncate">{s.value}</p>
                <p className="text-[8px] text-muted-foreground">{s.label}</p>
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
            commsLog={commsLog}
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
            <p className="text-caption text-muted-foreground">Analyzing decisions · Detecting biases · Generating playbook</p>
          </motion.div>
        </div>
      )}

      {state === "debrief" && result && (
        <ArenaDebrief result={result} onRetry={() => setState("hub")} onBack={() => setState("hub")} />
      )}
    </div>
  );
}
