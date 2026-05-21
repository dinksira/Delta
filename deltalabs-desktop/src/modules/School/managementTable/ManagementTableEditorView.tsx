"use client";

/** Board editor: shared column schema; one or more table groups (row sets) per instance. */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Search, Table2 } from "lucide-react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { SchoolDetailUtilityActions } from "@/components/features/school/SchoolDetailUtilityActions";
import { Button, DialogOverlay, DialogPanel } from "@/components/theme";
import { ApiError } from "@/lib/apiClient";
import type { ManagementTableColumnTypeDto, ManagementTableGroupDto } from "@/modules/School/api";
import {
  appendManagementTableColumn,
  createManagementTableTableGroup,
  fetchManagementTableInstanceBundle,
} from "@/modules/School/api";
import { CLASS_WORKSPACE_LAYOUT } from "@/modules/School/class/layoutConstants";
import {
  MANAGEMENT_TABLE_ADD_COLUMN_GROUPS,
  defaultSettingsForColumnType,
  type ManagementTableAddColumnOption,
} from "@/modules/School/managementTable/columnTypeMeta";
import { ManagementTableGroupSection } from "@/modules/School/managementTable/ManagementTableGroupSection";
import { schoolQueryKeys } from "@/modules/School/hooks/schoolQueryKeys";
import { useSchoolActiveOrgId } from "@/modules/School/hooks/useSchoolActiveOrgId";

type ManagementTableEditorViewProps = Readonly<{
  schoolId: string;
  instanceId: string;
}>;

export function ManagementTableEditorView({ schoolId, instanceId }: ManagementTableEditorViewProps) {
  const queryClient = useQueryClient();
  const { activeOrgId, mySchoolsPending } = useSchoolActiveOrgId();
  const orgId = activeOrgId ?? "";
  const enabled = Boolean(orgId && schoolId && instanceId) && !mySchoolsPending;

  const [addColumnOpen, setAddColumnOpen] = useState(false);
  const [addColumnSearch, setAddColumnSearch] = useState("");
  const addColumnPopoverRef = useRef<HTMLDivElement | null>(null);
  const addColumnAnchorButtonRef = useRef<HTMLButtonElement | null>(null);
  const [addColumnAnchor, setAddColumnAnchor] = useState<null | { top: number; left: number; width: number }>(null);
  const [portalReady, setPortalReady] = useState(false);

  const [newGroupDialogOpen, setNewGroupDialogOpen] = useState(false);
  const [newGroupTitle, setNewGroupTitle] = useState("");

  useEffect(() => setPortalReady(true), []);

  const bundleQuery = useQuery({
    queryKey: schoolQueryKeys.managementTableInstance(orgId, schoolId, instanceId),
    queryFn: () => fetchManagementTableInstanceBundle(orgId, schoolId, instanceId),
    enabled,
  });

  const tableGroups: readonly ManagementTableGroupDto[] = useMemo(() => {
    const raw = bundleQuery.data?.instance.tableGroups;
    if (raw && raw.length > 0) return [...raw].sort((a, b) => a.order - b.order);
    return [{ id: "mtg_main", title: "Main Table", order: 0 }];
  }, [bundleQuery.data?.instance.tableGroups]);

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
    await queryClient.invalidateQueries({
      queryKey: schoolQueryKeys.managementTableInstance(orgId, schoolId, instanceId),
    });
    await queryClient.invalidateQueries({
      queryKey: ["school", "management-tables", "rows", orgId, schoolId, instanceId],
    });
  }, [queryClient, orgId, schoolId, instanceId]);

  const appendColumnMutation = useMutation({
    mutationFn: (type: ManagementTableColumnTypeDto) =>
      appendManagementTableColumn(orgId, schoolId, bundleQuery.data!.definition.id, {
        title: `${type.charAt(0).toUpperCase()}${type.slice(1)}`,
        type,
        settings: defaultSettingsForColumnType(type),
      }),
    onSuccess: invalidateBundleAndRows,
  });

  const createTableGroupMutation = useMutation({
    mutationFn: (title: string) => createManagementTableTableGroup(orgId, schoolId, instanceId, { title }),
    onSuccess: async () => {
      setNewGroupDialogOpen(false);
      setNewGroupTitle("");
      await invalidateBundleAndRows();
    },
  });

  const openNewTableGroupDialog = useCallback(() => {
    createTableGroupMutation.reset();
    setNewGroupTitle("");
    setNewGroupDialogOpen(true);
  }, [createTableGroupMutation]);

  const addColumnOptions = useMemo(() => {
    const q = addColumnSearch.trim().toLowerCase();
    const groups = MANAGEMENT_TABLE_ADD_COLUMN_GROUPS.map((g) => ({
      ...g,
      options: g.options.filter((o) => (q ? o.label.toLowerCase().includes(q) : true)),
    }));
    return groups.filter((g) => g.options.length > 0);
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

  useEffect(() => {
    if (!addColumnOpen) return;
    syncAnchorFromButton();
    const onScrollOrResize = () => syncAnchorFromButton();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [addColumnOpen, syncAnchorFromButton]);

  const onPickAddColumnOption = (opt: ManagementTableAddColumnOption) => {
    if (!opt.supportedType) {
      window.alert("This column type is coming soon.");
      return;
    }
    appendColumnMutation.mutate(opt.supportedType, {
      onSettled: () => {
        setAddColumnOpen(false);
        setAddColumnSearch("");
      },
    });
  };

  if (!enabled && !mySchoolsPending) {
    return <p className="text-sm text-text-secondary">Select an organization to load this table.</p>;
  }

  if (bundleQuery.isError) {
    const msg = bundleQuery.error instanceof ApiError ? bundleQuery.error.message : "Could not load table.";
    return <p className="text-sm text-red-600">{msg}</p>;
  }

  const instanceTitle = bundleQuery.data?.instance.title ?? "Loading…";
  const templateTitle = bundleQuery.data?.definition.title ?? "—";
  const columns = bundleQuery.data?.definition.columns ?? [];

  return (
    <div className={["mx-auto max-w-[100rem] pb-24", CLASS_WORKSPACE_LAYOUT.routeBodyTopPadding].join(" ")}>
      <header className="mb-7 sm:mb-9">
        <div className="flex flex-nowrap items-center justify-between gap-2.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-2.5">
            <Link
              href={`/features/school/${encodeURIComponent(schoolId)}`}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border-default bg-surface-default text-text-secondary transition-colors hover:bg-surface-muted sm:h-9 sm:w-9"
              aria-label="Back to school workspace"
            >
              <ArrowLeft className="size-4 sm:size-[1.05rem]" aria-hidden />
            </Link>
            <span
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border-default bg-surface-default text-text-secondary sm:h-9 sm:w-9"
              aria-hidden
              title="Management table"
            >
              <Table2 className="size-3.5 sm:size-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1 pr-1">
              <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1 sm:gap-x-3">
                <h1 className={[CLASS_WORKSPACE_LAYOUT.pageHeaderTitleClass, "shrink-0"].join(" ")}>Management Table</h1>
                <p className="min-w-0 truncate text-xs text-text-tertiary sm:text-sm">
                  <span className="font-medium text-text-secondary">{instanceTitle}</span>
                  <span aria-hidden className="px-1.5 text-text-tertiary sm:px-2">
                    ·
                  </span>
                  <span className="text-text-tertiary">Template </span>
                  <span className="font-medium text-text-secondary">{templateTitle}</span>
                </p>
              </div>
            </div>
          </div>
          <div className="ml-1 shrink-0 pl-1 sm:ml-2 sm:pl-2">
            <SchoolDetailUtilityActions />
          </div>
        </div>
      </header>

      {tableGroups.map((g) => (
        <ManagementTableGroupSection
          key={g.id}
          orgId={orgId}
          schoolId={schoolId}
          definitionId={bundleQuery.data?.definition.id ?? ""}
          instanceId={instanceId}
          groupId={g.id}
          groupTitle={g.title}
          columns={columns}
          parentEnabled={enabled && Boolean(bundleQuery.data)}
          onOpenAddColumn={openAddColumn}
        />
      ))}

      <div className="mt-10">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="gap-2"
          disabled={createTableGroupMutation.isPending || !bundleQuery.data}
          onClick={openNewTableGroupDialog}
        >
          <Table2 className="size-4" aria-hidden />
          New table group
        </Button>
      </div>

      {newGroupDialogOpen ? (
        <>
          <DialogOverlay
            onClose={() => !createTableGroupMutation.isPending && setNewGroupDialogOpen(false)}
          />
          <div className="fixed inset-0 z-[3500] flex items-center justify-center p-4">
            <DialogPanel className="w-full max-w-md px-5 py-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-text-primary">New table group</h3>
              <p className="mt-1 text-xs text-text-tertiary">
                Adds another grid on this page. Columns stay shared with this management table.
              </p>
              <form
                className="mt-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const t = newGroupTitle.trim();
                  if (!t || createTableGroupMutation.isPending) return;
                  createTableGroupMutation.mutate(t);
                }}
              >
                <label className="block text-sm font-medium text-text-secondary">
                  Group name
                  <input
                    value={newGroupTitle}
                    onChange={(e) => setNewGroupTitle(e.target.value)}
                    className="mt-1 w-full rounded-md border border-border-default bg-surface-default px-3 py-2 text-sm text-text-primary outline-none focus:border-primary-500"
                    placeholder="e.g. Ghost management"
                    autoFocus
                  />
                </label>
                {createTableGroupMutation.isError ? (
                  <p className="mt-2 text-sm text-red-600" role="alert">
                    {createTableGroupMutation.error instanceof ApiError
                      ? createTableGroupMutation.error.message
                      : "Could not add group. Try again."}
                  </p>
                ) : null}
                <div className="mt-5 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={createTableGroupMutation.isPending}
                    onClick={() => setNewGroupDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={createTableGroupMutation.isPending || !newGroupTitle.trim()}
                  >
                    Add group
                  </Button>
                </div>
              </form>
            </DialogPanel>
          </div>
        </>
      ) : null}

      {addColumnOpen && portalReady && addColumnAnchor
        ? createPortal(
            <div
              ref={addColumnPopoverRef}
              className="fixed z-[4000] w-[360px] rounded-2xl border border-border-default bg-[#dfe8ee] p-4 shadow-xl"
              style={{
                top: `${Math.max(8, addColumnAnchor.top)}px`,
                left: `${Math.max(8, Math.min(addColumnAnchor.left, window.innerWidth - 368))}px`,
              }}
            >
              <label className="flex items-center gap-3 rounded-xl border border-border-default bg-surface-default px-4 py-3">
                <Search className="size-5 text-text-tertiary" aria-hidden />
                <input
                  value={addColumnSearch}
                  onChange={(e) => setAddColumnSearch(e.target.value)}
                  placeholder="Search"
                  className="min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-tertiary"
                  autoFocus
                />
              </label>
              <div className="mt-4 space-y-4">
                {addColumnOptions.map((group) => (
                  <div key={group.title}>
                    <p className="mb-2 text-sm font-medium text-text-tertiary">{group.title}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {group.options.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          className={[
                            "flex items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors",
                            opt.supportedType
                              ? "bg-transparent text-text-secondary hover:bg-white/55 hover:text-text-primary"
                              : "bg-transparent text-text-tertiary hover:bg-white/40",
                          ].join(" ")}
                          onClick={() => onPickAddColumnOption(opt)}
                        >
                          <opt.icon className="size-5" aria-hidden />
                          <span className="truncate">{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
