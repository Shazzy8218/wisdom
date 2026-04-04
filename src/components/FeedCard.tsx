import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, BookmarkCheck, Share2, CheckCircle2, AlertTriangle, Zap, ChevronDown, Eye, Radio, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { FeedCard as FeedCardType } from "@/lib/feed-cards";
import { toggleSaveCard, getSavedCards, DOMAIN_ICONS } from "@/lib/feed-cards";
import OwlIcon from "@/components/OwlIcon";
import AnalyticalFlagBar from "@/components/feed/AnalyticalFlagBar";
import {
  TrendMapViz, TrajectoryViz, InfluenceWebViz, SourceComparisonViz,
  ContrastingViewsViz, RealityCompassViz, OpportunitySignalViz,
  AdaptationDirectivesViz, OperationalArchetypeViz, InterconnectionsViz,
} from "@/components/feed/PatternVisualization";
import {
  EthicalCompassViz, RichMindsetViz, ProfitPathwayViz,
  FinancialPitfallViz, LeveragePointViz, ROIBadge, WealthDomainBadge,
} from "@/components/feed/WealthVisualization";
import DecisionProtocols from "@/components/feed/DecisionProtocols";

interface Props {
  card: FeedCardType;
  onComplete: (id: string, xp: number, tokens: number) => void;
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  "quick-fact": { label: "QUICK FACT", color: "text-accent-foreground bg-accent/20" },
  "micro-lesson": { label: "MICRO-LESSON", color: "text-primary" },
  "news": { label: "EVERGREEN", color: "text-accent-foreground" },
  "challenge": { label: "CHALLENGE", color: "text-primary" },
  "myth-vs-truth": { label: "MYTH VS TRUTH", color: "text-destructive" },
  "video": { label: "VIDEO", color: "text-accent-foreground" },
  "key-insight": { label: "KEY INSIGHT", color: "text-primary bg-primary/10" },
  "reality-check": { label: "REALITY CHECK", color: "text-amber-400 bg-amber-400/10" },
  "source-comparison": { label: "SOURCE ANALYSIS", color: "text-blue-400 bg-blue-400/10" },
  "deep-pattern": { label: "DEEP PATTERN", color: "text-purple-400 bg-purple-400/10" },
  "phenomenon-brief": { label: "PHENOMENON BRIEF", color: "text-cyan-400 bg-cyan-400/10" },
  "systemic-context": { label: "SYSTEMIC CONTEXT", color: "text-amber-400 bg-amber-400/10" },
  "strategic-impact": { label: "STRATEGIC IMPACT", color: "text-red-400 bg-red-400/10" },
  "opportunity-watch": { label: "OPPORTUNITY WATCH", color: "text-accent-green bg-accent-green/10" },
  "reality-compass": { label: "REALITY COMPASS", color: "text-purple-400 bg-purple-400/10" },
  // Domain Leverage Engine types
  "money-momentum": { label: "MONEY MOMENTUM", color: "text-accent-green bg-accent-green/10" },
  "leverage-point": { label: "LEVERAGE POINT", color: "text-accent-gold bg-accent-gold/10" },
  "profit-pathway": { label: "PROFIT PATHWAY", color: "text-accent-green bg-accent-green/10" },
  "rich-mindset": { label: "RICH MINDSET", color: "text-primary bg-primary/10" },
  "ethical-compass": { label: "ETHICAL COMPASS", color: "text-amber-400 bg-amber-400/10" },
  "pitfall-alert": { label: "PITFALL ALERT", color: "text-destructive bg-destructive/10" },
};

const URGENCY_BADGES: Record<string, { label: string; color: string }> = {
  monitor: { label: "MONITOR", color: "text-muted-foreground bg-muted" },
  alert: { label: "ALERT", color: "text-amber-400 bg-amber-400/10" },
  critical: { label: "CRITICAL", color: "text-destructive bg-destructive/10" },
};

function isPhenomenonCard(type: string): boolean {
  return ["phenomenon-brief", "systemic-context", "strategic-impact", "opportunity-watch", "reality-compass"].includes(type);
}

function isDLECard(type: string): boolean {
  return ["money-momentum", "leverage-point", "profit-pathway", "rich-mindset", "ethical-compass", "pitfall-alert"].includes(type);
}

function VisualBlock({ card }: { card: FeedCardType }) {
  if (card.visual === "trajectory") return <TrajectoryViz card={card} />;
  if (card.visual === "trend-map") return <TrendMapViz card={card} />;
  if (card.visual === "influence-web") return <InfluenceWebViz card={card} />;

  if (card.type === "reality-compass" && card.realityCompass) return <RealityCompassViz card={card} />;
  if (card.type === "source-comparison" && card.sourceStreams?.length) return <SourceComparisonViz card={card} />;
  if (card.type === "reality-check" && card.contrastingViews) return <ContrastingViewsViz card={card} />;

  if (card.type === "myth-vs-truth") {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
          <p className="text-micro font-bold uppercase tracking-widest text-destructive mb-1">❌ MYTH</p>
          <p className="text-body text-foreground">{card.mythStatement}</p>
        </div>
        <div className="rounded-2xl border border-accent-green/30 bg-accent-green/10 p-4">
          <p className="text-micro font-bold uppercase tracking-widest text-accent-green mb-1">✅ TRUTH</p>
          <p className="text-body text-foreground">{card.truthStatement}</p>
        </div>
      </div>
    );
  }

  if (card.visual === "compare" && card.visualData?.before && card.visualData?.after) {
    return (
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-destructive/10 border border-destructive/20 p-3">
          <p className="text-micro font-bold text-destructive mb-1">BEFORE</p>
          <p className="text-caption text-muted-foreground leading-relaxed">{card.visualData.before}</p>
        </div>
        <div className="rounded-2xl bg-accent-green/10 border border-accent-green/20 p-3">
          <p className="text-micro font-bold text-accent-green mb-1">AFTER</p>
          <p className="text-caption text-muted-foreground leading-relaxed">{card.visualData.after}</p>
        </div>
      </div>
    );
  }

  if (card.visual === "diagram" && card.visualData?.labels) {
    return (
      <div className="rounded-2xl bg-surface-2 border border-border p-4">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {card.visualData.labels.map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="rounded-xl bg-primary/15 border border-primary/20 px-3 py-1.5 text-caption font-medium text-primary">
                {label}
              </span>
              {i < card.visualData!.labels!.length - 1 && !label.includes("→") && !label.includes("←") && (
                <span className="text-muted-foreground text-caption">→</span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (card.visual === "steps" && card.visualData?.steps) {
    return (
      <div className="rounded-2xl bg-surface-2 border border-border p-4 space-y-2">
        {card.visualData.steps.map((step, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-micro font-bold text-primary">{i + 1}</span>
            <p className="text-caption text-muted-foreground leading-relaxed">{step}</p>
          </div>
        ))}
      </div>
    );
  }

  if (card.visual === "chart" && card.visualData?.labels) {
    return (
      <div className="rounded-2xl bg-surface-2 border border-border p-4 flex gap-2 justify-center flex-wrap">
        {card.visualData.labels.map((label, i) => (
          <span key={i} className="rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-micro font-medium text-primary">
            {label}
          </span>
        ))}
      </div>
    );
  }

  if (card.visual === "infographic" && card.visualData?.labels) {
    return (
      <div className="rounded-2xl bg-surface-2 border border-border p-4 space-y-2">
        {card.visualData.labels.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <Zap className="h-3 w-3 text-accent-gold flex-shrink-0" />
            <p className="text-caption text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
    );
  }

  return null;
}

export default function FeedCard({ card, onComplete }: Props) {
  const [revealed, setRevealed] = useState(card.interaction !== "tap-reveal");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [completed, setCompleted] = useState(false);
  const [saved, setSaved] = useState(() => getSavedCards().includes(card.id));
  const navigate = useNavigate();

  const typeInfo = TYPE_LABELS[card.type] || TYPE_LABELS["quick-fact"];
  const isPhenomenon = isPhenomenonCard(card.type);
  const isDLE = isDLECard(card.type);
  const urgency = card.urgencyLevel ? URGENCY_BADGES[card.urgencyLevel] : null;

  const handleOptionSelect = (idx: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(idx);
    if (idx === card.correctAnswer) {
      setTimeout(() => { setCompleted(true); onComplete(card.id, card.xp, card.tokens); }, 500);
    }
  };

  const handleReveal = () => {
    setRevealed(true);
    if (!card.interaction || card.interaction === "tap-reveal") {
      setTimeout(() => { setCompleted(true); onComplete(card.id, card.xp, card.tokens); }, 800);
    }
  };

  const handleSave = () => { const nowSaved = toggleSaveCard(card.id); setSaved(nowSaved); };

  const handleAskAI = () => {
    const q = encodeURIComponent(`Analyze this phenomenon deeper: ${card.title}. Context: ${card.content}`);
    navigate(`/chat?context=${q}`);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: card.title, text: card.shareSnippet, url: window.location.origin });
    } else {
      navigator.clipboard.writeText(card.shareSnippet);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] snap-start flex flex-col justify-center px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.4 }}
        className={`glass-card overflow-hidden film-grain max-w-lg mx-auto w-full ${isPhenomenon ? "border-primary/10" : ""} ${isDLE ? "border-accent-green/10" : ""}`}
      >
        {/* Header */}
        <div className="p-5 pb-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Domain icon for phenomenon / DLE cards */}
              {isPhenomenon && card.phenomenonDomain && (
                <span className="text-sm">{DOMAIN_ICONS[card.phenomenonDomain] || "📡"}</span>
              )}
              {isDLE && card.wealthDomain && <WealthDomainBadge card={card} />}
              <span className={`text-[9px] font-black uppercase tracking-[0.3em] rounded-md px-1.5 py-0.5 ${typeInfo.color}`}>
                {typeInfo.label}
              </span>
              {!isPhenomenon && !isDLE && (
                <>
                  <span className="text-text-tertiary text-[9px]">·</span>
                  <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{card.difficulty}</span>
                </>
              )}
              {/* ROI badge for DLE cards */}
              {isDLE && card.roiPotential && <ROIBadge card={card} />}
              {/* Urgency badge */}
              {urgency && (
                <span className={`text-[8px] font-black uppercase tracking-[0.15em] rounded-md px-1.5 py-0.5 flex items-center gap-1 ${urgency.color}`}>
                  <Radio className="h-2.5 w-2.5" />
                  {urgency.label}
                </span>
              )}
              {/* AI flags */}
              {card.analyticalFlags?.map(flag => (
                <span key={flag} className="text-[8px] font-semibold rounded-md bg-surface-2 border border-border px-1.5 py-0.5 text-muted-foreground">
                  {flag.replace(/-/g, " ")}
                </span>
              ))}
            </div>
            {card.confidence !== undefined && (
              <span className="text-[9px] font-semibold text-accent-gold flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> {card.confidence}%
              </span>
            )}
          </div>

          <h2 className="font-display text-xl font-bold text-foreground leading-tight mb-2">{card.title}</h2>
          <p className="text-body text-muted-foreground">{card.hook}</p>
        </div>

        <div className="editorial-divider mx-5" />

        {/* Visual section */}
        <div className="p-5">
          <VisualBlock card={card} />
        </div>

        {/* Content body */}
        <div className="px-5 pb-4">
          {card.interaction === "tap-reveal" && !revealed ? (
            <button onClick={handleReveal}
              className="w-full rounded-2xl bg-surface-2 border border-border p-4 text-center text-body font-medium text-muted-foreground hover:border-primary/30 transition-all flex items-center justify-center gap-2">
              <ChevronDown className="h-4 w-4 text-primary" /> Tap to decode
            </button>
          ) : (
            <AnimatePresence>
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-4">
                <p className="text-body leading-relaxed text-muted-foreground whitespace-pre-line">{card.content}</p>

                {/* Systemic Context Layer */}
                {card.systemicContext && (
                  <div className="rounded-xl border border-cyan-500/15 bg-cyan-500/5 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Shield className="h-3 w-3 text-cyan-400" />
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-400">Systemic Context</p>
                    </div>
                    <p className="text-caption text-muted-foreground leading-relaxed">{card.systemicContext}</p>
                  </div>
                )}

                {/* Strategic Impact Projection */}
                {card.strategicImpactProjection && (
                  <div className="rounded-xl border border-primary/15 bg-primary/5 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Eye className="h-3 w-3 text-primary" />
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Strategic Impact</p>
                    </div>
                    <p className="text-caption text-muted-foreground leading-relaxed">{card.strategicImpactProjection}</p>
                  </div>
                )}

                {/* Opportunity Signal */}
                <OpportunitySignalViz card={card} />

                {/* Interconnections & Drivers */}
                <InterconnectionsViz card={card} />

                {/* Operational Archetype */}
                <OperationalArchetypeViz card={card} />

                {/* Adaptation Directives */}
                <AdaptationDirectivesViz card={card} />

                {/* Domain Leverage Engine blocks */}
                <RichMindsetViz card={card} />
                <LeveragePointViz card={card} />
                <ProfitPathwayViz card={card} />
                <FinancialPitfallViz card={card} />
                <EthicalCompassViz card={card} />

                {/* Legacy impact analysis */}
                {card.impactAnalysis && !card.strategicImpactProjection && (
                  <div className="rounded-xl border border-primary/15 bg-primary/5 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Eye className="h-3 w-3 text-primary" />
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Impact on Your Decision-Making</p>
                    </div>
                    <p className="text-caption text-muted-foreground leading-relaxed">{card.impactAnalysis}</p>
                  </div>
                )}

                {/* Choice interaction */}
                {card.interaction === "choice" && card.options && (
                  <div className="space-y-2">
                    {card.options.map((opt, idx) => (
                      <button key={idx} onClick={() => handleOptionSelect(idx)}
                        disabled={selectedOption !== null}
                        className={`w-full rounded-xl border p-3 text-left text-caption transition-all duration-200 ${
                          selectedOption === null
                            ? "border-border bg-surface-2 hover:border-primary/30"
                            : selectedOption === idx
                              ? idx === card.correctAnswer
                                ? "border-accent-green/50 bg-accent-green/10 text-foreground"
                                : "border-destructive/50 bg-destructive/10"
                              : idx === card.correctAnswer
                                ? "border-accent-green/50 bg-accent-green/10"
                                : "border-border bg-surface-2 opacity-30"
                        }`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {/* Source */}
                {card.source && (
                  <p className="text-[10px] text-text-tertiary italic">📎 {card.source} • Always verify independently</p>
                )}

                {/* Decision protocols */}
                {card.decisionProtocols && <DecisionProtocols protocols={card.decisionProtocols} />}
                {card.profitProtocols && <DecisionProtocols protocols={card.profitProtocols} />}

                {/* Try it prompt */}
                {card.tryPrompt && (
                  <div className="rounded-xl border border-primary/15 bg-primary/5 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Try It Now</p>
                    <p className="text-caption text-muted-foreground">{card.tryPrompt}</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        <div className="editorial-divider mx-5" />

        {/* Actions bar */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-caption text-muted-foreground">✦ +{card.tokens}</span>
            <span className="text-caption text-text-tertiary">+{card.xp} XP</span>
            {completed && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                <CheckCircle2 className="h-4 w-4 text-accent-green" />
              </motion.div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={handleAskAI} className="rounded-lg p-2 text-primary hover:bg-primary/10 transition-colors flex items-center gap-1">
              <OwlIcon size={16} /><span className="text-[10px] font-semibold">Decode</span>
            </button>
            <AnalyticalFlagBar cardId={card.id} />
            <button onClick={handleSave} className="rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors">
              {saved ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4" />}
            </button>
            <button onClick={handleShare} className="rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors">
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
