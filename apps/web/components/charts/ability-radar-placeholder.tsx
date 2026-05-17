"use client";

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AbilityDimension } from "@/lib/types";

export function AbilityRadarPlaceholder({ abilities }: { abilities: AbilityDimension[] }) {
  const data = abilities.map((item) => ({ subject: item.label, score: item.score }));

  return (
    <Card className="quantum-scanline quantum-glass-texture overflow-hidden border-cyan-500/25 bg-slate-950/45 backdrop-blur-xl">
      <CardHeader className="border-b border-white/[0.06] pb-3">
        <CardTitle className="font-qdisplay text-base">CODEX SYNERGY RADAR</CardTitle>
        <p className="font-quantum text-xs text-white/45">多维能力画像（Recharts Radar）</p>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
              <defs>
                <linearGradient id="codexRadarFill" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="rgb(34 211 238)" stopOpacity={0.28} />
                  <stop offset="60%" stopColor="rgb(59 130 246)" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="rgb(168 85 247)" stopOpacity={0.22} />
                </linearGradient>
              </defs>
              <PolarGrid stroke="rgba(255,255,255,0.12)" />
              <PolarAngleAxis dataKey="subject" fontSize={12} tick={{ fill: "rgba(255,255,255,0.65)" }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar dataKey="score" stroke="rgba(34,211,238,0.9)" fill="url(#codexRadarFill)" fillOpacity={1} strokeWidth={1.5} dot={{ r: 3, fill: "rgba(34,211,238,0.95)" }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
