"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Table2, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useMemo, useState } from "react";

import { Button, DialogOverlay, DialogPanel } from "@/components/theme";
import { ApiError } from "@/lib/apiClient";
import {
  bootstrapManagementTableWorkspaceItem,
  createManagementTableDefinition,
  createManagementTableInstance,
  fetchManagementTableDefinitions,
  type SchoolWorkspaceItemDto,
  updateSchoolWorkspaceItem,
} from "@/modules/School/api";
import { schoolQueryKeys } from "@/modules/School/hooks/schoolQueryKeys";

type ManagementTableTemplatePickerModalProps = Readonly<{
  open: boolean;
  orgId: string;
  schoolId: string;
  workspaceItem: Pick<SchoolWorkspaceItemDto, "id" | "title">;
  onClose: () => void;
  onOpenedInstance: (instanceId: string) => void;
}>;

export function ManagementTableTemplatePickerModal({
  open,
  orgId,
  schoolId,
  workspaceItem,
  onClose,
  onOpenedInstance,
}: ManagementTableTemplatePickerModalProps) {
  const queryClient = useQueryClient();
  const [scope, setScope] = useState<"all" | "template" | "mine">("all");
  const [search, setSearch] = useState("");
  const [createName, setCreateName] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const definitionsQuery = useQuery({
    queryKey: schoolQueryKeys.managementTableDefinitions(orgId, schoolId, scope),
    queryFn: () => fetchManagementTableDefinitions(orgId, schoolId, scope),
    enabled: open,
    placeholderData: keepPreviousData,
    staleTime: 10_000,
    retry: false,
  });

  const filtered = useMemo(() => {
    const items = definitionsQuery.data?.items ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((d) => d.title.toLowerCase().includes(q));
  }, [definitionsQuery.data?.items, search]);

  const linkInstance = useMutation({
    mutationFn: async (definitionId: string) => {
      const bundle = await createManagementTableInstance(orgId, schoolId, {
        definitionId,
        title: workspaceItem.title,
        workspaceItemId: workspaceItem.id,
      });
      await updateSchoolWorkspaceItem(orgId, schoolId, workspaceItem.id, {
        metadata: {
          managementTableInstanceId: bundle.instance.id,
          managementTableDefinitionId: bundle.definition.id,
        },
      });
      return bundle.instance.id;
    },
    onSuccess: (instanceId) => {
      void queryClient.invalidateQueries({
        queryKey: ["school", "workspace-item", orgId, schoolId],
      });
      onOpenedInstance(instanceId);
    },
  });

  const bootstrapBlank = useMutation({
    mutationFn: async () => {
      const data = await bootstrapManagementTableWorkspaceItem(orgId, schoolId, workspaceItem.id);
      return data.instance.id;
    },
    onSuccess: (instanceId) => {
      void queryClient.invalidateQueries({
        queryKey: ["school", "workspace-item", orgId, schoolId],
      });
      onOpenedInstance(instanceId);
    },
  });

  const createTemplate = useMutation({
    mutationFn: async () => {
      const title = createName.trim();
      if (!title) throw new Error("Template name is required.");
      return await createManagementTableDefinition(orgId, schoolId, { title, visibility: "self_owned" });
    },
    onSuccess: async (def) => {
      setCreateOpen(false);
      setCreateName("");
      await queryClient.invalidateQueries({
        queryKey: ["school", "management-tables", "definitions", orgId, schoolId],
      });
      linkInstance.mutate(def.id);
    },
  });

  if (!open) return null;

  const busy = linkInstance.isPending || bootstrapBlank.isPending || createTemplate.isPending;
  const errorMessage =
    (linkInstance.error instanceof ApiError ? linkInstance.error.message : null) ??
    (bootstrapBlank.error instanceof ApiError ? bootstrapBlank.error.message : null) ??
    (createTemplate.error instanceof ApiError ? createTemplate.error.message : null) ??
    (createTemplate.error instanceof Error ? createTemplate.error.message : null);

  return createPortal(
    <>
      <DialogOverlay onClose={() => (busy ? null : onClose())} />
      <div className="fixed inset-0 z-[1310] flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-5xl px-6 py-5" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-2xl font-semibold text-text-primary">Management Table</h3>
              <p className="mt-1 text-xs text-text-tertiary">
                Choose a template for <span className="font-medium text-text-secondary">{workspaceItem.title}</span>
              </p>
            </div>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-surface-muted hover:text-text-primary"
              aria-label="Close"
              disabled={busy}
              onClick={onClose}
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-border-default bg-surface-default p-0.5">
                {(
                  [
                    ["all", "All"],
                    ["template", "Sharable"],
                    ["mine", "Mine"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setScope(id)}
                    className={[
                      "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                      scope === id ? "bg-primary-600 text-white shadow-sm" : "text-text-secondary hover:bg-surface-muted",
                    ].join(" ")}
                    disabled={busy}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <label className="flex w-[22rem] max-w-[70vw] items-center gap-2 rounded-full border border-border-default bg-surface-default px-4 py-2">
                <Search className="size-4 text-text-tertiary" aria-hidden />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search for Inherit Table"
                  className="min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-tertiary"
                />
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={() => bootstrapBlank.mutate()}>
                Start blank
              </Button>
              <Button type="button" variant="primary" size="sm" disabled={busy} onClick={() => setCreateOpen(true)}>
                <Plus className="size-4" aria-hidden />
                Add New
              </Button>
            </div>
          </div>

          {errorMessage ? <p className="mt-3 text-sm text-red-600">{errorMessage}</p> : null}

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            {definitionsQuery.isPending ? (
              <div className="col-span-full py-10 text-center text-sm text-text-secondary">Loading templates…</div>
            ) : filtered.length === 0 ? (
              <div className="col-span-full py-10 text-center text-sm text-text-secondary">
                No templates found. Create a new one or start blank.
              </div>
            ) : (
              filtered.map((def) => (
                <article
                  key={def.id}
                  className="flex flex-col rounded-xl border border-border-default bg-surface-default px-4 py-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-base font-semibold text-text-primary">{def.title}</p>
                    <Table2 className="size-4 text-text-tertiary" aria-hidden />
                  </div>
                  <p className="mt-1 text-xs text-text-tertiary">
                    {def.visibility === "sharable" ? "Sharable" : "Self owned"} · {def.columns.length} columns
                  </p>
                  <div className="mt-auto pt-5">
                    <Button type="button" variant="primary" size="sm" disabled={busy} onClick={() => linkInstance.mutate(def.id)}>
                      Inherit
                    </Button>
                  </div>
                </article>
              ))
            )}
          </div>

          {createOpen ? (
            <div className="mt-6 rounded-xl border border-border-default bg-surface-muted/40 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-text-primary">Create template</p>
                <button
                  type="button"
                  className="text-sm text-text-tertiary hover:text-text-secondary"
                  onClick={() => setCreateOpen(false)}
                  disabled={busy}
                >
                  Cancel
                </button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="Template name"
                  className="h-10 w-full max-w-md rounded-md border border-border-default bg-surface-default px-3 text-sm text-text-primary outline-none focus:border-primary-500"
                />
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={busy || !createName.trim()}
                  onClick={() => createTemplate.mutate()}
                >
                  Create & Use
                </Button>
              </div>
            </div>
          ) : null}
        </DialogPanel>
      </div>
    </>,
    document.body,
  );
}

