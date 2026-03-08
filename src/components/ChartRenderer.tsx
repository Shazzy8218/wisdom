import { useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Bookmark } from "lucide-react";

export interface ChartData {
  type: "line" | "bar" | "pie";
  title: string;
  xLabel?: string;
  yLabel?: string;
  series: { name: string; data: { x: string; y: number }[] }[];
}

const COLORS = [
  "hsl(36, 90%, 55%)", // gold
  "hsl(200, 80%, 55%)", // blue
  "hsl(150, 70%, 50%)", // green
  "hsl(340, 75%, 55%)", // pink
  "hsl(270, 60%, 60%)", // purple
  "hsl(25, 85%, 55%)",  // orange
];

interface Props {
  data: ChartData;
  onSave?: () => void;
  saved?: boolean;
}

export default function ChartRenderer({ data, onSave, saved }: Props) {
  const chartData = useMemo(() => {
    if (!data.series?.length) return [];
    if (data.type === "pie") {
      return data.series[0]?.data.map(d => ({ name: d.x, value: d.y })) || [];
    }
    // Merge all series into rows keyed by x
    const xSet = new Set<string>();
    data.series.forEach(s => s.data.forEach(d => xSet.add(d.x)));
    const rows: Record<string, any>[] = [];
    xSet.forEach(x => {
      const row: Record<string, any> = { x };
      data.series.forEach(s => {
        const point = s.data.find(d => d.x === x);
        row[s.name] = point?.y ?? 0;
      });
      rows.push(row);
    });
    return rows;
  }, [data]);

  if (!data || !data.series?.length) return null;

  return (
    <div className="my-3 rounded-2xl bg-surface-2 border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-body font-semibold text-foreground">{data.title}</h4>
        {onSave && (
          <button onClick={onSave}
            className={`flex items-center gap-1 rounded-lg px-2 py-1 text-micro font-medium transition-colors ${
              saved ? "text-accent-gold" : "text-muted-foreground hover:text-primary"
            }`}>
            <Bookmark className="h-3 w-3" /> {saved ? "Saved" : "Save"}
          </button>
        )}
      </div>
      <ResponsiveContainer width="100%" height={220}>
        {data.type === "line" ? (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,20%)" />
            <XAxis dataKey="x" tick={{ fontSize: 10, fill: "hsl(0,0%,55%)" }} label={data.xLabel ? { value: data.xLabel, position: "insideBottom", offset: -5, fontSize: 10, fill: "hsl(0,0%,55%)" } : undefined} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(0,0%,55%)" }} label={data.yLabel ? { value: data.yLabel, angle: -90, position: "insideLeft", fontSize: 10, fill: "hsl(0,0%,55%)" } : undefined} />
            <Tooltip contentStyle={{ background: "hsl(0,0%,10%)", border: "1px solid hsl(0,0%,20%)", borderRadius: 12, fontSize: 12, color: "hsl(0,0%,85%)" }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {data.series.map((s, i) => (
              <Line key={s.name} type="monotone" dataKey={s.name} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 3 }} />
            ))}
          </LineChart>
        ) : data.type === "bar" ? (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,20%)" />
            <XAxis dataKey="x" tick={{ fontSize: 10, fill: "hsl(0,0%,55%)" }} label={data.xLabel ? { value: data.xLabel, position: "insideBottom", offset: -5, fontSize: 10, fill: "hsl(0,0%,55%)" } : undefined} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(0,0%,55%)" }} label={data.yLabel ? { value: data.yLabel, angle: -90, position: "insideLeft", fontSize: 10, fill: "hsl(0,0%,55%)" } : undefined} />
            <Tooltip contentStyle={{ background: "hsl(0,0%,10%)", border: "1px solid hsl(0,0%,20%)", borderRadius: 12, fontSize: 12, color: "hsl(0,0%,85%)" }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {data.series.map((s, i) => (
              <Bar key={s.name} dataKey={s.name} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        ) : (
          <PieChart>
            <Pie data={chartData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
              {chartData.map((_: any, i: number) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ background: "hsl(0,0%,10%)", border: "1px solid hsl(0,0%,20%)", borderRadius: 12, fontSize: 12, color: "hsl(0,0%,85%)" }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
