import { useEffect, useRef } from 'react';

const COLORS = ['#6b5bd2', '#4b8a6f', '#c07a3e', '#cf9d3a', '#c0533e'];
const DURATION = 1600;

/**
 * Lichtgewicht, afhankelijkheidsvrije confetti-burst voor een mijlpaalmoment.
 * Vuurt één keer af bij mount en roept daarna `onDone` aan. Respecteert
 * `prefers-reduced-motion`: dan geen animatie, wel direct opruimen.
 */
export function Confetti({ onDone }: { onDone?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    const reduce =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      doneRef.current?.();
      return;
    }
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) {
      doneRef.current?.();
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const count = Math.min(120, Math.round(width / 6));
    const particles = Array.from({ length: count }, () => ({
      x: width / 2 + (Math.random() - 0.5) * width * 0.5,
      y: -20 - Math.random() * height * 0.2,
      vx: (Math.random() - 0.5) * 6,
      vy: 3 + Math.random() * 4,
      size: 5 + Math.random() * 6,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));

    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const elapsed = now - start;
      const fade = Math.max(0, 1 - elapsed / DURATION);
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.vy += 0.12; // zwaartekracht
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }
      if (elapsed < DURATION) {
        raf = requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, width, height);
        doneRef.current?.();
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[80]"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
}
