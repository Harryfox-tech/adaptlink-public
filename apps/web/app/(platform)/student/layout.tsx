import { RoleShell } from "@/components/layout/role-shell";
import { StudentSessionProvider } from "@/components/student/student-session-provider";
import { requireStudentSession } from "@/lib/auth-server";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const { studentId } = await requireStudentSession();

  return (
    <StudentSessionProvider studentId={studentId}>
      <RoleShell role="student">{children}</RoleShell>
    </StudentSessionProvider>
  );
}
