import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { apiMe, AUTH_COOKIE_NAME } from "@/lib/auth-client";

export async function assertStudentApiAccess(studentId: string) {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value ?? null;
  if (!token) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  try {
    const { user } = await apiMe(token);
    if (!user || user.role !== "student") {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }
    if (user.id !== studentId) {
      return NextResponse.json({ error: "无权访问其他账号数据" }, { status: 403 });
    }
    return null;
  } catch {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
}
