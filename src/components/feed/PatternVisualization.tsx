import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import type { FeedCard } from "@/lib/feed-cards";

interface Props {
  card: FeedCard;
}

export function TrendMapViz({ card }: Props) {
  const data = card.visualData?.trendData;
  if (!data?.length) return null;

  return (
    <div className="rounded-2xl bg-surface-2 border border-border p-4">
      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary mb-3">Trend Analysis</p>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
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
          <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function InfluenceWebViz({ card }: Props) {
  const connections = card.visualData?.connections;
  if (!connections?.length) return null;

  // Convert connections to radar-friendly data
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
          <Radar
            dataKey="value"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.15}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>

      {/* Connection lines */}
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
