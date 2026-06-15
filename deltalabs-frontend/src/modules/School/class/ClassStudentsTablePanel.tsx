"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Table2 } from "lucide-react";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/theme";
import { ApiError } from "@/lib/apiClient";
import type { ManagementTableColumnTypeDto } from "@/modules/School/api";
import {
  appendManagementTableColumn,
  bootstrapClassStudentsTable,
  fetchManagementTableInstanceBundle,
} from "@/modules/School/api";
import { readStudentsTableInstanceId } from "@/modules/School/class/classStudentsTableMeta";
import { CLASS_WORKSPACE_LAYOUT } from "@/modules/School/class/layoutConstants";
import {
  MANAGEMENT_TABLE_ADD_COLUMN_GROUPS,
  defaultSettingsForColumnType,
  type ManagementTableAddColumnOption,
} from "@/modules/School/managementTable/columnTypeMeta";
import { ManagementTableGroupSection } from "@/modules/School/managementTable/ManagementTableGroupSection";
import { schoolQueryKeys } from "@/modules/School/hooks/schoolQueryKeys";

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
  const queryClient = useQueryClient();
  const [instanceId, setInstanceId] = useState<string | null>(() =>
    readStudentsTableInstanceId(classMetadata),
  );
  const [addColumnOpen, setAddColumnOpen] = useState(false);
  const [addColumnSearch, setAddColumnSearch] = useState("");
  const addColumnPopoverRef = useRef<HTMLDivElement | null>(null);
  const addColumnAnchorButtonRef = useRef<HTMLButtonElement | null>(null);
  const [addColumnAnchor, setAddColumnAnchor] = useState<null | { top: number; left: number; width: number }>(
    null,
  );
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => setPortalReady(true), []);
  useEffect(() => {
    setInstanceId(readStudentsTableInstanceId(classMetadata));
  }, [classMetadata]);

  const bootstrapMutation = useMutation({
    mutationFn: () => bootstrapClassStudentsTable(orgId, schoolId, classItemId),
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
    // Auto-create the students table the first time a manager opens this tab.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canMutate, instanceId]);

  const bundleQuery = useQuery({
    queryKey: schoolQueryKeys.managementTableInstance(orgId, schoolId, instanceId ?? "none"),
    queryFn: () => fetchManagementTableInstanceBundle(orgId, schoolId, instanceId!),
    enabled: Boolean(orgId && schoolId && instanceId),
    staleTime: 15_000,
  });

  const syncAnchorFromButton = useCallback(() => {
    const btn = addColumnAnchorButtonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    setAddColumnAnchor({ top: rect.bottom + 8, left: rect.right - 360, width: rect.width });
  }, []);

  const openAddColumn = useCallback((btn: HTMLButtonElement) => {
    addColumnAnchorButtonRef.current = btn;
    const rect = btn.getBoundingClientRect();
    setAddColumnAnchor({ top: rect.bottom + 8, left: rect.right - 360, width: rect.width });
    setAddColumnOpen(true);
  }, []);

  const invalidateBundleAndRows = useCallback(async () => {
    if (!instanceId) return;
    await queryClient.invalidateQueries({
      queryKey: schoolQueryKeys.managementTableInstance(orgId, schoolId, instanceId),
    });
    await queryClient.invalidateQueries({
      queryKey: ["school", "management-tables", "rows", orgId, schoolId, instanceId],
    });
  }, [queryClient, orgId, schoolId, instanceId]);

  const appendColumnMutation = useMutation({
    mutationFn: (input: { title: string; type: ManagementTableColumnTypeDto }) =>
      appendManagementTableColumn(orgId, schoolId, bundleQuery.data!.definition.id, {
        title: input.title,
        type: input.type,
        settings: defaultSettingsForColumnType(input.type),
      }),
    onSuccess: invalidateBundleAndRows,
  });

  const addColumnOptions = useMemo(() => {
    const q = addColumnSearch.trim().toLowerCase();
    return MANAGEMENT_TABLE_ADD_COLUMN_GROUPS.map((g) => ({
      ...g,
      options: g.options.filter((o) => (q ? o.label.toLowerCase().includes(q) : true)),
    })).filter((g) => g.options.length > 0);
  }, [addColumnSearch]);

  useEffect(() => {
    if (!addColumnOpen) return;
    const onDocPointerDown = (event: PointerEvent) => {
      const btn = addColumnAnchorButtonRef.current;
      const pop = addColumnPopoverRef.current;
      if (!pop) return;
      if (event.target instanceof Node && btn?.contains(event.target)) return;
      if (event.target instanceof Node && pop.contains(event.target)) return;
      setAddColumnOpen(false);
    };
    document.addEventListener("pointerdown", onDocPointerDown);
    return () => document.removeEventListener("pointerdown", onDocPointerDown);
  }, [addColumnOpen]);

  const onPickAddColumnOption = (opt: ManagementTableAddColumnOption) => {
    if (!opt.supportedType) {
      window.alert("This column type is coming soon.");
      return;
    }
    appendColumnMutation.mutate(
      { title: opt.label, type: opt.supportedType },
      {
        onSettled: () => {
          setAddColumnOpen(false);
          setAddColumnSearch("");
        },
      },
    );
  };

  if (!instanceId) {
    if (bootstrapMutation.isPending) {
      return (
        <div className="space-y-4">
          <h2 className={CLASS_WORKSPACE_LAYOUT.sectionTitle}>Students</h2>
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
          <p className="text-sm font-semibold text-text-primary">Students table not set up</p>
          <p className="mt-2 max-w-sm text-xs leading-relaxed text-text-tertiary">
            A school manager needs to open this tab once to create the class students table.
          </p>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <h2 className={CLASS_WORKSPACE_LAYOUT.sectionTitle}>Students</h2>
        {bootstrapMutation.isError ? (
          <p className="text-sm text-red-600">
            {bootstrapMutation.error instanceof ApiError
              ? bootstrapMutation.error.message
              : "Could not create students table."}
          </p>
        ) : null}
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={() => bootstrapMutation.mutate()}
          disabled={bootstrapMutation.isPending}
        >
          Create students table
        </Button>
      </div>
    );
  }

  if (bundleQuery.isPending) {
    return (
      <div className="space-y-4">
        <h2 className={CLASS_WORKSPACE_LAYOUT.sectionTitle}>Students</h2>
        <div className="h-52 animate-pulse rounded-xl border border-border-default bg-surface-muted/40" />
      </div>
    );
  }

  if (bundleQuery.isError || !bundleQuery.data) {
    return (
      <p className="text-sm text-red-600">
        {bundleQuery.error instanceof ApiError ? bundleQuery.error.message : "Could not load students table."}
      </p>
    );
  }

  const definitionId = bundleQuery.data.definition.id;
  const columns = bundleQuery.data.definition.columns;
  const mainGroup = bundleQuery.data.instance.tableGroups[0] ?? {
    id: "mtg_main",
    title: "Main Table",
    order: 0,
  };

  return (
    <section className="space-y-4" aria-labelledby="class-students-table-title">
      <div className={CLASS_WORKSPACE_LAYOUT.sectionBar}>
        <h2 id="class-students-table-title" className={CLASS_WORKSPACE_LAYOUT.sectionTitle}>
          Students
        </h2>
      </div>
      <p className="text-xs leading-relaxed text-text-tertiary">
        Define your student fields with <span className="font-medium text-text-secondary">Add column</span>, then add
        rows with <span className="font-medium text-text-secondary">Add</span>. Enrolling an existing account by email
        also adds a row when Student and Email columns are present.
      </p>
      <ManagementTableGroupSection
        orgId={orgId}
        schoolId={schoolId}
        definitionId={definitionId}
        instanceId={instanceId}
        groupId={mainGroup.id}
        groupTitle={mainGroup.title}
        columns={columns}
        parentEnabled={canMutate}
        onOpenAddColumn={openAddColumn}
      />
      {portalReady && addColumnOpen && addColumnAnchor
        ? createPortal(
            <div
              ref={addColumnPopoverRef}
              className="fixed z-[200] w-[min(22rem,calc(100vw-1rem))] overflow-hidden rounded-xl border border-border-default bg-surface-default shadow-xl"
              style={{ top: addColumnAnchor.top, left: Math.max(8, addColumnAnchor.left) }}
              role="dialog"
              aria-label="Add column"
            >
              <div className="border-b border-border-default p-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-text-tertiary" />
                  <input
                    type="search"
                    value={addColumnSearch}
                    onChange={(e) => setAddColumnSearch(e.target.value)}
                    placeholder="Search column type"
                    className="h-9 w-full rounded-lg border border-border-default bg-surface pl-9 pr-3 text-sm outline-none ring-primary-500/40 focus:ring-2"
                  />
                </div>
              </div>
              <div className="max-h-72 overflow-y-auto p-2">
                {addColumnOptions.map((group) => (
                  <div key={group.label} className="mb-2 last:mb-0">
                    <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
                      {group.label}
                    </p>
                    <ul>
                      {group.options.map((opt) => (
                        <li key={opt.id}>
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-text-primary hover:bg-surface-muted"
                            onClick={() => onPickAddColumnOption(opt)}
                            disabled={appendColumnMutation.isPending}
                          >
                            <opt.icon className="size-4 text-text-secondary" aria-hidden />
                            {opt.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>,
            document.body,
          )
        : null}
    </section>
  );
}
