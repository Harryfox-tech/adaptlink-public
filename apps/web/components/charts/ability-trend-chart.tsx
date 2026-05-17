"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AbilityTrendSeries } from "@/lib/types";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const palette = ["#22d3ee", "#a78bfa", "#60a5fa", "#34d399", "#fb7185", "#f97316"];

export function AbilityTrendChart({ series }: { series: AbilityTrendSeries[] }) {
  const dates = Array.from(new Set(series.flatMap((item) => item.points.map((point) => point.date)))).sort();

  const data = dates.map((date) => {
    const row: Record<string, string | number | null> = { date };
    for (const item of series) {
      const point = item.points.find((p) => p.date === date);
      row[item.abilityLabel] = point ? point.score : null;
    }
    return row;
  });

  return (
    <Card className="quantum-glass-texture overflow-hidden border-white/10 bg-slate-950/35 backdrop-blur-xl">
      <CardHeader className="border-b border-white/[0.06]">
        <CardTitle className="font-qdisplay text-base">能力趋势（真实时间序列）</CardTitle>
        <p className="font-quantum text-xs text-white/45">时间轴 · 多能力曲线 · Hover Tooltip</p>
      </CardHeader>
      <CardContent className="pt-4">
        {series.length === 0 ? (
          <p className="font-quantum text-sm text-white/55">暂无趋势数据，请先完成多次模拟训练后查看。</p>
        ) : (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.10)" />
                <XAxis
                  dataKey="date"
                  fontSize={12}
                  tick={{ fill: "rgba(255,255,255,0.55)" }}
                  axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
                  tickLine={{ stroke: "rgba(255,255,255,0.12)" }}
                />
                <YAxis
                  domain={[0, 100]}
                  fontSize={12}
                  tick={{ fill: "rgba(255,255,255,0.55)" }}
                  axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
                  tickLine={{ stroke: "rgba(255,255,255,0.12)" }}
                />
                <Tooltip
                  contentStyle={{
                    background: "rgba(2,6,23,0.85)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 14,
                    color: "rgba(255,255,255,0.9)",
                    backdropFilter: "blur(10px)",
                  }}
                />
                <Legend wrapperStyle={{ color: "rgba(255,255,255,0.65)" }} />
                {series.map((item, index) => (
                  <Line
                    key={item.abilityKey}
                    type="monotone"
                    dataKey={item.abilityLabel}
                    stroke={palette[index % palette.length]}
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
