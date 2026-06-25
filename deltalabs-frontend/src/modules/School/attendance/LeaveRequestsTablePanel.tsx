"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Table2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/theme";
import { useAuthSession } from "@/contexts/AuthSession_Context";
import { ApiError } from "@/lib/apiClient";
import type { ManagementTableColumnTypeDto } from "@/modules/School/api";
import {
  appendManagementTableColumn,
  bootstrapLeaveRequestsTableWorkspaceItem,
  fetchManagementTableInstanceBundle,
} from "@/modules/School/api";
import { CLASS_WORKSPACE_LAYOUT } from "@/modules/School/class/layoutConstants";
import { ClassLeaveRequestSubmitForm } from "@/modules/School/attendance/ClassLeaveRequestSubmitForm";
import { readLeaveRequestsTableInstanceId } from "@/modules/School/attendance/leaveRequestsTableMeta";
import { useClassAttendanceStudents } from "@/modules/School/attendance/useClassAttendanceStudents";
import { ManagementTableAddColumnPopover } from "@/modules/School/managementTable/ManagementTableAddColumnPopover";
import {
  CLASS_LEAVE_REQUESTS_TABLE_ADD_COLUMN_GROUPS,
  defaultSettingsForColumnType,
  defaultTitleForColumnType,
  filterAddColumnGroups,
  type ManagementTableAddColumnOption,
} from "@/modules/School/managementTable/columnTypeMeta";
import { ManagementTableGroupSection } from "@/modules/School/managementTable/ManagementTableGroupSection";
import { useManagementTableAddColumnPopover } from "@/modules/School/managementTable/useManagementTableAddColumnPopover";
import { schoolQueryKeys } from "@/modules/School/hooks/schoolQueryKeys";

function bootstrapErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 404) {
    return "The leave-requests-table API is not on the live server yet. Deploy the latest deltalabs-backend, then try again.";
  }
  if (error instanceof ApiError && error.status === 403) {
    return "You need school manage permission on this organization to create the leave requests table.";
  }
  if (error instanceof ApiError) return error.message;
  return "Could not create leave requests table. Check your connection and try again.";
}

export function LeaveRequestsTablePanel({
  orgId,
  schoolId,
  classItemId,
  classMetadata,
  canMutate,
  onBootstrapped,
  headingId = "class-leave-requests-title",
}: Readonly<{
  orgId: string;
  schoolId: string;
  classItemId: string;
  classMetadata: Record<string, unknown> | null | undefined;
  canMutate: boolean;
  onBootstrapped: () => void;
  headingId?: string;
}>) {
  const { session } = useAuthSession();
  const userId = session?.user?.id ?? null;
  const queryClient = useQueryClient();
  const [instanceId, setInstanceId] = useState<string | null>(() =>
    readLeaveRequestsTableInstanceId(classMetadata),
  );
  const addColumn = useManagementTableAddColumnPopover();

  useEffect(() => {
    setInstanceId(readLeaveRequestsTableInstanceId(classMetadata));
  }, [classMetadata]);

  const bootstrapMutation = useMutation({
    mutationFn: () => bootstrapLeaveRequestsTableWorkspaceItem(orgId, schoolId, classItemId),
    onSuccess: (data) => {
      setInstanceId(data.instance.id);
      onBootstrapped();
      void queryClient.invalidateQueries({
        queryKey: schoolQueryKeys.workspaceItem(orgId, schoolId, classItemId),
      });
      void queryClient.invalidateQueries({
        queryKey: schoolQueryKeys.managementTableInstance(orgId, schoolId, data.instance.id),
      });
    },
  });

  useEffect(() => {
    if (!canMutate || instanceId || bootstrapMutation.isPending) return;
    bootstrapMutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canMutate, instanceId]);

  const bundleQuery = useQuery({
    queryKey: schoolQueryKeys.managementTableInstance(orgId, schoolId, instanceId ?? "none"),
    queryFn: () => fetchManagementTableInstanceBundle(orgId, schoolId, instanceId!),
    enabled: Boolean(orgId && schoolId && instanceId),
    staleTime: 15_000,
  });

  const invalidateBundleAndRows = async () => {
    if (!instanceId) return;
    await queryClient.invalidateQueries({
      queryKey: schoolQueryKeys.managementTableInstance(orgId, schoolId, instanceId),
    });
    await queryClient.invalidateQueries({
      queryKey: ["school", "management-tables", "rows", orgId, schoolId, instanceId],
    });
  };

  const appendColumnMutation = useMutation({
    mutationFn: (type: ManagementTableColumnTypeDto) =>
      appendManagementTableColumn(orgId, schoolId, bundleQuery.data!.definition.id, {
        title: defaultTitleForColumnType(type),
        type,
        settings: defaultSettingsForColumnType(type),
      }),
    onSuccess: invalidateBundleAndRows,
  });

  const addColumnOptions = useMemo(
    () => filterAddColumnGroups(CLASS_LEAVE_REQUESTS_TABLE_ADD_COLUMN_GROUPS, addColumn.search),
    [addColumn.search],
  );

  const onPickAddColumnOption = (opt: ManagementTableAddColumnOption) => {
    if (!opt.supportedType) return;
    appendColumnMutation.mutate(opt.supportedType, {
      onSettled: () => addColumn.close(),
    });
  };

  const helpText = canMutate
    ? "Configure columns for the leave form. Rows appear only when students submit — review and update Status; do not add rows yourself."
    : "Submit a leave request using the form below. Each submission adds one row to the class inbox.";

  const { students } = useClassAttendanceStudents({
    orgId,
    schoolId,
    classMetadata,
  });
  const isClassStudent = Boolean(userId && students.some((s) => s.id === userId));

  if (!instanceId) {
    if (bootstrapMutation.isPending) {
      return (
        <div className="space-y-4">
          <h2 id={headingId} className={CLASS_WORKSPACE_LAYOUT.sectionTitle}>
            Leave requests
          </h2>
          <div className="h-40 animate-pulse rounded-xl border border-border-default bg-surface-muted/40" />
        </div>
      );
    }
    if (!canMutate) {
      return (
        <div
          className="flex min-h-[14rem] flex-col items-center justify-center rounded-xl border border-dashed border-border-default bg-surface-muted/20 px-6 py-12 text-center"
          role="status"
        >
          <Table2 className="mb-3 size-8 text-text-tertiary" aria-hidden />
          <p className="text-sm font-semibold text-text-primary">Leave requests table not set up</p>
          <p className="mt-2 max-w-sm text-xs leading-relaxed text-text-tertiary">
            A school manager needs to open Leave management once to create the submission form and inbox.
          </p>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <h2 id={headingId} className={CLASS_WORKSPACE_LAYOUT.sectionTitle}>
          Leave requests
        </h2>
        <p className="text-xs leading-relaxed text-text-tertiary">{helpText}</p>
        {bootstrapMutation.isError ? (
          <p className="text-sm text-red-600">{bootstrapErrorMessage(bootstrapMutation.error)}</p>
        ) : null}
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={() => bootstrapMutation.mutate()}
          disabled={bootstrapMutation.isPending}
        >
          Create leave requests table
        </Button>
      </div>
    );
  }

  if (bundleQuery.isPending) {
    return (
      <div className="space-y-4">
        <h2 id={headingId} className={CLASS_WORKSPACE_LAYOUT.sectionTitle}>
          Leave requests
        </h2>
        <div className="h-52 animate-pulse rounded-xl border border-border-default bg-surface-muted/40" />
      </div>
    );
  }

  if (bundleQuery.isError || !bundleQuery.data) {
    return (
      <p className="text-sm text-red-600">
        {bundleQuery.error instanceof ApiError ? bundleQuery.error.message : "Could not load leave requests table."}
      </p>
    );
  }

  const definitionId = bundleQuery.data.definition.id;
  const columns = bundleQuery.data.definition.columns;
  const mainGroup = bundleQuery.data.instance.tableGroups[0] ?? {
    id: "mtg_main",
    title: "Leave requests",
    order: 0,
  };

  if (!canMutate) {
    if (!isClassStudent) {
      return (
        <div
          className="flex min-h-[14rem] flex-col items-center justify-center rounded-xl border border-dashed border-border-default bg-surface-muted/20 px-6 py-12 text-center"
          role="status"
        >
          <p className="text-sm font-semibold text-text-primary">Leave requests</p>
          <p className="mt-2 max-w-sm text-xs leading-relaxed text-text-tertiary">
            Only students enrolled in this class can submit leave requests here.
          </p>
        </div>
      );
    }
    return (
      <ClassLeaveRequestSubmitForm
        orgId={orgId}
        schoolId={schoolId}
        classItemId={classItemId}
        instanceId={instanceId}
        columns={columns}
      />
    );
  }

  return (
    <section className="space-y-4" aria-labelledby={headingId}>
      <div className={CLASS_WORKSPACE_LAYOUT.sectionBar}>
        <h2 id={headingId} className={CLASS_WORKSPACE_LAYOUT.sectionTitle}>
          Leave requests
        </h2>
      </div>
      <p className="text-xs leading-relaxed text-text-tertiary">{helpText}</p>
      <ManagementTableGroupSection
        orgId={orgId}
        schoolId={schoolId}
        definitionId={definitionId}
        instanceId={instanceId}
        groupId={mainGroup.id}
        groupTitle={mainGroup.title}
        columns={columns}
        parentEnabled={canMutate}
        personPicker="class_students"
        classWorkspaceItemId={classItemId}
        allowAddRow={false}
        onlyEditableColumnTitles={["Status"]}
        emptyRowsMessage="No leave requests yet. Rows appear when students submit the leave form."
        onOpenAddColumn={addColumn.openFromButton}
      />
      <ManagementTableAddColumnPopover
        open={addColumn.open}
        anchor={addColumn.anchor}
        popoverRef={addColumn.popoverRef}
        search={addColumn.search}
        onSearchChange={addColumn.setSearch}
        groups={addColumnOptions}
        onPick={onPickAddColumnOption}
        pending={appendColumnMutation.isPending}
        zIndex={4000}
      />
    </section>
  );
}
