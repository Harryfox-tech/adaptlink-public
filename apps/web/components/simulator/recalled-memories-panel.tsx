"use client";

import { Sparkles } from "lucide-react";
import type { RecalledMemory } from "@/lib/types";
import { cn } from "@/lib/utils";

export function RecalledMemoriesPanel({
  memories,
  className,
}: {
  memories: RecalledMemory[];
  className?: string;
}) {
  if (!memories.length) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-purple-300/80">
        <Sparkles className="h-3.5 w-3.5" />
        过往回响
      </div>
      {memories.map((mem) => (
        <div
          key={mem.memoryId}
          className={cn(
            "rounded-xl border-l-4 bg-white/5 px-3 py-2 text-sm text-white/75",
            mem.reflectedInStory ? "border-purple-400" : "border-purple-400/50",
          )}
        >
          <span className="mr-1">💭</span>
          {mem.text}
        </div>
      ))}
    </div>
  );
}
