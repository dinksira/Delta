"use client";

import { useQuery } from "@tanstack/react-query";
import { Search, Table2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { DialogOverlay } from "@/components/theme";
import { fetchManagementTableDefinitions } from "@/modules/School/api";
import type { CourseTableVisibility } from "@/modules/School/course/courseTablesMeta";
import { schoolQueryKeys } from "@/modules/School/hooks/schoolQueryKeys";

export type CourseCreateTablePayload = Readonly<{
  title: string;
  visibility: CourseTableVisibility;
  /** When set, create instance from this definition (template). Otherwise create a blank definition. */
  templateDefinitionId: string | null;
  templateLabel: string;
}>;

type Props = Readonly<{
  open: boolean;
  orgId: string;
  schoolId: string;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onCreate: (payload: CourseCreateTablePayload) => void;
}>;

export function CourseCreateManagementTableModal({
  open,
  orgId,
  schoolId,
  busy,
  error,
  onClose,
  onCreate,
}: Props) {
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState<CourseTableVisibility>("self_owned");
  const [typeOpen, setTypeOpen] = useState(false);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [templateSearch, setTemplateSearch] = useState("");

  const definitionsQuery = useQuery({
    queryKey: schoolQueryKeys.managementTableDefinitions(orgId, schoolId, "all"),
    queryFn: () => fetchManagementTableDefinitions(orgId, schoolId, "all"),
    enabled: open,
    staleTime: 10_000,
  });

  const templates = useMemo(() => {
    const items = definitionsQuery.data?.items ?? [];
    const q = templateSearch.trim().toLowerCase();
    if (!q) return items;
    return items.filter((d) => d.title.toLowerCase().includes(q));
  }, [definitionsQuery.data?.items, templateSearch]);

  if (!open) return null;

  const selectedTemplate = templates.find((t) => t.id === templateId) ?? null;

  const submit = () => {
    const name = title.trim();
    if (!name || busy) return;
    onCreate({
      title: name,
      visibility,
      templateDefinitionId: templateId,
      templateLabel: selectedTemplate?.title ?? "Template Based",
    });
  };

  return createPortal(
    <>
      <DialogOverlay onClose={() => (busy ? null : onClose())} />
      <div className="fixed inset-0 z-[1320] flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Create management table"
          className="flex max-h-[min(90vh,40rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-surface-default shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 pt-5">
            <span className="inline-flex size-9 items-center justify-center rounded-full border border-border-default text-primary-700">
              <Table2 className="size-4" aria-hidden />
            </span>
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              className="rounded-md p-1.5 text-text-tertiary hover:bg-surface-muted hover:text-text-secondary"
              aria-label="Close"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>

          <div className="space-y-4 overflow-y-auto px-5 pb-5 pt-3">
            <h3 className="text-xl font-semibold text-text-primary">Create management Table</h3>

            <label className="block text-xs font-medium text-text-secondary">
              Table Name
              <input
                value={title}
                disabled={busy}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="write Table Name Here...."
                className="mt-1.5 w-full rounded-xl border border-border-default bg-surface-default px-3.5 py-2.5 text-sm text-text-primary outline-none focus:border-primary-500"
              />
            </label>

            <div className="relative">
              <p className="text-xs font-medium text-text-secondary">Table Type</p>
              <button
                type="button"
                disabled={busy}
                onClick={() => setTypeOpen((v) => !v)}
                className="mt-1.5 flex w-full items-center justify-between rounded-xl border border-border-default bg-surface-default px-3.5 py-2.5 text-left text-sm text-text-primary"
              >
                <span>{visibility === "sharable" ? "Sharable" : "Self Owned"}</span>
                <span className="text-text-tertiary" aria-hidden>
                  ▾
                </span>
              </button>
              {typeOpen ? (
                <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-border-default bg-surface-default py-1 shadow-lg">
                  {(
                    [
                      ["self_owned", "Self Owned"],
                      ["sharable", "Sharable"],
                    ] as const
                  ).map(([id, label]) => (
                    <li key={id}>
                      <button
                        type="button"
                        className="w-full px-3.5 py-2.5 text-left text-sm text-text-primary hover:bg-surface-muted"
                        onClick={() => {
                          setVisibility(id);
                          setTypeOpen(false);
                        }}
                      >
                        {label}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div>
              <p className="text-xs font-medium text-text-secondary">Template</p>
              <div className="mt-1.5 overflow-hidden rounded-xl border border-dashed border-border-default">
                <div className="relative border-b border-border-default/70 px-3 py-2">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-text-tertiary"
                    aria-hidden
                  />
                  <input
                    value={templateSearch}
                    disabled={busy}
                    onChange={(e) => setTemplateSearch(e.target.value)}
                    placeholder="Search templates…"
                    className="w-full bg-transparent py-1 pl-6 text-xs outline-none placeholder:text-text-tertiary"
                  />
                </div>
                <div className="max-h-40 overflow-y-auto">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setTemplateId(null)}
                    className={[
                      "flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors",
                      templateId === null
                        ? "bg-primary-50 text-primary-800"
                        : "text-text-secondary hover:bg-surface-muted",
                    ].join(" ")}
                  >
                    <span className="inline-flex size-10 items-center justify-center rounded-lg bg-surface-muted">
                      <Table2 className="size-5 text-text-tertiary" aria-hidden />
                    </span>
                    <span>
                      <span className="block font-medium">Blank table</span>
                      <span className="text-xs text-text-tertiary">Start without a template</span>
                    </span>
                  </button>
                  {definitionsQuery.isPending ? (
                    <p className="px-4 py-6 text-center text-xs text-text-tertiary">Loading…</p>
                  ) : templates.length === 0 ? (
                    <p className="px-4 py-6 text-center text-xs text-text-tertiary">Chose template</p>
                  ) : (
                    templates.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        disabled={busy}
                        onClick={() => setTemplateId(t.id)}
                        className={[
                          "flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors",
                          templateId === t.id
                            ? "bg-primary-50 text-primary-800"
                            : "text-text-secondary hover:bg-surface-muted",
                        ].join(" ")}
                      >
                        <span className="inline-flex size-10 items-center justify-center rounded-lg bg-surface-muted">
                          <Search className="size-5 text-text-tertiary" aria-hidden />
                        </span>
                        <span>
                          <span className="block font-medium">{t.title}</span>
                          <span className="text-xs text-text-tertiary">
                            {t.visibility === "sharable" ? "Sharable" : "Self owned"} ·{" "}
                            {t.columns.length} columns
                          </span>
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                disabled={busy}
                onClick={onClose}
                className="rounded-xl border border-border-default px-5 py-2 text-sm font-semibold text-text-secondary hover:bg-surface-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy || !title.trim()}
                onClick={submit}
                className="rounded-xl bg-primary-800 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-900 disabled:opacity-50"
              >
                {busy ? "Creating…" : "Create"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
