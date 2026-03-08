import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useState } from "react";

interface StatBlockProps {
  label: string;
  value: string | number;
  icon?: string;
  accent?: boolean;
  delay?: number;
}

function AnimatedNumber({ value, delay = 0 }: { value: number; delay: number }) {
  const [display, setDisplay] = useState(value);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (!hasAnimated) {
      // First render: show value immediately (no fake "start from 0")
      setDisplay(value);
      setHasAnimated(true);
      return;
    }
    // Subsequent updates: animate from previous to new value
    const prev = display;
    if (prev === value) return;
    const duration = 600;
    const start = performance.now();
    let raf: number;
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(prev + (value - prev) * eased));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <>{display}</>;
}

export default function StatBlock({ label, value, icon, accent, delay = 0 }: StatBlockProps) {
  const isNumber = typeof value === "number";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`glass-card p-5 flex flex-col gap-2 ${accent ? "glow-red border-primary/20" : ""}`}
    >
      {icon && <span className="text-base opacity-60">{icon}</span>}
      <span className="hero-number text-foreground">
        {isNumber ? <AnimatedNumber value={value} delay={delay} /> : value}
      </span>
      <span className="section-label">{label}</span>
    </motion.div>
  );
}
