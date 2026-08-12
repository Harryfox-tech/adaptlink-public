import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-white/10 bg-white/5 text-white/75",
        accent: "border-cyan-400/25 bg-cyan-500/12 text-cyan-100",
        success: "border-emerald-400/20 bg-emerald-500/10 text-emerald-100",
        warning: "border-amber-400/20 bg-amber-500/10 text-amber-100",
        danger: "border-rose-400/20 bg-rose-500/10 text-rose-100",
        outline: "border-white/15 bg-transparent text-white/70",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
