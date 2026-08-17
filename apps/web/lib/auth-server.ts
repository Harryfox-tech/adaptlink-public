import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiMe, AUTH_COOKIE_NAME } from "@/lib/auth-client";
import type { PlatformRole } from "@/lib/types";

export async function getAuthToken(): Promise<string | null> {
  return (await cookies()).get(AUTH_COOKIE_NAME)?.value ?? null;
}

export async function requireStudentSession() {
  const token = await getAuthToken();
  if (!token) {
    redirect("/login?role=student");
  }
  try {
    const { user } = await apiMe(token);
    if (!user || user.role !== "student") {
      redirect("/login?role=student");
    }
    return { token, user, studentId: user.id };
  } catch {
    redirect("/login?role=student");
  }
}

export async function assertStudentIdMatchesSession(studentId: string) {
  const session = await requireStudentSession();
  if (session.studentId !== studentId) {
    throw new Error("无权访问其他账号数据");
  }
  return session;
}

export async function requireRoleSession(role: PlatformRole) {
  const token = await getAuthToken();
  if (!token) {
    redirect(`/login?role=${role}`);
  }
  const { user } = await apiMe(token);
  if (!user || user.role !== role) {
    redirect(`/login?role=${role}`);
  }
  return { token, user };
}
