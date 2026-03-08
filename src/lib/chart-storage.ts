import type { ChartData } from "@/components/ChartRenderer";

export interface SavedChart {
  id: string;
  chart: ChartData;
  createdAt: number;
}

const KEY = "wisdom-saved-charts";

export function loadSavedCharts(): SavedChart[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

export function saveChart(chart: ChartData): SavedChart {
  const charts = loadSavedCharts();
  const entry: SavedChart = { id: `chart-${Date.now()}`, chart, createdAt: Date.now() };
  charts.unshift(entry);
  localStorage.setItem(KEY, JSON.stringify(charts));
  return entry;
}

export function deleteChart(id: string): void {
  const charts = loadSavedCharts().filter(c => c.id !== id);
  localStorage.setItem(KEY, JSON.stringify(charts));
}

export function isChartSaved(chartJson: string): boolean {
  return loadSavedCharts().some(c => JSON.stringify(c.chart) === chartJson);
}
