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
    <section className="data-card mb-4 overflow-hidden">
      <div className="px-5 py-5 md:px-6">
        <h1 className="font-qdisplay text-2xl font-semibold tracking-tight text-white md:text-[2rem]">{title}</h1>
        <p className="mt-2 max-w-3xl font-quantum text-sm text-white/60 md:text-base">{description}</p>

        {tags?.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={tag} className="border border-white/10 bg-white/5 font-quantum text-white/70">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>

      {metrics.length > 0 ? (
        <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-4">
          {metrics.slice(0, 4).map((metric) => (
            <div key={metric.title} className="quantum-glass-texture rounded-[16px] border border-white/10 bg-white/[0.04] p-3 shadow-[0_0_22px_rgba(34,211,238,0.06)] backdrop-blur-md">
              <p className="font-quantum text-xs text-white/45">{metric.title}</p>
              <p className="mt-1 font-quantum text-xl font-semibold text-white/90">{metric.value}</p>
              <p className="mt-1 font-quantum text-xs text-white/50">{metric.delta} · {metric.hint}</p>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
