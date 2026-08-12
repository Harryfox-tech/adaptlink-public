"use client";

import * as React from "react";

/** 页面内容容器：背景由 PlatformShell 统一提供，此处只做间距与圆角 */
export function NeoCanvas({ children }: { children: React.ReactNode }) {
  return <div className="space-y-6">{children}</div>;
}
