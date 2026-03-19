import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, AlertTriangle, Radio, Activity, Send, ChevronDown, ChevronUp, Shield } from "lucide-react";
import type { ArenaScenario, SituationUpdate, COMPLEXITY_CONFIG } from "@/lib/mastery-arena";
import ReactMarkdown from "react-markdown";

interface ArenaHUDProps {
  scenario: ArenaScenario;
  timeLeft: number;
  turnNumber: number;
  maxTurns: number;
  situationBrief: string;
  situationLog: SituationUpdate[];
  metrics: { pressure: number; resources: number; reputation: number; morale: number };
  isProcessing: boolean;
  onSubmitAction: (action: string) => void;
  complexityConfig: typeof COMPLEXITY_CONFIG[keyof typeof COMPLEXITY_CONFIG];
}

export default function ArenaHUD({
  scenario, timeLeft, turnNumber, maxTurns, situationBrief, situationLog,
  metrics, isProcessing, onSubmitAction, complexityConfig,
}: ArenaHUDProps) {
  const [actionText, setActionText] = useState("");
  const [showLog, setShowLog] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  const timePercent = (timeLeft / (scenario.timeLimit * (complexityConfig.timeMult))) * 100;
  const isUrgent = timePercent < 25;

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [situationLog]);

  const handleSubmit = () => {
    if (!actionText.trim() || isProcessing) return;
    onSubmitAction(actionText.trim());
    setActionText("");
  };

  const severityColors = { info: "border-muted", caution: "border-accent-gold/40", critical: "border-primary/60" };
  const typeIcons = { metric: "📊", comms: "📨", event: "⚡", warning: "⚠️", intel: "🔍" };

  return (
    <div className="flex flex-col h-full">
      {/* Top HUD Bar */}
      <div className="px-4 pt-3 pb-2 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-micro font-bold text-primary uppercase tracking-wider">
              {complexityConfig.label}
            </span>
            <span className="text-micro text-muted-foreground">Turn {turnNumber}/{maxTurns}</span>
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-caption font-bold ${isUrgent ? "bg-primary/15 text-primary animate-pulse" : "bg-surface-2 text-foreground"}`}>
            <Timer className="h-3.5 w-3.5" />
            {formatTime(timeLeft)}
          </div>
        </div>
        {/* Metric bars */}
        <div className="grid grid-cols-4 gap-2">
          {([
            { key: "pressure", label: "PRESSURE", color: "bg-primary" },
            { key: "resources", label: "RESOURCES", color: "bg-accent-green" },
            { key: "reputation", label: "REPUTATION", color: "bg-accent-gold" },
            { key: "morale", label: "MORALE", color: "bg-blue-400" },
          ] as const).map(m => (
            <div key={m.key} className="space-y-0.5">
              <p className="text-[9px] text-muted-foreground font-medium tracking-wider">{m.label}</p>
              <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${m.color}`}
                  animate={{ width: `${metrics[m.key]}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Situation Brief */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        <div className="glass-card p-4 border-l-2 border-primary/40">
          <div className="flex items-center gap-2 mb-2">
            <Radio className="h-3.5 w-3.5 text-primary" />
            <span className="text-micro font-bold text-primary uppercase tracking-wider">Situation Brief</span>
          </div>
          <div className="prose prose-invert prose-sm max-w-none text-caption text-muted-foreground">
            <ReactMarkdown>{situationBrief}</ReactMarkdown>
          </div>
        </div>

        {/* Situation Log Toggle */}
        {situationLog.length > 0 && (
          <button onClick={() => setShowLog(!showLog)}
            className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-xl bg-surface-2 hover:bg-surface-hover transition-colors">
            <Activity className="h-3.5 w-3.5 text-accent-gold" />
            <span className="text-micro font-semibold text-foreground">Intel Feed</span>
            <span className="text-micro text-muted-foreground ml-1">({situationLog.length})</span>
            {showLog ? <ChevronUp className="h-3 w-3 ml-auto text-muted-foreground" /> : <ChevronDown className="h-3 w-3 ml-auto text-muted-foreground" />}
          </button>
        )}

        <AnimatePresence>
          {showLog && (
            <motion.div ref={logRef} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="space-y-2 overflow-hidden max-h-48 overflow-y-auto">
              {situationLog.map((update) => (
                <div key={update.id} className={`px-3 py-2 rounded-xl bg-surface-2 border-l-2 ${severityColors[update.severity]}`}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-micro">{typeIcons[update.type]}</span>
                    <span className="text-micro font-semibold text-foreground">{update.title}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{update.content}</p>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {isProcessing && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/5 border border-primary/20">
            <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span className="text-caption text-primary font-medium">Processing consequences...</span>
          </div>
        )}
      </div>

      {/* Action Input */}
      <div className="px-4 pb-4 pt-2 border-t border-border bg-background/90 backdrop-blur-sm">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={actionText}
            onChange={e => setActionText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
            placeholder={isProcessing ? "Waiting for situation update..." : "Enter your decision or directive..."}
            disabled={isProcessing}
            rows={2}
            className="w-full bg-surface-2 border border-border rounded-2xl px-4 py-3 pr-12 text-caption text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/40 resize-none disabled:opacity-40"
          />
          <button
            onClick={handleSubmit}
            disabled={!actionText.trim() || isProcessing}
            className="absolute right-2 bottom-2 p-2 rounded-xl bg-primary text-primary-foreground disabled:opacity-30 transition-opacity"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
