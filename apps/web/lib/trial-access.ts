import type { PlatformRole } from "@/lib/types";

export function isTrialGatedRole(role: PlatformRole): boolean {
  return role === "enterprise" || role === "school";
}

export const TRIAL_GATE_HINT = "高校端与企业端试商用暂未开放，请输入正确的开发者密钥";
