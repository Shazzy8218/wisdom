import { useRef, useEffect, useCallback } from "react";

type AuraState = "idle" | "listening" | "thinking" | "speaking";

interface ThoughtAuraProps {
  state: AuraState;
  size?: number;
  className?: string;
}

/**
 * Canvas-rendered abstract aura for Shazzy-Owl persona.
 * Responds to cognitive states with distinct visual signatures.
 */
export default function ThoughtAura({ state, size = 56, className = "" }: ThoughtAuraProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const rafRef = useRef<number>();

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = size * dpr;
    const h = size * dpr;
    canvas.width = w;
    canvas.height = h;
    ctx.clearRect(0, 0, w, h);

    const t = frameRef.current * 0.02;
    const cx = w / 2;
    const cy = h / 2;
    const baseR = w * 0.32;

    // State-driven parameters
    const configs: Record<AuraState, { rings: number; speed: number; hue1: number; hue2: number; alpha: number; wobble: number }> = {
      idle:      { rings: 3, speed: 1,   hue1: 45,  hue2: 355, alpha: 0.12, wobble: 0.03 },
      listening: { rings: 4, speed: 1.5, hue1: 45,  hue2: 200, alpha: 0.18, wobble: 0.05 },
      thinking:  { rings: 5, speed: 3,   hue1: 355, hue2: 280, alpha: 0.22, wobble: 0.08 },
      speaking:  { rings: 4, speed: 2,   hue1: 45,  hue2: 30,  alpha: 0.28, wobble: 0.06 },
    };
    const c = configs[state];

    for (let i = 0; i < c.rings; i++) {
      const phase = (i / c.rings) * Math.PI * 2;
      const r = baseR + Math.sin(t * c.speed + phase) * baseR * c.wobble * (i + 1);
      const hue = c.hue1 + (c.hue2 - c.hue1) * (i / c.rings);
      const a = c.alpha * (1 - i * 0.15);

      ctx.beginPath();
      // Draw slightly irregular circle for organic feel
      const points = 60;
      for (let p = 0; p <= points; p++) {
        const angle = (p / points) * Math.PI * 2;
        const noise = Math.sin(angle * 3 + t * c.speed * 0.7 + i) * baseR * 0.04;
        const px = cx + Math.cos(angle) * (r + noise);
        const py = cy + Math.sin(angle) * (r + noise);
        if (p === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();

      const grad = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r);
      grad.addColorStop(0, `hsla(${hue}, 78%, 50%, ${a})`);
      grad.addColorStop(1, `hsla(${hue}, 78%, 50%, 0)`);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // Inner core glow
    const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseR * 0.5);
    const coreAlpha = state === "speaking" ? 0.15 + Math.sin(t * 4) * 0.08 :
                      state === "thinking" ? 0.1 + Math.sin(t * 6) * 0.06 : 0.08;
    coreGrad.addColorStop(0, `hsla(${c.hue1}, 90%, 55%, ${coreAlpha})`);
    coreGrad.addColorStop(1, `hsla(${c.hue1}, 90%, 55%, 0)`);
    ctx.fillStyle = coreGrad;
    ctx.fillRect(0, 0, w, h);

    frameRef.current++;
    rafRef.current = requestAnimationFrame(draw);
  }, [state, size]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
