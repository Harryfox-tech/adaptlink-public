"use client";

import { cn } from "@/lib/utils";

export type AutoRunTurnPhase =
  | "started"
  | "turn_start"
  | "choice_made"
  | "turn_complete"
  | "finished";

export type AutoRunTurnEvent = {
  phase: AutoRunTurnPhase;
  turn: number;
  maxTurns: number;
  eventTitle?: string;
  eventDescription?: string;
  choice?: string;
  engine?: string;
  overallScore?: number;
  narrative?: string;
  finished?: boolean;
  weakDimensions?: string[];
  turnsPlayed?: number;
  targetJob?: string;
  strategy?: string;
};

const phaseLabel: Record<AutoRunTurnPhase, string> = {
  started: "准备",
  turn_start: "新一幕",
  choice_made: "已选行动",
  turn_complete: "本幕完成",
  finished: "全部结束",
};

export function AutoRunProgressPanel({
  turns,
  live,
  className,
}: {
  turns: AutoRunTurnEvent[];
  live?: boolean;
  className?: string;
}) {
  if (!turns.length && !live) return null;

  const latest = turns[turns.length - 1];
  const maxTurns = latest?.maxTurns ?? 12;
  const currentTurn = latest?.phase === "finished" ? latest.turnsPlayed ?? latest.turn : latest?.turn ?? 0;
  const progressPct =
    latest?.phase === "finished" ? 100 : maxTurns > 0 ? Math.min(98, Math.round((currentTurn / maxTurns) * 100)) : 8;

  return (
    <div className={cn("rounded-[20px] border border-cyan-500/20 bg-cyan-950/20 p-4", className)}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-cyan-100">自动模拟进度</p>
          <p className="mt-1 text-xs text-white/50">
            {live ? "运行中…" : "已完成"}
            {latest?.phase && latest.phase !== "started" ? ` · ${phaseLabel[latest.phase]}` : ""}
          </p>
        </div>
        <div className="text-right text-xs text-white/60">
          <div>
            第 {currentTurn}/{maxTurns} 幕
          </div>
          {typeof latest?.overallScore === "number" && latest.phase !== "started" ? (
            <div className="mt-0.5 font-medium text-cyan-200">得分 {latest.overallScore.toFixed(1)}</div>
          ) : null}
        </div>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className={cn("h-full rounded-full bg-cyan-400/80 transition-all duration-500", live && "animate-pulse")}
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <ol className="mt-4 max-h-56 space-y-2 overflow-y-auto text-[12px]">
        {turns.map((item, index) => (
          <li
            key={`${item.phase}-${item.turn}-${index}`}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/75"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-white/85">
                {item.phase === "started"
                  ? `启动 · ${item.targetJob ?? "求职模拟"}`
                  : item.phase === "finished"
                    ? `结束 · ${item.turnsPlayed ?? item.turn} 幕`
                    : `第 ${item.turn} 幕 · ${phaseLabel[item.phase]}`}
              </span>
              {typeof item.overallScore === "number" && item.phase === "turn_complete" ? (
                <span className="text-cyan-200">{item.overallScore.toFixed(1)} 分</span>
              ) : null}
            </div>
            {item.eventTitle ? <p className="mt-1 text-white/60">{item.eventTitle}</p> : null}
            {item.choice ? <p className="mt-1 text-violet-200/90">选择：{item.choice}</p> : null}
            {item.narrative ? <p className="mt-1 line-clamp-2 text-white/50">{item.narrative}</p> : null}
            {item.weakDimensions?.length ? (
              <p className="mt-1 text-amber-200/80">薄弱：{item.weakDimensions.join("、")}</p>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
