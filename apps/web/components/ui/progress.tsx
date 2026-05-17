import { cn } from "@/lib/utils";

export function Progress({ value = 0, className }: { value?: number; className?: string }) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-white/10", className)}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-emerald-300 to-blue-400 transition-all"
        style={{ width: `${Math.max(0, Math.min(value, 100))}%` }}
      />
    </div>
  );
}
