import { motion } from "framer-motion";
import MasteryRadar from "@/components/MasteryRadar";

export default function MasteryChart() {
  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 pt-12 pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-1">Mastery Chart</p>
        <h1 className="font-display text-2xl font-bold text-foreground">Your Knowledge Map</h1>
        <p className="text-sm text-muted-foreground mt-1">Track mastery across 22 categories.</p>
      </div>

      <div className="px-5">
        <MasteryRadar />
      </div>
    </div>
  );
}
