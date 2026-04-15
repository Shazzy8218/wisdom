import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface RipplePoint {
  id: number;
  x: number;
  y: number;
}

/**
 * Wraps children and triggers a radial ripple effect on click/action.
 * Used in Arena HUD for decision impact visualization.
 */
export default function DecisionRipple({
  children,
  className = "",
  color = "hsl(var(--primary))",
  onRipple,
}: {
  children: React.ReactNode;
  className?: string;
  color?: string;
  onRipple?: () => void;
}) {
  const [ripples, setRipples] = useState<RipplePoint[]>([]);

  const trigger = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const id = Date.now();
    setRipples(prev => [...prev, { id, x, y }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 700);
    onRipple?.();
  }, [onRipple]);

  return (
    <div className={`relative overflow-hidden ${className}`} onClick={trigger}>
      {children}
      <AnimatePresence>
        {ripples.map(r => (
          <motion.div
            key={r.id}
            initial={{ scale: 0, opacity: 0.6 }}
            animate={{ scale: 3, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="absolute pointer-events-none rounded-full"
            style={{
              left: `${r.x}%`,
              top: `${r.y}%`,
              width: 80,
              height: 80,
              marginLeft: -40,
              marginTop: -40,
              background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
