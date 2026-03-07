import { motion } from "framer-motion";

interface StatBlockProps {
  label: string;
  value: string | number;
  icon?: string;
  accent?: boolean;
  delay?: number;
}

export default function StatBlock({ label, value, icon, accent, delay = 0 }: StatBlockProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`glass-card p-4 flex flex-col gap-1 ${accent ? "glow-red border-primary/20" : ""}`}
    >
      {icon && <span className="text-lg">{icon}</span>}
      <span className="stat-number text-foreground">{value}</span>
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
    </motion.div>
  );
}
