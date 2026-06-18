"use client";

import { StudentsTablePanel } from "@/modules/School/students/StudentsTablePanel";

export function ClassStudentsTablePanel({
  orgId,
  schoolId,
  classItemId,
  classMetadata,
  canMutate,
  onBootstrapped,
}: Readonly<{
  orgId: string;
  schoolId: string;
  classItemId: string;
  classMetadata: Record<string, unknown> | null | undefined;
  canMutate: boolean;
  onBootstrapped: () => void;
}>) {
  return (
    <StudentsTablePanel
      orgId={orgId}
      schoolId={schoolId}
      workspaceItemId={classItemId}
      itemMetadata={classMetadata}
      canMutate={canMutate}
      onBootstrapped={onBootstrapped}
      scope="class"
      headingId="class-students-table-title"
    />
  );
}
