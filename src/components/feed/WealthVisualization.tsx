import { TrendingUp, AlertTriangle, Scale, DollarSign, BookOpen } from "lucide-react";
import type { FeedCard } from "@/lib/feed-cards";
import { DOMAIN_ICONS } from "@/lib/feed-cards";

const TRADITION_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  jewish: { label: "Jewish Business Ethics", icon: "✡️", color: "text-blue-400 border-blue-500/20 bg-blue-500/5" },
  islamic: { label: "Islamic Finance", icon: "☪️", color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" },
  stoic: { label: "Stoic Ethics", icon: "🏛️", color: "text-amber-400 border-amber-500/20 bg-amber-500/5" },
  utilitarian: { label: "Utilitarian", icon: "⚖️", color: "text-cyan-400 border-cyan-500/20 bg-cyan-500/5" },
  virtue: { label: "Virtue Ethics", icon: "🌟", color: "text-purple-400 border-purple-500/20 bg-purple-500/5" },
  esg: { label: "ESG Principles", icon: "🌱", color: "text-accent-green border-accent-green/20 bg-accent-green/5" },
};

export function EthicalCompassViz({ card }: { card: FeedCard }) {
  if (!card.ethicalFrameworks?.length) return null;

  return (
    <div className="rounded-xl border border-accent-gold/15 bg-accent-gold/5 p-3 space-y-2">
      <div className="flex items-center gap-1.5">
        <Scale className="h-3.5 w-3.5 text-accent-gold" />
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-accent-gold">Ethical Compass</p>
      </div>
      {card.ethicalFrameworks.map((ef, i) => {
        const meta = TRADITION_LABELS[ef.tradition] || TRADITION_LABELS.virtue;
        return (
          <div key={i} className={`rounded-lg border p-2.5 ${meta.color}`}>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px]">{meta.icon}</span>
              <p className="text-[9px] font-bold uppercase tracking-[0.15em]">{meta.label}</p>
            </div>
            <p className="text-[10px] font-semibold text-foreground mb-0.5">{ef.principle}</p>
            <p className="text-caption text-muted-foreground leading-relaxed">{ef.application}</p>
          </div>
        );
      })}
    </div>
  );
}

export function RichMindsetViz({ card }: { card: FeedCard }) {
  if (!card.richMindsetContrast) return null;

  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[10px]">🐑</span>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-destructive">Common Belief</p>
        </div>
        <p className="text-caption text-muted-foreground leading-relaxed">{card.richMindsetContrast.commonBelief}</p>
      </div>
      <div className="rounded-xl border border-accent-green/20 bg-accent-green/5 p-3">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[10px]">🦅</span>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-accent-green">Wealth Builder</p>
        </div>
        <p className="text-caption text-muted-foreground leading-relaxed">{card.richMindsetContrast.wealthBuilder}</p>
      </div>
    </div>
  );
}

export function ProfitPathwayViz({ card }: { card: FeedCard }) {
  if (!card.profitPathway) return null;

  return (
    <div className="rounded-xl border border-accent-green/15 bg-accent-green/5 p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <TrendingUp className="h-3.5 w-3.5 text-accent-green" />
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-accent-green">Profit Pathway</p>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-start gap-2">
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider flex-shrink-0 mt-0.5">If:</span>
          <p className="text-caption text-foreground">{card.profitPathway.scenario}</p>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-[9px] font-bold text-accent-green uppercase tracking-wider flex-shrink-0 mt-0.5">Then:</span>
          <p className="text-caption text-foreground font-semibold">{card.profitPathway.potentialOutcome}</p>
        </div>
        <p className="text-[9px] text-muted-foreground">⏱ {card.profitPathway.timeframe}</p>
      </div>
    </div>
  );
}

export function FinancialPitfallViz({ card }: { card: FeedCard }) {
  if (!card.financialPitfall) return null;

  return (
    <div className="rounded-xl border border-destructive/15 bg-destructive/5 p-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-destructive">Financial Pitfall</p>
      </div>
      <p className="text-caption font-semibold text-foreground mb-0.5">{card.financialPitfall.name}</p>
      <p className="text-caption text-muted-foreground leading-relaxed mb-2">{card.financialPitfall.description}</p>
      <div className="rounded-lg bg-accent-green/5 border border-accent-green/15 p-2">
        <p className="text-[9px] font-bold uppercase tracking-widest text-accent-green mb-0.5">Avoidance Strategy</p>
        <p className="text-caption text-muted-foreground leading-relaxed">{card.financialPitfall.avoidanceStrategy}</p>
      </div>
    </div>
  );
}

export function LeveragePointViz({ card }: { card: FeedCard }) {
  if (!card.leveragePoint) return null;

  return (
    <div className="rounded-xl border border-primary/15 bg-primary/5 p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <DollarSign className="h-3.5 w-3.5 text-primary" />
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Leverage Point</p>
      </div>
      <p className="text-caption text-muted-foreground leading-relaxed">{card.leveragePoint}</p>
    </div>
  );
}

export function ROIBadge({ card }: { card: FeedCard }) {
  if (!card.roiPotential) return null;

  const colors: Record<string, string> = {
    low: "text-muted-foreground bg-muted",
    medium: "text-amber-400 bg-amber-400/10",
    high: "text-accent-green bg-accent-green/10",
    extreme: "text-primary bg-primary/10",
  };

  return (
    <span className={`text-[8px] font-black uppercase tracking-[0.15em] rounded-md px-1.5 py-0.5 ${colors[card.roiPotential] || colors.medium}`}>
      {card.roiPotential} ROI
    </span>
  );
}

export function WealthDomainBadge({ card }: { card: FeedCard }) {
  if (!card.wealthDomain) return null;
  const icon = DOMAIN_ICONS[card.wealthDomain] || "💰";

  return (
    <span className="text-sm">{icon}</span>
  );
}
