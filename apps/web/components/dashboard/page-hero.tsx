import { DashboardMetric } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

export function PageHero({
  title,
  description,
  tags,
  metrics = [],
}: {
  title: string;
  description: string;
  tags?: string[];
  metrics?: DashboardMetric[];
}) {
  return (
    <section className="data-card overflow-hidden">
      <div className="grid gap-6 p-5 md:grid-cols-[1.2fr_0.8fr] md:p-6">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-white">{title}</h2>
          <p className="mt-2 max-w-[65ch] text-sm leading-relaxed text-white/55 md:text-base">{description}</p>
          {tags?.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>

        {metrics.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {metrics.slice(0, 4).map((metric) => (
              <div key={metric.title} className="metric-tile">
                <p className="text-xs text-white/45">{metric.title}</p>
                <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-white">{metric.value}</p>
                <p className="mt-1 text-xs text-white/50">
                  <span className="tabular-nums text-cyan-200/90">{metric.delta}</span> · {metric.hint}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
