import { useState, useEffect } from "react";

export interface ClockData {
  greeting: string;
  dateStr: string;
  timeStr: string;
  dayProgress: number; // 0-100
}

function getGreeting(hour: number): string {
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 22) return "Good evening";
  return "Late night";
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function getDayProgress(d: Date): number {
  const mins = d.getHours() * 60 + d.getMinutes();
  return Math.round((mins / 1440) * 100);
}

function compute(): ClockData {
  const now = new Date();
  return {
    greeting: getGreeting(now.getHours()),
    dateStr: formatDate(now),
    timeStr: formatTime(now),
    dayProgress: getDayProgress(now),
  };
}

export function useLiveClock() {
  const [clock, setClock] = useState<ClockData>(compute);

  useEffect(() => {
    const id = setInterval(() => setClock(compute()), 30_000);
    return () => clearInterval(id);
  }, []);

  return clock;
}
