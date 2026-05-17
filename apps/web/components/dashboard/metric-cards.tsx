import { DashboardMetric } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function MetricCards({
  metrics,
  columns = 4,
}: {
  metrics: DashboardMetric[];
  columns?: 2 | 3 | 4;
}) {
  const gridClass =
    columns === 2
      ? "grid gap-4 md:grid-cols-2"
      : columns === 3
        ? "grid gap-4 md:grid-cols-3"
        : "grid gap-4 md:grid-cols-2 xl:grid-cols-4";
  return (
    <section className={cn(gridClass)}>
      {metrics.map((metric) => (
        <Card key={metric.title} className="animate-fade-in-up">
          <CardHeader className="pb-3">
            <CardTitle className="font-quantum text-sm font-semibold text-white/55">{metric.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <p className="text-2xl font-bold tracking-tight">{metric.value}</p>
              <Badge className="border border-white/10 bg-white/5 font-quantum text-white/70">{metric.delta}</Badge>
            </div>
            <p className="mt-2 font-quantum text-xs text-white/50">{metric.hint}</p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
