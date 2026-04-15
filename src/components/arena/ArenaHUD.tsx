import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, Radio, Activity, Send, ChevronDown, ChevronUp, Shield, Mail, MessageSquare, Phone, Bell, AlertTriangle } from "lucide-react";
import type { ArenaScenario, SituationUpdate, CommMessage, COMPLEXITY_CONFIG } from "@/lib/mastery-arena";
import ReactMarkdown from "react-markdown";
import DecisionRipple from "@/components/DecisionRipple";
import CountUpNumber from "@/components/CountUpNumber";

interface ArenaHUDProps {
  scenario: ArenaScenario;
  timeLeft: number;
  turnNumber: number;
  maxTurns: number;
  situationBrief: string;
  situationLog: SituationUpdate[];
  commsLog: CommMessage[];
  metrics: { pressure: number; resources: number; reputation: number; morale: number };
  isProcessing: boolean;
  onSubmitAction: (action: string) => void;
  complexityConfig: typeof COMPLEXITY_CONFIG[keyof typeof COMPLEXITY_CONFIG];
}

const CHANNEL_ICONS = { email: Mail, chat: MessageSquare, call: Phone, alert: Bell };

export default function ArenaHUD({
  scenario, timeLeft, turnNumber, maxTurns, situationBrief, situationLog, commsLog,
  metrics, isProcessing, onSubmitAction, complexityConfig,
}: ArenaHUDProps) {
  const [actionText, setActionText] = useState("");
  const [activePanel, setActivePanel] = useState<"brief" | "intel" | "comms">("brief");
  const logRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  const timePercent = (timeLeft / (scenario.timeLimit * (complexityConfig.timeMult))) * 100;
  const isUrgent = timePercent < 25;
  const isCritical = timePercent < 10;

  const unreadComms = commsLog.filter(c => c.urgent).length;

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [situationLog, commsLog, situationBrief]);

  const handleSubmit = () => {
    if (!actionText.trim() || isProcessing) return;
    onSubmitAction(actionText.trim());
    setActionText("");
  };

  const severityColors = { info: "border-muted", caution: "border-accent-gold/40", critical: "border-primary/60" };
  const typeIcons: Record<string, string> = { metric: "📊", comms: "📨", event: "⚡", warning: "⚠️", intel: "🔍", stakeholder: "👤" };

  return (
    <div className="flex flex-col h-full">
      {/* Top HUD Bar */}
      <div className="px-4 pt-3 pb-2 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-micro font-bold text-primary uppercase tracking-wider">{complexityConfig.label}</span>
            <span className="text-micro text-muted-foreground">Turn {turnNumber}/{maxTurns}</span>
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-caption font-bold transition-all ${isCritical ? "bg-primary/25 text-primary animate-pulse" : isUrgent ? "bg-primary/15 text-primary" : "bg-surface-2 text-foreground"}`}>
            <Timer className="h-3.5 w-3.5" />
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Metric bars */}
        <div className="grid grid-cols-4 gap-2 mb-2">
          {([
            { key: "pressure" as const, label: "PRESSURE", color: "bg-primary", warn: true },
            { key: "resources" as const, label: "RESOURCES", color: "bg-accent-green", warn: false },
            { key: "reputation" as const, label: "REPUTATION", color: "bg-accent-gold", warn: false },
            { key: "morale" as const, label: "MORALE", color: "bg-blue-400", warn: false },
          ]).map(m => {
            const val = metrics[m.key];
            const isDanger = m.warn ? val > 80 : val < 25;
            return (
              <div key={m.key} className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] text-muted-foreground font-medium tracking-wider">{m.label}</p>
                  {isDanger && <AlertTriangle className="h-2.5 w-2.5 text-primary" />}
                </div>
                <div className={`h-1.5 bg-surface-2 rounded-full overflow-hidden ${isDanger ? "metric-danger-glow" : ""}`}>
                  <motion.div className={`h-full rounded-full ${isDanger ? "bg-primary" : m.color}`}
                    animate={{ width: `${val}%` }} transition={{ duration: 0.5, type: "spring", damping: 20 }} />
                </div>
                <p className="text-[8px] text-muted-foreground text-right font-mono">
                  <CountUpNumber value={val} suffix="%" className="tabular-nums" />
                </p>
              </div>
            );
          })}
        </div>

        {/* Panel Tabs */}
        <div className="flex gap-1">
          {([
            { key: "brief" as const, label: "Situation", icon: Radio },
            { key: "intel" as const, label: `Intel (${situationLog.length})`, icon: Activity },
            { key: "comms" as const, label: `Comms${unreadComms > 0 ? ` (${unreadComms})` : ""}`, icon: Mail },
          ]).map(tab => (
            <button key={tab.key} onClick={() => setActivePanel(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${activePanel === tab.key ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              <tab.icon className="h-3 w-3" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Panel */}
      <div ref={logRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {activePanel === "brief" && (
          <div className="glass-card p-4 border-l-2 border-primary/40">
            <div className="flex items-center gap-2 mb-2">
              <Radio className="h-3.5 w-3.5 text-primary" />
              <span className="text-micro font-bold text-primary uppercase tracking-wider">Situation Brief</span>
            </div>
            <div className="prose prose-invert prose-sm max-w-none text-caption text-muted-foreground">
              <ReactMarkdown>{situationBrief}</ReactMarkdown>
            </div>
          </div>
        )}

        {activePanel === "intel" && (
          <div className="space-y-2">
            {situationLog.length === 0 ? (
              <p className="text-caption text-muted-foreground text-center py-8">No intel yet. Make your first decision.</p>
            ) : (
              situationLog.map((update) => (
                <motion.div key={update.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  className={`px-3 py-2.5 rounded-xl bg-surface-2 border-l-2 ${severityColors[update.severity]}`}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-micro">{typeIcons[update.type] || "📋"}</span>
                    <span className="text-micro font-semibold text-foreground">{update.title}</span>
                    {update.severity === "critical" && <AlertTriangle className="h-3 w-3 text-primary ml-auto" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground">{update.content}</p>
                  {update.from && <p className="text-[9px] text-muted-foreground mt-1">— {update.from}</p>}
                </motion.div>
              ))
            )}
          </div>
        )}

        {activePanel === "comms" && (
          <div className="space-y-2">
            {commsLog.length === 0 ? (
              <p className="text-caption text-muted-foreground text-center py-8">No communications yet.</p>
            ) : (
              commsLog.map((msg) => {
                const ChannelIcon = CHANNEL_ICONS[msg.channel] || Mail;
                return (
                  <motion.div key={msg.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    className={`px-3 py-2.5 rounded-xl bg-surface-2 ${msg.urgent ? "border border-primary/30" : "border border-transparent"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <ChannelIcon className={`h-3 w-3 ${msg.urgent ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="text-micro font-bold text-foreground">{msg.from}</span>
                      <span className="text-[9px] text-muted-foreground">{msg.role}</span>
                      {msg.urgent && <span className="text-[8px] bg-primary/15 text-primary px-1.5 py-0.5 rounded font-bold ml-auto">URGENT</span>}
                    </div>
                    {msg.subject && <p className="text-[11px] font-semibold text-foreground mb-0.5">{msg.subject}</p>}
                    <p className="text-[11px] text-muted-foreground">{msg.content}</p>
                    {msg.requiresResponse && (
                      <p className="text-[9px] text-accent-gold mt-1 font-medium">⚡ Requires your response</p>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
        )}

        {isProcessing && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/5 border border-primary/20">
            <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span className="text-caption text-primary font-medium">Processing consequences...</span>
          </div>
        )}
      </div>

      {/* Action Input */}
      <div className="px-4 pb-4 pt-2 border-t border-border bg-background/90 backdrop-blur-sm">
        <p className="text-[9px] text-muted-foreground mb-1 px-1">
          Write your decision, directive, communication, or strategic action in natural language.
        </p>
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
          <DecisionRipple className="rounded-2xl">
            <button
              onClick={handleSubmit}
              disabled={!actionText.trim() || isProcessing}
              className="absolute right-2 bottom-2 p-2 rounded-xl bg-primary text-primary-foreground disabled:opacity-30 transition-all hover:scale-105 active:scale-95"
            >
              <Send className="h-4 w-4" />
            </button>
          </DecisionRipple>
        </div>
      </div>
    </div>
  );
}
