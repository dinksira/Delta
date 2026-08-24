"use client";

import { ScheduleTablePanel } from "@/modules/School/schedules/ScheduleTablePanel";

export function ClassScheduleTablePanel({
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
    <ScheduleTablePanel
      orgId={orgId}
      schoolId={schoolId}
      workspaceItemId={classItemId}
      itemMetadata={classMetadata}
      canMutate={canMutate}
      onBootstrapped={onBootstrapped}
    />
  );
}