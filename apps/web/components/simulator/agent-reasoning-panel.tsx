"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";

export function AgentReasoningPanel({
  trace,
  engine,
  className,
  live = false,
}: {
  trace: string[];
  engine?: string;
  className?: string;
  live?: boolean;
}) {
  const [open, setOpen] = useState(true);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!live || !listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [trace, live]);

  if (!trace.length && !live) return null;

  return (
    <div className={cn("rounded-[20px] border border-violet-500/20 bg-violet-950/30 p-4", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-violet-100">
          <BrainCircuit className={cn("h-4 w-4", live && "animate-pulse")} />
          Agent 推理轨迹
          {engine ? (
            <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-normal text-white/50">
              {engine}
            </span>
          ) : null}
          {live ? (
            <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-normal text-cyan-200">
              实时
            </span>
          ) : null}
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-white/50" /> : <ChevronDown className="h-4 w-4 text-white/50" />}
      </button>
      {open ? (
        <ul
          ref={listRef}
          className={cn(
            "mt-3 space-y-2 overflow-y-auto text-[12px] leading-relaxed text-white/70",
            live ? "max-h-72" : "max-h-48",
          )}
        >
          {trace.length ? (
            trace.map((line, i) => (
              <li key={`${i}-${line.slice(0, 24)}`} className="border-l-2 border-violet-400/40 pl-3">
                {line}
              </li>
            ))
          ) : (
            <li className="border-l-2 border-violet-400/20 pl-3 text-white/45">等待 Agent 输出…</li>
          )}
        </ul>
      ) : null}
    </div>
  );
}
