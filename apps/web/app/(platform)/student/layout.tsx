import * as React from "react";
import { RoleShell } from "@/components/layout/role-shell";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return <RoleShell role="student">{children}</RoleShell>;
}


