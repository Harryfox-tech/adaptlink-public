"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const variants = {
  confidence: {
    bar: "from-cyan-400 via-emerald-400 to-cyan-300",
    glow: "shadow-[0_0_12px_rgba(34,211,238,0.55)]",
    dot: "bg-cyan-300",
  },
  pressure: {
    bar: "from-orange-500 via-rose-500 to-orange-400",
    glow: "shadow-[0_0_12px_rgba(251,113,133,0.45)]",
    dot: "bg-orange-400",
  },
  energy: {
    bar: "from-violet-500 via-fuchsia-400 to-violet-400",
    glow: "shadow-[0_0_12px_rgba(167,139,250,0.45)]",
    dot: "bg-violet-300",
  },
  readiness: {
    bar: "from-sky-500 via-blue-400 to-cyan-400",
    glow: "shadow-[0_0_12px_rgba(56,189,248,0.45)]",
    dot: "bg-sky-300",
  },
} as const;

export type CyberBarVariant = keyof typeof variants;

export function CyberStatBar({
  label,
  value,
  delta,
  variant = "confidence",
  className,
}: {
  label: string;
  value: number;
  delta?: string;
  variant?: CyberBarVariant;
  className?: string;
}) {
  const v = variants[variant];
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wider text-white/50">{label}</span>
        <span className="font-mono text-sm tabular-nums text-white/90">
          <AnimatedInt n={pct} />
          {delta ? <span className="ml-1 text-[11px] text-white/45">{delta}</span> : null}
        </span>
      </div>
      <div className="relative h-2.5 overflow-hidden rounded-full bg-white/[0.07] ring-1 ring-white/[0.06]">
        <motion.div
          className={cn("relative h-full rounded-full bg-gradient-to-r", v.bar)}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 22 }}
        >
          <span
            className={cn(
              "absolute -right-0.5 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border border-white/30",
              v.dot,
              v.glow,
            )}
          />
        </motion.div>
      </div>
    </div>
  );
}

function AnimatedInt({ n }: { n: number }) {
  const [d, setD] = React.useState(n);
  const fromRef = React.useRef(n);
  React.useEffect(() => {
    const from = fromRef.current;
    const start = performance.now();
    const dur = 320;
    let raf = 0;
    const target = n;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const ease = 1 - Math.pow(1 - t, 3);
      const next = Math.round(from + (target - from) * ease);
      setD(next);
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [n]);
  return <>{d}</>;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const large = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y}`;
}

export function SemiGauge({
  value,
  label,
  accent,
}: {
  value: number;
  label: string;
  accent: "cyan" | "orange";
}) {
  const gid = React.useId().replace(/:/g, "");
  const idCyan = `gaugeCyan-${gid}`;
  const idOrange = `gaugeOrange-${gid}`;
  const pct = Math.max(0, Math.min(100, value));
  const cx = 52;
  const cy = 52;
  const r = 38;
  const start = 180;
  const end = 0;
  const total = start - end;
  const current = end + (total * pct) / 100;
  const stroke = accent === "cyan" ? `url(#${idCyan})` : `url(#${idOrange})`;
  const glow = accent === "cyan" ? "drop-shadow(0 0 8px rgba(34,211,238,0.45))" : "drop-shadow(0 0 8px rgba(251,146,60,0.4))";

  return (
    <div className="flex flex-col items-center">
      <svg width="112" height="64" viewBox="0 0 104 60" className="overflow-visible">
        <defs>
          <linearGradient id={idCyan} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgb(34 211 238)" />
            <stop offset="100%" stopColor="rgb(52 211 153)" />
          </linearGradient>
          <linearGradient id={idOrange} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgb(251 146 60)" />
            <stop offset="100%" stopColor="rgb(244 63 94)" />
          </linearGradient>
        </defs>
        <path
          d={describeArc(cx, cy, r, start, end)}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d={describeArc(cx, cy, r, start, current)}
          fill="none"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
          style={{ filter: glow }}
        />
      </svg>
      <div className="-mt-1 text-center">
        <div className="font-mono text-xl font-semibold tabular-nums text-white">
          <AnimatedInt n={pct} />
        </div>
        <div className="text-[10px] font-medium uppercase tracking-wider text-white/45">{label}</div>
      </div>
    </div>
  );
}

export function RhythmRing({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "cyan" | "violet";
}) {
  const pct = Math.max(0, Math.min(100, value));
  const size = 72;
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = size / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - pct / 100);
  const strokeColor = accent === "cyan" ? "rgb(34 211 238)" : "rgb(167 139 250)";

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <motion.circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke={strokeColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={false}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          style={{ filter: `drop-shadow(0 0 6px ${accent === "cyan" ? "rgba(34,211,238,0.35)" : "rgba(167,139,250,0.35)"})` }}
        />
      </svg>
      <div className="text-center">
        <div className="font-mono text-sm font-semibold tabular-nums text-white/90">
          <AnimatedInt n={pct} />%
        </div>
        <div className="max-w-[88px] text-center text-[10px] leading-tight text-white/45">{label}</div>
      </div>
    </div>
  );
}

export function CyberMonitorSection({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function SimulatorTipsSticky({ tips }: { tips: string[] }) {
  return (
    <div className="rounded-[14px] border border-amber-400/15 bg-gradient-to-br from-amber-400/[0.07] to-transparent p-3 backdrop-blur-sm">
      <div className="mb-2 flex items-center gap-2">
        <Zap className="h-4 w-4 text-amber-300/90" aria-hidden />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-200/80">即时建议</span>
      </div>
      <ul className="space-y-2">
        {tips.map((tip, i) => (
          <motion.li
            key={`${tip}-${i}`}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.06 * i, duration: 0.25 }}
            className="flex gap-2 text-[11px] leading-relaxed text-white/65"
          >
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-cyan-400/80 shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
            <span>{tip}</span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
