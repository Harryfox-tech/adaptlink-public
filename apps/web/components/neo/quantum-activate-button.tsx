"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function QuantumActivateButton({
  onClick,
  disabled,
  loading,
  className,
}: {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}) {
  const [ripples, setRipples] = React.useState<{ id: number; x: number; y: number }[]>([]);

  const handle = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setRipples((r) => [...r, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    window.setTimeout(() => setRipples((r) => r.filter((x) => x.id !== id)), 700);
    onClick();
  };

  return (
    <motion.button
      type="button"
      disabled={disabled || loading}
      onClick={handle}
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      className={cn(
        "relative isolate overflow-hidden rounded-2xl border border-cyan-400/40 bg-gradient-to-br from-cyan-500/30 via-blue-600/25 to-violet-600/30 px-8 py-4 font-qdisplay text-base font-bold uppercase tracking-[0.12em] text-white shadow-[0_0_32px_rgba(34,211,238,0.35),inset_0_1px_0_rgba(255,255,255,0.15)] transition-shadow",
        "disabled:pointer-events-none disabled:opacity-45",
        "[clip-path:polygon(6%_0%,94%_0%,100%_50%,94%_100%,6%_100%,0%_50%)]",
        className,
      )}
      aria-label={loading ? "处理中" : "激活阶段并提交回答"}
    >
      {ripples.map((r) => (
        <motion.span
          key={r.id}
          className="pointer-events-none absolute h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/25"
          style={{ left: r.x, top: r.y }}
          initial={{ scale: 0, opacity: 0.55 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
        />
      ))}
      <span className="relative z-[1] drop-shadow-[0_0_12px_rgba(34,211,238,0.6)]">
        {loading ? "同步中…" : "激活阶段"}
      </span>
      <span className="relative z-[1] mt-1 block text-center font-quantum text-[10px] font-normal normal-case tracking-normal text-white/55">
        提交并推进剧情
      </span>
    </motion.button>
  );
}
