import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, Radio, Activity, Send, Shield, Mail, MessageSquare, Phone, Bell, AlertTriangle, ChevronUp } from "lucide-react";
import type { ArenaScenario, SituationUpdate, CommMessage, COMPLEXITY_CONFIG } from "@/lib/mastery-arena";
import ReactMarkdown from "react-markdown";

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
  const [metricsCollapsed, setMetricsCollapsed] = useState(false);
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

  const metricItems = [
    { key: "pressure" as const, label: "PRS", color: "bg-primary", warn: true },
    { key: "resources" as const, label: "RES", color: "bg-accent-green", warn: false },
    { key: "reputation" as const, label: "REP", color: "bg-accent-gold", warn: false },
    { key: "morale" as const, label: "MRL", color: "bg-blue-400", warn: false },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Compact Top HUD — sticky */}
      <div className="px-3 pt-2 pb-1.5 border-b border-border bg-background/90 backdrop-blur-md sticky top-0 z-10">
        {/* Row 1: Status bar */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <Shield className="h-3 w-3 text-primary" />
            <span className="text-[9px] font-bold text-primary uppercase tracking-wider">{complexityConfig.label}</span>
            <span className="text-[9px] text-muted-foreground font-mono">T{turnNumber}/{maxTurns}</span>
          </div>
          <button
            onClick={() => setMetricsCollapsed(!metricsCollapsed)}
            className="p-1 rounded-md text-muted-foreground"
          >
            <ChevronUp className={`h-3 w-3 transition-transform ${metricsCollapsed ? "rotate-180" : ""}`} />
          </button>
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[11px] font-bold transition-all ${isCritical ? "bg-primary/25 text-primary animate-pulse" : isUrgent ? "bg-primary/15 text-primary" : "bg-surface-2 text-foreground"}`}>
            <Timer className="h-3 w-3" />
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Row 2: Collapsible metric bars */}
        <AnimatePresence>
          {!metricsCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-4 gap-1.5 mb-1.5">
                {metricItems.map(m => {
                  const val = metrics[m.key];
                  const isDanger = m.warn ? val > 80 : val < 25;
                  return (
                    <div key={m.key} className="space-y-0.5">
                      <div className="flex items-center justify-between">
                        <p className="text-[8px] text-muted-foreground font-bold tracking-wider">{m.label}</p>
                        <p className="text-[8px] text-muted-foreground font-mono">{val}%</p>
                      </div>
                      <div className="h-1 bg-surface-2 rounded-full overflow-hidden">
                        <motion.div className={`h-full rounded-full ${isDanger ? "bg-primary" : m.color}`}
                          animate={{ width: `${val}%` }} transition={{ duration: 0.4 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed metrics summary */}
        {metricsCollapsed && (
          <div className="flex gap-2 mb-1">
            {metricItems.map(m => {
              const val = metrics[m.key];
              const isDanger = m.warn ? val > 80 : val < 25;
              return (
                <span key={m.key} className={`text-[9px] font-mono font-bold ${isDanger ? "text-primary" : "text-muted-foreground"}`}>
                  {m.label} {val}
                </span>
              );
            })}
          </div>
        )}

        {/* Panel Tabs */}
        <div className="flex gap-0.5">
          {([
            { key: "brief" as const, label: "Brief", icon: Radio },
            { key: "intel" as const, label: `Intel${situationLog.length > 0 ? ` ${situationLog.length}` : ""}`, icon: Activity },
            { key: "comms" as const, label: `Comms${unreadComms > 0 ? ` ${unreadComms}` : ""}`, icon: Mail },
          ]).map(tab => (
            <button key={tab.key} onClick={() => setActivePanel(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${activePanel === tab.key ? "bg-primary/15 text-primary" : "text-muted-foreground active:text-foreground"}`}>
              <tab.icon className="h-3 w-3" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Panel */}
      <div ref={logRef} className="flex-1 overflow-y-auto px-3 py-2.5 space-y-2.5 overscroll-contain">
        {activePanel === "brief" && (
          <div className="glass-card p-3 border-l-2 border-primary/40">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Radio className="h-3 w-3 text-primary" />
              <span className="text-[9px] font-bold text-primary uppercase tracking-wider">Situation Brief</span>
            </div>
            <div className="prose prose-invert prose-sm max-w-none text-[12px] leading-relaxed text-muted-foreground [&_p]:mb-2 [&_p:last-child]:mb-0">
              <ReactMarkdown>{situationBrief}</ReactMarkdown>
            </div>
          </div>
        )}

        {activePanel === "intel" && (
          <div className="space-y-2">
            {situationLog.length === 0 ? (
              <p className="text-[12px] text-muted-foreground text-center py-8">No intel yet. Make your first decision.</p>
            ) : (
              situationLog.map((update) => (
                <motion.div key={update.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                  className={`px-3 py-2 rounded-xl bg-surface-2 border-l-2 ${severityColors[update.severity]}`}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px]">{typeIcons[update.type] || "📋"}</span>
                    <span className="text-[11px] font-semibold text-foreground flex-1 truncate">{update.title}</span>
                    {update.severity === "critical" && <AlertTriangle className="h-3 w-3 text-primary shrink-0" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">{update.content}</p>
                  {update.from && <p className="text-[9px] text-muted-foreground mt-0.5">— {update.from}</p>}
                </motion.div>
              ))
            )}
          </div>
        )}

        {activePanel === "comms" && (
          <div className="space-y-2">
            {commsLog.length === 0 ? (
              <p className="text-[12px] text-muted-foreground text-center py-8">No communications yet.</p>
            ) : (
              commsLog.map((msg) => {
                const ChannelIcon = CHANNEL_ICONS[msg.channel] || Mail;
                return (
                  <motion.div key={msg.id} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }}
                    className={`px-3 py-2 rounded-xl bg-surface-2 ${msg.urgent ? "border border-primary/30" : "border border-transparent"}`}>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <ChannelIcon className={`h-3 w-3 ${msg.urgent ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="text-[11px] font-bold text-foreground">{msg.from}</span>
                      <span className="text-[9px] text-muted-foreground truncate">{msg.role}</span>
                      {msg.urgent && <span className="text-[8px] bg-primary/15 text-primary px-1.5 py-0.5 rounded font-bold ml-auto shrink-0">URGENT</span>}
                    </div>
                    {msg.subject && <p className="text-[11px] font-semibold text-foreground mb-0.5 truncate">{msg.subject}</p>}
                    <p className="text-[11px] text-muted-foreground leading-snug">{msg.content}</p>
                    {msg.requiresResponse && (
                      <p className="text-[9px] text-accent-gold mt-1 font-medium">⚡ Requires response</p>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
        )}

        {isProcessing && (
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-primary/5 border border-primary/20">
            <div className="w-3.5 h-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />
            <span className="text-[12px] text-primary font-medium">Processing consequences...</span>
          </div>
        )}
      </div>

      {/* Action Input — fixed at bottom with safe area */}
      <div className="px-3 pb-safe-bottom pb-3 pt-2 border-t border-border bg-background/95 backdrop-blur-md">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={actionText}
            onChange={e => setActionText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
            placeholder={isProcessing ? "Waiting for update..." : "Your decision or directive..."}
            disabled={isProcessing}
            rows={2}
            className="w-full bg-surface-2 border border-border rounded-2xl px-3 py-2.5 pr-11 text-[13px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/40 resize-none disabled:opacity-40"
          />
          <button
            onClick={handleSubmit}
            disabled={!actionText.trim() || isProcessing}
            className="absolute right-2 bottom-2 p-2 rounded-xl bg-primary text-primary-foreground disabled:opacity-30 transition-opacity active:scale-95"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
