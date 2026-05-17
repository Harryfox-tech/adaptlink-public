"use client";

import * as React from "react";
import { motion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

const container: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.04,
    },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 10, filter: "blur(2px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] },
  },
};

export function NeoStagger({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      className={cn(className)}
      variants={container}
      initial="hidden"
      animate="show"
    >
      {children}
    </motion.div>
  );
}

export function NeoItem({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div variants={item} className={cn(className)}>
      {children}
    </motion.div>
  );
}

