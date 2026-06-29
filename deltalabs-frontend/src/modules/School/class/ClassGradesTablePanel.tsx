"use client";

import { GradesTablePanel } from "@/modules/School/grades/GradesTablePanel";

export function ClassGradesTablePanel({
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
    <GradesTablePanel
      orgId={orgId}
      schoolId={schoolId}
      workspaceItemId={classItemId}
      itemMetadata={classMetadata}
      canMutate={canMutate}
      onBootstrapped={onBootstrapped}
      headingId="class-grades-table-title"
    />
  );
}
