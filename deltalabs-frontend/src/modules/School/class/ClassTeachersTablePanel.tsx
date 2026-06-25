"use client";

import { TeachersTablePanel } from "@/modules/School/teachers/TeachersTablePanel";

export function ClassTeachersTablePanel({
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
    <TeachersTablePanel
      orgId={orgId}
      schoolId={schoolId}
      workspaceItemId={classItemId}
      itemMetadata={classMetadata}
      canMutate={canMutate}
      onBootstrapped={onBootstrapped}
      scope="class"
      headingId="class-teachers-table-title"
    />
  );
}
