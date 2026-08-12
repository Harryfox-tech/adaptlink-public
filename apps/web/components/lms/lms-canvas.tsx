"use client";

import * as React from "react";

export function LmsCanvas({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <header className="border-b border-white/10 pb-5">
        <h1 className="font-display text-balance text-3xl font-semibold tracking-tight text-white md:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55 md:text-base">{description}</p>
        ) : null}
      </header>
      {children}
    </div>
  );
}
