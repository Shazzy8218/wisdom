import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, XAxis, YAxis, Tooltip, ComposedChart, Line, Area } from "recharts";
import { AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { FeedCard } from "@/lib/feed-cards";

interface Props {
  card: FeedCard;
}

export function TrendMapViz({ card }: Props) {
  const data = card.visualData?.trendData;
  if (!data?.length) return null;

  return (
    <div className="rounded-2xl bg-surface-2 border border-border p-4">
      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary mb-3">Trend Velocity</p>
      <ResponsiveContainer width="100%" height={160}>
        <ComposedChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--surface-2))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 12,
              fontSize: 11,
            }}
          />
          <Area dataKey="value" fill="url(#trendGrad)" stroke="none" />
          <Line dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 3 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TrajectoryViz({ card }: Props) {
  const data = card.visualData?.trajectoryData;
  if (!data?.length) return null;

  return (
    <div className="rounded-2xl bg-surface-2 border border-border p-4">
      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary mb-3">Trajectory Projection</p>
      <div className="space-y-3">
        {data.map((item, i) => {
          const delta = item.projected - item.current;
          const isUp = delta > 0;
          const Icon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
          const barColor = isUp ? "bg-accent-green" : "bg-destructive";
          const projectedColor = isUp ? "bg-accent-green/30" : "bg-destructive/30";

          return (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-foreground">{item.label}</span>
                <div className="flex items-center gap-1.5">
                  <Icon className={`h-3 w-3 ${isUp ? "text-accent-green" : "text-destructive"}`} />
                  <span className={`text-[10px] font-bold ${isUp ? "text-accent-green" : "text-destructive"}`}>
                    {isUp ? "+" : ""}{delta}%
                  </span>
                </div>
              </div>
              <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                <div className={`absolute inset-y-0 left-0 rounded-full ${barColor} transition-all`} style={{ width: `${item.current}%` }} />
                <div className={`absolute inset-y-0 rounded-full ${projectedColor} border-r-2 ${isUp ? "border-accent-green" : "border-destructive"}`} style={{ left: `${Math.min(item.current, item.projected)}%`, width: `${Math.abs(delta)}%` }} />
              </div>
              <div className="flex justify-between text-[8px] text-muted-foreground">
                <span>Current: {item.current}%</span>
                <span>Projected: {item.projected}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function InfluenceWebViz({ card }: Props) {
  const connections = card.visualData?.connections;
  if (!connections?.length) return null;

  const nodes = new Set<string>();
  connections.forEach(c => { nodes.add(c.from); nodes.add(c.to); });
  const radarData = Array.from(nodes).map(node => {
    const strength = connections
      .filter(c => c.from === node || c.to === node)
      .reduce((sum, c) => sum + c.strength, 0);
    return { subject: node, value: Math.min(strength, 100) };
  });

  return (
    <div className="rounded-2xl bg-surface-2 border border-border p-4">
      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary mb-3">Influence Web</p>
      <ResponsiveContainer width="100%" height={180}>
        <RadarChart data={radarData}>
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
          <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} strokeWidth={2} />
        </RadarChart>
      </ResponsiveContainer>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {connections.map((c, i) => (
          <span key={i} className="text-[9px] text-muted-foreground bg-surface-hover rounded-full px-2 py-0.5">
            {c.from} → {c.to}
          </span>
        ))}
      </div>
    </div>
  );
}

export function SourceComparisonViz({ card }: Props) {
  if (!card.sourceStreams?.length) return null;

  return (
    <div className="rounded-2xl bg-surface-2 border border-border p-4 space-y-2">
      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary mb-1">Source Stream Comparison</p>
      {card.sourceStreams.map((s, i) => (
        <div key={i} className="rounded-xl bg-background/50 border border-border/50 p-3">
          <p className="text-[10px] font-bold text-foreground mb-0.5">{s.name}</p>
          <p className="text-caption text-muted-foreground leading-relaxed">{s.perspective}</p>
        </div>
      ))}
    </div>
  );
}

export function ContrastingViewsViz({ card }: Props) {
  if (!card.contrastingViews) return null;

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-2xl bg-blue-500/5 border border-blue-500/15 p-3">
        <p className="text-[9px] font-bold uppercase tracking-widest text-blue-400 mb-1">View A</p>
        <p className="text-caption text-muted-foreground leading-relaxed">{card.contrastingViews.viewA}</p>
      </div>
      <div className="rounded-2xl bg-amber-500/5 border border-amber-500/15 p-3">
        <p className="text-[9px] font-bold uppercase tracking-widest text-amber-400 mb-1">View B</p>
        <p className="text-caption text-muted-foreground leading-relaxed">{card.contrastingViews.viewB}</p>
      </div>
    </div>
  );
}

export function RealityCompassViz({ card }: Props) {
  if (!card.realityCompass) return null;

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-muted-foreground/20 bg-muted/30 p-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-[10px]">📺</span>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Dominant Narrative</p>
        </div>
        <p className="text-caption text-muted-foreground leading-relaxed">{card.realityCompass.dominant}</p>
      </div>
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-[10px]">🎯</span>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Data-Driven Alternative</p>
        </div>
        <p className="text-caption text-foreground/80 leading-relaxed">{card.realityCompass.alternative}</p>
      </div>
    </div>
  );
}

export function OpportunitySignalViz({ card }: Props) {
  if (!card.opportunitySignal) return null;
  const isErosion = card.opportunitySignal.type === "erosion";

  return (
    <div className={`rounded-xl border p-3 ${isErosion ? "border-destructive/20 bg-destructive/5" : "border-accent-green/20 bg-accent-green/5"}`}>
      <div className="flex items-center gap-1.5 mb-1">
        {isErosion ? <TrendingDown className="h-3.5 w-3.5 text-destructive" /> : <TrendingUp className="h-3.5 w-3.5 text-accent-green" />}
        <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${isErosion ? "text-destructive" : "text-accent-green"}`}>
          Opportunity {isErosion ? "Erosion" : "Amplification"}
        </p>
      </div>
      <p className="text-caption text-muted-foreground leading-relaxed">{card.opportunitySignal.description}</p>
    </div>
  );
}

export function AdaptationDirectivesViz({ card }: Props) {
  if (!card.adaptationDirectives?.length) return null;

  const urgencyColors: Record<string, string> = {
    low: "bg-muted text-muted-foreground",
    medium: "bg-accent-gold/15 text-accent-gold",
    high: "bg-primary/15 text-primary",
    critical: "bg-destructive/15 text-destructive",
  };

  return (
    <div className="rounded-xl border border-primary/15 bg-primary/5 p-3 space-y-2">
      <div className="flex items-center gap-1.5">
        <AlertTriangle className="h-3.5 w-3.5 text-primary" />
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Adaptation Directives</p>
      </div>
      {card.adaptationDirectives.map((d, i) => (
        <div key={i} className="flex items-start gap-2">
          <span className={`flex-shrink-0 rounded-md px-1.5 py-0.5 text-[8px] font-bold uppercase ${urgencyColors[d.urgency] || urgencyColors.low}`}>
            {d.urgency}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-caption text-muted-foreground leading-relaxed">{d.directive}</p>
            <span className="text-[9px] text-muted-foreground/60">{d.domain}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function OperationalArchetypeViz({ card }: Props) {
  if (!card.operationalArchetype) return null;

  return (
    <div className="rounded-xl border border-purple-500/15 bg-purple-500/5 p-3">
      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-purple-400 mb-1">Operational Archetype</p>
      <p className="text-caption font-semibold text-foreground">{card.operationalArchetype.name}</p>
      <p className="text-caption text-muted-foreground leading-relaxed mt-0.5">{card.operationalArchetype.description}</p>
      {card.operationalArchetype.historicalExample && (
        <p className="text-[10px] text-muted-foreground/70 mt-1.5 italic">
          📌 {card.operationalArchetype.historicalExample}
        </p>
      )}
    </div>
  );
}

export function InterconnectionsViz({ card }: Props) {
  if (!card.interconnections?.length && !card.underlyingDrivers?.length) return null;

  return (
    <div className="rounded-xl border border-border bg-surface-2 p-3 space-y-2">
      {card.interconnections?.length ? (
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-400 mb-1.5">Interconnections</p>
          <div className="flex flex-wrap gap-1.5">
            {card.interconnections.map((item, i) => (
              <span key={i} className="text-[9px] text-muted-foreground bg-cyan-500/5 border border-cyan-500/10 rounded-full px-2 py-0.5">
                {item}
              </span>
            ))}
          </div>
        </div>
      ) : null}
      {card.underlyingDrivers?.length ? (
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-400 mb-1.5">Underlying Drivers</p>
          <div className="flex flex-wrap gap-1.5">
            {card.underlyingDrivers.map((item, i) => (
              <span key={i} className="text-[9px] text-muted-foreground bg-amber-500/5 border border-amber-500/10 rounded-full px-2 py-0.5">
                {item}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
