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
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const duration = 1200;
      const start = performance.now();
      const step = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(Math.round(eased * value));
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, delay * 1000);
    return () => clearTimeout(timeout);
  }, [value, delay]);

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
