import * as React from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "flex min-h-[100px] w-full rounded-[12px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/90 backdrop-blur-md",
        "placeholder:text-white/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/30",
        className,
      )}
      {...props}
    />
  );
}


