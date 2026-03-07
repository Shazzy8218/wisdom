import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Timer, Zap, Trophy, AlertTriangle, Play, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import { streamChat } from "@/lib/ai-stream";
import { useProgress } from "@/hooks/useProgress";
import { getUserProfileForAI } from "@/hooks/useUserProfile";
import { toast } from "@/hooks/use-toast";
import OwlIcon from "@/components/OwlIcon";
import ReactMarkdown from "react-markdown";

const DRILL_SCENARIOS = [
  { id: "d1", title: "PR Crisis Response", description: "Your company's product just caused a safety incident. Draft an immediate public response.", category: "Management", timeLimit: 120 },
  { id: "d2", title: "Customer Complaint Escalation", description: "A VIP customer threatens to leave. Craft a retention response.", category: "Sales", timeLimit: 120 },
  { id: "d3", title: "Budget Rescue Plan", description: "Your department budget was just cut by 30%. Propose a restructuring plan.", category: "Business & finance", timeLimit: 120 },
  { id: "d4", title: "Negotiation Script", description: "You're negotiating a 20% raise. Prepare your key arguments.", category: "Management", timeLimit: 120 },
  { id: "d5", title: "Broken Workflow Fix", description: "Your team's onboarding process takes 3 weeks. Redesign it to take 3 days.", category: "Office & admin", timeLimit: 120 },
  { id: "d6", title: "Hiring Decision", description: "Two strong candidates, one budget. Make your case for your pick.", category: "Management", timeLimit: 120 },
  { id: "d7", title: "Sales Objection Handler", description: "Prospect says 'too expensive'. Respond persuasively.", category: "Sales", timeLimit: 120 },
  { id: "d8", title: "Data Breach Response", description: "User data may have been compromised. Draft an internal action plan.", category: "Protective service", timeLimit: 120 },
];

type DrillState = "select" | "active" | "grading" | "result";

interface GradeResult {
  clarity: number;
  completeness: number;
  realism: number;
  ethics: number;
  actionability: number;
  overall: number;
  feedback: string;
  passed: boolean;
}

export default function LiveFireDrills() {
  const [state, setState] = useState<DrillState>("select");
  const [drill, setDrill] = useState(DRILL_SCENARIOS[0]);
  const [timeLeft, setTimeLeft] = useState(120);
  const [userResponse, setUserResponse] = useState("");
  const [grade, setGrade] = useState<GradeResult | null>(null);
  const [hardMode, setHardMode] = useState(() => localStorage.getItem("wisdom-hard-mode") === "true");
  const { progress, update } = useProgress();
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (state === "active" && timeLeft > 0) {
      timerRef.current = window.setTimeout(() => setTimeLeft(t => t - 1), 1000);
      return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }
    if (state === "active" && timeLeft <= 0) {
      handleSubmitDrill();
    }
  }, [state, timeLeft]);

  const startDrill = (scenario: typeof DRILL_SCENARIOS[0]) => {
    setDrill(scenario);
    setTimeLeft(scenario.timeLimit);
    setUserResponse("");
    setGrade(null);
    setState("active");
  };

  const handleSubmitDrill = useCallback(async () => {
    setState("grading");
    if (timerRef.current) clearTimeout(timerRef.current);

    try {
      let gradeText = "";
      await streamChat({
        messages: [
          { role: "user", content: `DRILL SCENARIO: ${drill.title}\n${drill.description}\n\nUSER'S RESPONSE:\n${userResponse}\n\nGrade this response on a 1-10 scale for each: clarity, completeness, realism, ethics/safety, actionability. Then give an overall score (1-10), brief feedback, and whether they passed (overall >= 6). Return as JSON: {"clarity":N,"completeness":N,"realism":N,"ethics":N,"actionability":N,"overall":N,"feedback":"...","passed":true/false}. RETURN ONLY THE JSON.` }
        ],
        mode: "fast-answer",
        context: getUserProfileForAI(),
        onDelta: (t) => { gradeText += t; },
        onDone: () => {
          try {
            const jsonMatch = gradeText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]) as GradeResult;
              setGrade(parsed);
              if (parsed.passed) {
                update(p => ({ ...p, tokens: p.tokens + 15, xp: p.xp + 50 }));
                toast({ title: "Drill Passed! +15 tokens, +50 XP" });
              } else if (hardMode) {
                const penalty = Math.min(3, progress.tokens);
                update(p => ({ ...p, tokens: Math.max(0, p.tokens - penalty) }));
                toast({ title: `Drill Failed. -${penalty} tokens (Hard Mode)`, variant: "destructive" });
              } else {
                toast({ title: "Drill Failed. No penalty. Try again!" });
              }
            }
          } catch { setGrade({ clarity: 5, completeness: 5, realism: 5, ethics: 5, actionability: 5, overall: 5, feedback: gradeText, passed: false }); }
          setState("result");
        },
        onError: () => { setState("result"); },
      });
    } catch {
      setState("result");
    }
  }, [drill, userResponse, hardMode, update, progress.tokens]);

  const toggleHardMode = () => {
    const newVal = !hardMode;
    setHardMode(newVal);
    localStorage.setItem("wisdom-hard-mode", String(newVal));
    toast({ title: newVal ? "Hard Mode ON — failures cost tokens" : "Hard Mode OFF" });
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 pt-14 pb-6">
        <Link to="/" className="flex items-center gap-2 text-muted-foreground text-caption mb-4 hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <p className="section-label text-primary mb-2">Live Fire Drills</p>
            <h1 className="font-display text-h1 text-foreground">Sandbox Mode</h1>
          </div>
          <button onClick={toggleHardMode} className={`rounded-xl px-3 py-1.5 text-micro font-medium border transition-all ${hardMode ? "bg-primary/10 border-primary/30 text-primary" : "bg-surface-2 border-border text-muted-foreground"}`}>
            {hardMode ? "⚡ Hard Mode" : "Normal Mode"}
          </button>
        </div>
        {hardMode && (
          <div className="flex items-center gap-2 mt-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
            <AlertTriangle className="h-4 w-4 text-primary shrink-0" />
            <p className="text-micro text-primary">Hard Mode: Failing a drill costs 1–3 tokens.</p>
          </div>
        )}
      </div>

      {state === "select" && (
        <div className="px-5 space-y-3">
          <p className="text-caption text-muted-foreground mb-2">Solve a real scenario under time pressure. 2 minutes. Go.</p>
          {DRILL_SCENARIOS.map((s, i) => (
            <motion.button key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              onClick={() => startDrill(s)}
              className="w-full glass-card p-5 flex items-center gap-4 text-left hover:border-primary/20 transition-all">
              <Play className="h-5 w-5 text-primary shrink-0" />
              <div className="flex-1">
                <p className="text-body font-semibold text-foreground">{s.title}</p>
                <p className="text-caption text-muted-foreground mt-0.5">{s.description}</p>
                <p className="text-micro text-muted-foreground mt-1">{s.category} · {s.timeLimit}s</p>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {state === "active" && (
        <div className="px-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-body font-semibold text-foreground">{drill.title}</h2>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono text-caption font-bold ${timeLeft <= 30 ? "bg-primary/10 text-primary" : "bg-surface-2 text-foreground"}`}>
              <Timer className="h-4 w-4" /> {formatTime(timeLeft)}
            </div>
          </div>
          <p className="text-caption text-muted-foreground mb-4">{drill.description}</p>
          <textarea
            value={userResponse}
            onChange={e => setUserResponse(e.target.value)}
            placeholder="Type your response here..."
            rows={10}
            autoFocus
            className="w-full bg-surface-2 border border-border rounded-2xl p-4 text-body text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/40 resize-none"
          />
          <button onClick={handleSubmitDrill} disabled={!userResponse.trim()}
            className="mt-4 w-full rounded-2xl bg-primary py-3.5 text-body font-bold text-primary-foreground disabled:opacity-40 transition-opacity">
            Submit Response
          </button>
        </div>
      )}

      {state === "grading" && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <OwlIcon size={40} className="animate-pulse" />
            <p className="text-body text-muted-foreground">Grading your response...</p>
          </div>
        </div>
      )}

      {state === "result" && grade && (
        <div className="px-5 space-y-4">
          <div className={`glass-card p-6 text-center ${grade.passed ? "border-accent-green/30" : "border-primary/30"}`}>
            <Trophy className={`h-8 w-8 mx-auto mb-3 ${grade.passed ? "text-accent-green" : "text-primary"}`} />
            <h2 className="font-display text-h2 text-foreground mb-1">{grade.passed ? "Drill Passed!" : "Not Quite"}</h2>
            <p className="text-caption text-muted-foreground">{grade.passed ? "+15 tokens, +50 XP earned" : hardMode ? "Hard Mode: tokens deducted" : "No penalty. Try again!"}</p>
          </div>

          <div className="glass-card p-5">
            <h3 className="section-label mb-3">Rubric Scores</h3>
            <div className="grid grid-cols-2 gap-3">
              {(["clarity", "completeness", "realism", "ethics", "actionability"] as const).map(k => (
                <div key={k} className="flex items-center justify-between">
                  <span className="text-caption text-muted-foreground capitalize">{k === "ethics" ? "Ethics/Safety" : k}</span>
                  <span className={`font-mono text-caption font-bold ${(grade[k] as number) >= 7 ? "text-accent-green" : (grade[k] as number) >= 5 ? "text-foreground" : "text-primary"}`}>
                    {grade[k]}/10
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between col-span-2 border-t border-border pt-2">
                <span className="text-body font-semibold text-foreground">Overall</span>
                <span className="font-mono text-body font-bold text-foreground">{grade.overall}/10</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="section-label mb-3">Feedback</h3>
            <div className="prose prose-invert prose-sm max-w-none text-caption text-muted-foreground">
              <ReactMarkdown>{grade.feedback}</ReactMarkdown>
            </div>
          </div>

          <button onClick={() => setState("select")} className="w-full flex items-center justify-center gap-2 rounded-2xl bg-surface-2 py-3 text-body font-semibold text-foreground hover:bg-surface-hover transition-colors">
            <RotateCcw className="h-4 w-4" /> Try Another Drill
          </button>
        </div>
      )}
    </div>
  );
}
