"use client";

import { motion } from "framer-motion";
import { AgentReview } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const AGENT_THEMES = [
  {
    border: "border-cyan-400/25",
    glow: "shadow-[0_0_24px_rgba(34,211,238,0.12)]",
    badge: "border-cyan-400/30 bg-cyan-500/10 text-cyan-100",
    pill: "border-cyan-400/20 bg-cyan-400/10 text-cyan-50/90",
  },
  {
    border: "border-violet-400/25",
    glow: "shadow-[0_0_24px_rgba(167,139,250,0.12)]",
    badge: "border-violet-400/30 bg-violet-500/10 text-violet-100",
    pill: "border-violet-400/20 bg-violet-400/10 text-violet-50/90",
  },
  {
    border: "border-teal-400/25",
    glow: "shadow-[0_0_24px_rgba(45,212,191,0.12)]",
    badge: "border-teal-400/30 bg-teal-500/10 text-teal-100",
    pill: "border-teal-400/20 bg-teal-400/10 text-teal-50/90",
  },
  {
    border: "border-fuchsia-400/25",
    glow: "shadow-[0_0_24px_rgba(217,70,239,0.10)]",
    badge: "border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-100",
    pill: "border-fuchsia-400/20 bg-fuchsia-400/10 text-fuchsia-50/90",
  },
  {
    border: "border-amber-400/25",
    glow: "shadow-[0_0_24px_rgba(251,191,36,0.10)]",
    badge: "border-amber-400/30 bg-amber-500/10 text-amber-100",
    pill: "border-amber-400/20 bg-amber-400/10 text-amber-50/90",
  },
];

export function AgentReviewList({ reviews }: { reviews: AgentReview[] }) {
  return (
    <Card className="overflow-hidden border-white/10 bg-slate-950/35 backdrop-blur-xl">
      <CardHeader className="border-b border-white/[0.06]">
        <CardTitle className="text-xl">智能体评估结果</CardTitle>
        <p className="text-sm font-normal text-white/50">多角色并行点评与标签摘要</p>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {reviews.map((review, idx) => {
          const theme = AGENT_THEMES[idx % AGENT_THEMES.length];
          return (
            <motion.div
              key={review.agent}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.35, delay: Math.min(0.12, idx * 0.05) }}
              className={cn(
                "rounded-[16px] border bg-white/[0.04] p-4 backdrop-blur-md",
                theme.border,
                theme.glow,
              )}
            >
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <Badge className={cn("font-medium", theme.badge)}>
                  {review.agent}
                </Badge>
                <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 font-mono text-sm tabular-nums text-white/90">
                  {review.score} 分
                </span>
              </div>
              <p className="mb-3 text-sm leading-relaxed text-white/70">{review.summary}</p>
              <div className="flex flex-wrap gap-2">
                {review.highlights.map((item, hi) => (
                  <span
                    key={`${review.agent}-${hi}-${item}`}
                    className={cn("rounded-full border px-2.5 py-1 text-[11px] leading-snug", theme.pill)}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}
