"use client";

import * as React from "react";

type StudentSession = {
  studentId: string;
};

const StudentSessionContext = React.createContext<StudentSession | null>(null);

export function StudentSessionProvider({
  studentId,
  children,
}: {
  studentId: string;
  children: React.ReactNode;
}) {
  const value = React.useMemo(() => ({ studentId }), [studentId]);
  return <StudentSessionContext.Provider value={value}>{children}</StudentSessionContext.Provider>;
}

export function useStudentSession(): StudentSession {
  const ctx = React.useContext(StudentSessionContext);
  if (!ctx) {
    throw new Error("useStudentSession 必须在 StudentSessionProvider 内使用");
  }
  return ctx;
}
