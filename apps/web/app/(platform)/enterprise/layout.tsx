import * as React from "react";
import { RoleShell } from "@/components/layout/role-shell";

export default function EnterpriseLayout({ children }: { children: React.ReactNode }) {
  return <RoleShell role="enterprise">{children}</RoleShell>;
}


