import { useEffect, useRef, useState } from "react";

interface CountUpNumberProps {
  value: number;
  duration?: number;
  suffix?: string;
  className?: string;
}

/**
 * Animates a number counting up from previous value to new value.
 * Used for progress metrics, mastery scores, streaks.
 */
export default function CountUpNumber({ value, duration = 600, suffix = "", className = "" }: CountUpNumberProps) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const rafRef = useRef<number>();

  useEffect(() => {
    const from = prevRef.current;
    const to = value;
    if (from === to) return;

    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        prevRef.current = to;
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value, duration]);

  return <span className={className}>{display}{suffix}</span>;
}
