"use client";

import * as React from "react";
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

type RadarDatum = { subject: string; score: number };

export function NeoAbilityRadar({
  title,
  data,
  className,
}: {
  title: string;
  data: RadarDatum[];
  className?: string;
}) {
  const [mounted, setMounted] = React.useState(false);
  const gid = React.useId().replace(/:/g, "");
  const fillId = `neoRadarFill-${gid}`;

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={cn("h-[240px] w-full", className)}>
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[12px] font-semibold text-white/85">{title}</div>
        <div className="h-[1px] flex-1 bg-gradient-to-r from-white/0 via-white/10 to-white/0" />
      </div>
      <div className="h-[210px] w-full">
        {!mounted ? (
          <div className="h-full w-full animate-pulse rounded-xl bg-white/5" aria-hidden />
        ) : (
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="72%" data={data}>
            <defs>
              <linearGradient id={fillId} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="rgb(34 211 238)" stopOpacity={0.25} />
                <stop offset="60%" stopColor="rgb(59 130 246)" stopOpacity={0.18} />
                <stop offset="100%" stopColor="rgb(168 85 247)" stopOpacity={0.22} />
              </linearGradient>
            </defs>
            <PolarGrid stroke="rgba(255,255,255,0.10)" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 11 }} />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              dataKey="score"
              stroke="rgba(34,211,238,0.85)"
              fill={`url(#${fillId})`}
              fillOpacity={1}
              strokeWidth={1.5}
              dot={{ r: 3, fill: "rgba(34,211,238,0.95)" }}
            />
          </RadarChart>
        </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

