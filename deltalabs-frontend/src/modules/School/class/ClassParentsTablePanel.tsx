"use client";

import { ParentsTablePanel } from "@/modules/School/parents/ParentsTablePanel";

export function ClassParentsTablePanel({
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
    <ParentsTablePanel
      orgId={orgId}
      schoolId={schoolId}
      workspaceItemId={classItemId}
      itemMetadata={classMetadata}
      canMutate={canMutate}
      onBootstrapped={onBootstrapped}
      scope="class"
      headingId="class-parents-table-title"
    />
  );
}
