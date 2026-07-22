"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeftRight,
  Filter,
  MoreVertical,
  Move,
  Search,
  Table2,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { DialogOverlay } from "@/components/theme";
import { ApiError } from "@/lib/apiClient";
import { useAuthSession } from "@/contexts/AuthSession_Context";
import type { AuthSessionPayload } from "@/modules/Auth/types/auth";
import type { ManagementTableColumnTypeDto, SchoolWorkspaceItemDto } from "@/modules/School/api";
import {
  appendManagementTableColumn,
  createManagementTableDefinition,
  createManagementTableInstance,
  createManagementTableTableGroup,
  fetchManagementTableDefinitions,
  fetchManagementTableInstanceBundle,
  updateSchoolWorkspaceItem,
} from "@/modules/School/api";
import {
  CourseCreateManagementTableModal,
  type CourseCreateTablePayload,
} from "@/modules/School/course/CourseCreateManagementTableModal";
import {
  courseTablesToMetadataPatch,
  parseCourseTablesFromMetadata,
  relativeTimeLabel,
  type CourseTableEntry,
} from "@/modules/School/course/courseTablesMeta";
import { ManagementTableAddColumnPopover } from "@/modules/School/managementTable/ManagementTableAddColumnPopover";
import {
  MANAGEMENT_TABLE_ADD_COLUMN_GROUPS,
  defaultSettingsForColumnType,
  defaultTitleForColumnType,
  filterAddColumnGroups,
  type ManagementTableAddColumnOption,
} from "@/modules/School/managementTable/columnTypeMeta";
import { ManagementTableGroupSection } from "@/modules/School/managementTable/ManagementTableGroupSection";
import { useManagementTableAddColumnPopover } from "@/modules/School/managementTable/useManagementTableAddColumnPopover";
import { schoolQueryKeys } from "@/modules/School/hooks/schoolQueryKeys";

function newLocalId(): string {
  return `ct_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function displayNameFromSession(session: AuthSessionPayload | null): string {
  const full = session?.user?.fullName?.trim();
  if (full) return full;
  const username = session?.user?.username?.trim();
  if (username) return username;
  const email = session?.user?.email?.trim();
  if (email) return email.split("@")[0] || "You";
  return "You";
}

export function CourseIntroManagementTableView({
  orgId,
  schoolId,
  courseItem,
  canMutate,
}: Readonly<{
  orgId: string;
  schoolId: string;
  courseItem: SchoolWorkspaceItemDto;
  canMutate: boolean;
}>) {
  const queryClient = useQueryClient();
  const { session } = useAuthSession();
  const [tables, setTables] = useState<CourseTableEntry[]>(() =>
    parseCourseTablesFromMetadata(courseItem.metadata ?? undefined),
  );
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [inheritOpen, setInheritOpen] = useState(false);
  const [activeInstanceId, setActiveInstanceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTables(parseCourseTablesFromMetadata(courseItem.metadata ?? undefined));
  }, [courseItem.metadata, courseItem.id]);

  const persistTables = async (next: CourseTableEntry[]) => {
    setTables(next);
    await updateSchoolWorkspaceItem(orgId, schoolId, courseItem.id, {
      metadata: {
        ...(courseItem.metadata ?? {}),
        ...courseTablesToMetadataPatch(next),
      },
    });
    await queryClient.invalidateQueries({
      queryKey: schoolQueryKeys.workspaceItem(orgId, schoolId, courseItem.id),
    });
  };

  const createMutation = useMutation({
    mutationFn: async (payload: CourseCreateTablePayload) => {
      let definitionId = payload.templateDefinitionId;
      let templateLabel = payload.templateLabel;
      if (!definitionId) {
        const def = await createManagementTableDefinition(orgId, schoolId, {
          title: payload.title,
          visibility: payload.visibility,
        });
        definitionId = def.id;
        templateLabel = "Template Based";
      }
      const bundle = await createManagementTableInstance(orgId, schoolId, {
        definitionId,
        title: payload.title,
        workspaceItemId: courseItem.id,
      });
      const entry: CourseTableEntry = {
        id: newLocalId(),
        instanceId: bundle.instance.id,
        definitionId: bundle.definition.id,
        title: payload.title,
        visibility: payload.visibility,
        templateLabel,
        createdByName: displayNameFromSession(session),
        createdAt: new Date().toISOString(),
      };
      const next = [entry, ...tables];
      await persistTables(next);
      return entry;
    },
    onSuccess: (entry) => {
      setCreateOpen(false);
      setError(null);
      setActiveInstanceId(entry.instanceId);
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : "Could not create table.");
    },
  });

  const inheritMutation = useMutation({
    mutationFn: async (definitionId: string) => {
      const defs = await fetchManagementTableDefinitions(orgId, schoolId, "all");
      const source = defs.items.find((d) => d.id === definitionId);
      if (!source) throw new Error("Template not found.");
      const bundle = await createManagementTableInstance(orgId, schoolId, {
        definitionId,
        title: source.title,
        workspaceItemId: courseItem.id,
      });
      const entry: CourseTableEntry = {
        id: newLocalId(),
        instanceId: bundle.instance.id,
        definitionId: bundle.definition.id,
        title: source.title,
        visibility: source.visibility === "sharable" ? "sharable" : "self_owned",
        templateLabel: "Template Based",
        createdByName: displayNameFromSession(session),
        createdAt: new Date().toISOString(),
      };
      const next = [entry, ...tables];
      await persistTables(next);
      return entry;
    },
    onSuccess: (entry) => {
      setInheritOpen(false);
      setError(null);
      setActiveInstanceId(entry.instanceId);
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : "Could not inherit table.");
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tables;
    return tables.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.createdByName.toLowerCase().includes(q) ||
        t.templateLabel.toLowerCase().includes(q),
    );
  }, [tables, search]);

  const busy = createMutation.isPending || inheritMutation.isPending;

  const modals = (
    <>
      <CourseCreateManagementTableModal
        open={createOpen}
        orgId={orgId}
        schoolId={schoolId}
        busy={createMutation.isPending}
        error={createOpen ? error : null}
        onClose={() => !createMutation.isPending && setCreateOpen(false)}
        onCreate={(payload) => {
          setError(null);
          createMutation.mutate(payload);
        }}
      />
      <CourseInheritTableModal
        open={inheritOpen}
        orgId={orgId}
        schoolId={schoolId}
        busy={inheritMutation.isPending}
        error={inheritOpen ? error : null}
        onClose={() => !inheritMutation.isPending && setInheritOpen(false)}
        onInherit={(definitionId) => {
          setError(null);
          inheritMutation.mutate(definitionId);
        }}
      />
    </>
  );

  if (activeInstanceId) {
    return (
      <>
        <CourseTableBoard
          orgId={orgId}
          schoolId={schoolId}
          courseTitle={courseItem.title}
          instanceId={activeInstanceId}
          canMutate={canMutate}
          onBack={() => setActiveInstanceId(null)}
          onCreateNew={() => {
            setError(null);
            setCreateOpen(true);
          }}
        />
        {modals}
      </>
    );
  }

  return (
    <div className="space-y-6" aria-label="Course management tables">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          disabled={!canMutate || busy}
          onClick={() => setInheritOpen(true)}
          className="rounded-xl border border-primary-700/80 bg-surface-default px-4 py-2 text-sm font-semibold text-primary-800 transition-colors hover:bg-primary-50 disabled:opacity-50"
        >
          Inherit Table
        </button>
        <button
          type="button"
          disabled={!canMutate || busy}
          onClick={() => {
            setError(null);
            setCreateOpen(true);
          }}
          className="rounded-xl bg-primary-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-900 disabled:opacity-50"
        >
          Create New
        </button>
      </div>

      <div className="mx-auto flex w-full max-w-xl items-center gap-2">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-border-default bg-surface-default px-4 py-2.5 shadow-sm">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-text-tertiary"
          />
          <Search className="size-4 shrink-0 text-text-tertiary" aria-hidden />
        </label>
        <button
          type="button"
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-border-default bg-surface-default text-text-secondary hover:bg-surface-muted"
          aria-label="Filter"
          title="Filter"
        >
          <Filter className="size-4" aria-hidden />
        </button>
      </div>

      {error && !createOpen && !inheritOpen ? (
        <p className="text-center text-sm text-red-600">{error}</p>
      ) : null}

      {tables.length === 0 ? (
        <div className="flex min-h-[16rem] flex-col items-center justify-center px-4 py-12 text-center">
          <div className="mb-4 flex size-28 items-center justify-center rounded-full bg-primary-50">
            <div className="relative">
              <Table2 className="size-14 text-primary-300" strokeWidth={1.15} aria-hidden />
              <Search
                className="absolute -bottom-1 -right-2 size-8 rounded-full bg-surface-default p-1 text-primary-500 shadow-sm"
                strokeWidth={1.5}
                aria-hidden
              />
            </div>
          </div>
          <p className="text-lg font-bold text-text-primary">No Table yet</p>
          <p className="mt-1 text-sm text-text-tertiary">Create New Above</p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <li
              key={t.id}
              className="flex flex-col rounded-2xl border border-border-default bg-surface-default p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-base font-semibold text-text-primary">{t.title}</p>
                <button
                  type="button"
                  className="rounded-md p-1 text-text-tertiary hover:bg-surface-muted"
                  aria-label="Table menu"
                >
                  <MoreVertical className="size-4" aria-hidden />
                </button>
              </div>
              <ul className="mt-3 space-y-1.5 text-xs text-text-secondary">
                <li className="flex items-center gap-2">
                  <Table2 className="size-3.5 text-text-tertiary" aria-hidden />
                  {t.templateLabel}
                </li>
                <li className="flex items-center gap-2">
                  <Users className="size-3.5 text-text-tertiary" aria-hidden />
                  {t.createdByName}
                </li>
                <li className="text-text-tertiary">{relativeTimeLabel(t.createdAt)}</li>
              </ul>
              <button
                type="button"
                onClick={() => setActiveInstanceId(t.instanceId)}
                className="mt-5 w-full rounded-xl bg-surface-muted py-2.5 text-sm font-semibold text-primary-800 transition-colors hover:bg-primary-100"
              >
                Open
              </button>
            </li>
          ))}
        </ul>
      )}

      {modals}
    </div>
  );
}

function CourseInheritTableModal({
  open,
  orgId,
  schoolId,
  busy,
  error,
  onClose,
  onInherit,
}: Readonly<{
  open: boolean;
  orgId: string;
  schoolId: string;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onInherit: (definitionId: string) => void;
}>) {
  const [search, setSearch] = useState("");
  const definitionsQuery = useQuery({
    queryKey: schoolQueryKeys.managementTableDefinitions(orgId, schoolId, "all"),
    queryFn: () => fetchManagementTableDefinitions(orgId, schoolId, "all"),
    enabled: open,
  });

  const filtered = useMemo(() => {
    const items = definitionsQuery.data?.items ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((d) => d.title.toLowerCase().includes(q));
  }, [definitionsQuery.data?.items, search]);

  if (!open) return null;

  return createPortal(
    <>
      <DialogOverlay onClose={() => (busy ? null : onClose())} />
      <div className="fixed inset-0 z-[1320] flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Inherit table"
          className="flex max-h-[min(90vh,36rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-surface-default shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-border-default px-5 py-4">
            <h3 className="text-lg font-semibold text-text-primary">Inherit Table</h3>
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              className="rounded-md p-1 text-text-tertiary hover:bg-surface-muted"
              aria-label="Close"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
          <div className="px-5 pt-4">
            <label className="flex items-center gap-2 rounded-full border border-border-default px-4 py-2">
              <Search className="size-4 text-text-tertiary" aria-hidden />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for Inherit Table"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
            </label>
          </div>
          {error ? <p className="px-5 pt-3 text-sm text-red-600">{error}</p> : null}
          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            {definitionsQuery.isPending ? (
              <p className="py-8 text-center text-sm text-text-tertiary">Loading…</p>
            ) : filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-text-tertiary">No templates found</p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {filtered.map((d) => (
                  <li
                    key={d.id}
                    className="flex flex-col rounded-xl border border-border-default p-3"
                  >
                    <p className="font-semibold text-text-primary">{d.title}</p>
                    <p className="mt-1 text-xs text-text-tertiary">
                      {d.visibility === "sharable" ? "Sharable" : "Self owned"} · {d.columns.length}{" "}
                      columns
                    </p>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onInherit(d.id)}
                      className="mt-3 rounded-lg bg-primary-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-900 disabled:opacity-50"
                    >
                      Inherit
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}

function CourseTableBoard({
  orgId,
  schoolId,
  courseTitle,
  instanceId,
  canMutate,
  onBack,
  onCreateNew,
}: Readonly<{
  orgId: string;
  schoolId: string;
  courseTitle: string;
  instanceId: string;
  canMutate: boolean;
  onBack: () => void;
  onCreateNew: () => void;
}>) {
  const queryClient = useQueryClient();
  const addColumn = useManagementTableAddColumnPopover();
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

  const bundleQuery = useQuery({
    queryKey: schoolQueryKeys.managementTableInstance(orgId, schoolId, instanceId),
    queryFn: () => fetchManagementTableInstanceBundle(orgId, schoolId, instanceId),
  });

  const tableGroups = useMemo(() => {
    const raw = bundleQuery.data?.instance.tableGroups;
    if (raw && raw.length > 0) return [...raw].sort((a, b) => a.order - b.order);
    return [{ id: "mtg_main", title: "Main Table", order: 0 }];
  }, [bundleQuery.data?.instance.tableGroups]);

  useEffect(() => {
    if (!activeGroupId && tableGroups[0]) setActiveGroupId(tableGroups[0].id);
  }, [activeGroupId, tableGroups]);

  const createGroupMutation = useMutation({
    mutationFn: (title: string) =>
      createManagementTableTableGroup(orgId, schoolId, instanceId, { title }),
    onSuccess: async (group) => {
      await queryClient.invalidateQueries({
        queryKey: schoolQueryKeys.managementTableInstance(orgId, schoolId, instanceId),
      });
      setActiveGroupId(group.id);
    },
  });

  const appendColumnMutation = useMutation({
    mutationFn: (type: ManagementTableColumnTypeDto) =>
      appendManagementTableColumn(orgId, schoolId, bundleQuery.data!.definition.id, {
        title: defaultTitleForColumnType(type),
        type,
        settings: defaultSettingsForColumnType(type),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: schoolQueryKeys.managementTableInstance(orgId, schoolId, instanceId),
      });
      await queryClient.invalidateQueries({
        queryKey: ["school", "management-tables", "rows", orgId, schoolId, instanceId],
      });
    },
  });

  const addColumnOptions = useMemo(
    () => filterAddColumnGroups(MANAGEMENT_TABLE_ADD_COLUMN_GROUPS, addColumn.search),
    [addColumn.search],
  );

  const onPickAddColumnOption = (opt: ManagementTableAddColumnOption) => {
    if (!opt.supportedType) {
      window.alert("This column type is coming soon.");
      return;
    }
    appendColumnMutation.mutate(opt.supportedType, {
      onSettled: () => addColumn.close(),
    });
  };

  const columns = bundleQuery.data?.definition.columns ?? [];
  const currentGroup = tableGroups.find((g) => g.id === activeGroupId) ?? tableGroups[0];

  return (
    <div className="space-y-4" aria-label="Course tables board">
      <button
        type="button"
        onClick={onBack}
        className="text-xs font-medium text-primary-700 hover:underline"
      >
        ← Back to tables
      </button>

      <p className="text-sm font-semibold text-text-primary">
        {courseTitle}
        <span className="font-normal text-text-tertiary"> / Course Tables</span>
      </p>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-text-primary"># Management Table</h2>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-xl border border-border-default bg-surface-default px-3 py-1.5 text-xs text-text-secondary">
            1th January
            <ArrowLeftRight className="size-3.5 text-text-tertiary" aria-hidden />
            7th January
          </span>
          <span className="inline-flex items-center gap-2 rounded-xl border border-border-default bg-surface-default px-3 py-1.5 text-xs text-text-secondary">
            # Table Tag
            <Filter className="size-3.5 text-text-tertiary" aria-hidden />
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 text-xs font-medium text-text-secondary">
            Tools
            <Wrench className="size-3.5" aria-hidden />
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-border-default">
        {tableGroups.map((g) => {
          const active = g.id === currentGroup?.id;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => setActiveGroupId(g.id)}
              className={[
                "inline-flex items-center gap-1.5 px-3 pb-2.5 pt-1 text-sm transition-colors",
                active
                  ? "border-b-2 border-primary-700 font-semibold text-primary-800"
                  : "font-medium text-text-secondary hover:text-text-primary",
              ].join(" ")}
            >
              <Move className="size-3.5 opacity-70" aria-hidden />
              {g.title}
            </button>
          );
        })}
        <button
          type="button"
          disabled={!canMutate || createGroupMutation.isPending}
          onClick={() =>
            createGroupMutation.mutate(`Table ${tableGroups.length + 1}`)
          }
          className="mb-2 ml-1 inline-flex size-7 items-center justify-center rounded-md text-text-tertiary hover:bg-surface-muted"
          aria-label="Add table tab"
        >
          +
        </button>
      </div>

      {bundleQuery.isPending ? (
        <p className="py-10 text-center text-sm text-text-tertiary">Loading table…</p>
      ) : bundleQuery.isError ? (
        <p className="text-sm text-red-600">
          {bundleQuery.error instanceof ApiError
            ? bundleQuery.error.message
            : "Could not load table."}
        </p>
      ) : currentGroup ? (
        <ManagementTableGroupSection
          orgId={orgId}
          schoolId={schoolId}
          definitionId={bundleQuery.data?.definition.id ?? ""}
          instanceId={instanceId}
          groupId={currentGroup.id}
          groupTitle={currentGroup.title}
          columns={columns}
          parentEnabled={Boolean(bundleQuery.data)}
          onOpenAddColumn={addColumn.openFromButton}
        />
      ) : null}

      <button
        type="button"
        disabled={!canMutate}
        onClick={onCreateNew}
        className="inline-flex items-center gap-2 rounded-xl border border-border-default bg-surface-default px-4 py-2.5 text-sm font-semibold text-text-secondary hover:bg-surface-muted disabled:opacity-50"
      >
        <Table2 className="size-4" aria-hidden />
        New Table
      </button>

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
    </div>
  );
}
