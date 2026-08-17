import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { apiMe, AUTH_COOKIE_NAME } from "@/lib/auth-client";

export type StudentApiSession = {
  token: string;
  studentId: string;
};

export async function getStudentApiSession(): Promise<StudentApiSession | null> {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value ?? null;
  if (!token) return null;
  try {
    const { user } = await apiMe(token);
    if (!user || user.role !== "student") return null;
    return { token, studentId: user.id };
  } catch {
    return null;
  }
}

export async function requireStudentApiSession(): Promise<StudentApiSession | NextResponse> {
  const session = await getStudentApiSession();
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  return session;
}

export async function assertStudentApiAccess(studentId: string) {
  const session = await getStudentApiSession();
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  if (session.studentId !== studentId) {
    return NextResponse.json({ error: "无权访问其他账号数据" }, { status: 403 });
  }
  return null;
}
