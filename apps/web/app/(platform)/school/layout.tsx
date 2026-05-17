import * as React from "react";
import { RoleShell } from "@/components/layout/role-shell";

export default function SchoolLayout({ children }: { children: React.ReactNode }) {
  return <RoleShell role="school">{children}</RoleShell>;
}


