"use client";

import Link from "next/link";
import type { EpisodeEnding, SimulationEpisode } from "@/lib/types";
import { AbilityScoreCards } from "@/components/charts/ability-score-cards";
import { AgentReviewList } from "@/components/simulator/agent-review-list";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function EndingModal({
  open,
  ending,
  endingType,
  episode,
  onClose,
}: {
  open: boolean;
  ending: EpisodeEnding;
  endingType?: string | null;
  episode: SimulationEpisode | null;
  onClose: () => void;
}) {
  if (!open) return null;

  const latestTurn = episode?.turns.length ? episode.turns[episode.turns.length - 1] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-white/10 bg-slate-950 p-8 shadow-2xl">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge className="bg-cyan-500/20 text-cyan-100">剧情收官</Badge>
          {endingType ? <Badge className="border border-white/20 bg-transparent">{endingType}</Badge> : null}
        </div>
        <h2 className="text-3xl font-semibold text-white">{ending.title}</h2>
        <p className="mt-4 text-sm leading-7 text-white/70">{ending.summary}</p>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-white/65">
          {ending.nextSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>

        {latestTurn ? (
          <div className="mt-6 space-y-4 border-t border-white/10 pt-6">
            <AbilityScoreCards abilities={latestTurn.aggregate.abilityScores} />
            <AgentReviewList reviews={latestTurn.aggregate.agentReviews} />
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          <Button type="button" onClick={onClose}>
            关闭
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/student/simulators/history">查看历史</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
