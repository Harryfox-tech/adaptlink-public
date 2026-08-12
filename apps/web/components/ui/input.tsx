import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "flex h-10 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/90 backdrop-blur-md transition duration-200",
        "ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-white/80",
        "placeholder:text-white/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/35",
        "hover:border-white/15 active:scale-[0.995]",
        className,
      )}
      {...props}
    />
  );
}


