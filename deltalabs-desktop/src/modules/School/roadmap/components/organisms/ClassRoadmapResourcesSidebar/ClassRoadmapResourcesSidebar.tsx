"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronDown, Ghost, Plus, Search, Table2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { ApiError } from "@/lib/apiClient";
import {
  bootstrapGhostOpsTable,
  fetchSchoolGhosts,
  type GhostDto,
} from "@/modules/School/api";
import { GhostDrawer } from "@/modules/School/ghost";
import { schoolQueryKeys } from "@/modules/School/hooks/schoolQueryKeys";
import { ClassRoadmapResourceRow } from "@/modules/School/roadmap/components/molecules/ClassRoadmapResourceRow";
import type { ClassRoadmapSidebarResource } from "@/modules/School/roadmap/types";

function CollapsibleGroup({
  title,
  defaultOpen = true,
  children,
}: Readonly<{
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}>) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border-default last:border-b-0">
      <button
        type="button"
        className="flex w-full items-center justify-between px-1 py-3 text-left text-sm font-semibold text-text-primary"
        onClick={() => setOpen((v) => !v)}
      >
        {title}
        <ChevronDown
          className={["size-4 text-text-tertiary transition-transform", open ? "rotate-0" : "-rotate-90"].join(" ")}
          aria-hidden
        />
      </button>
      {open ? <div className="pb-3">{children}</div> : null}
    </div>
  );
}

function filterResources(
  items: readonly ClassRoadmapSidebarResource[],
  query: string,
): readonly ClassRoadmapSidebarResource[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter(
    (item) => item.title.toLowerCase().includes(q) || (item.subtitle?.toLowerCase().includes(q) ?? false),
  );
}

function ghostStatusLabel(status: GhostDto["status"]): string {
  switch (status) {
    case "in_progress":
      return "In progress";
    case "fulfilled":
      return "Fulfilled";
    case "cancelled":
      return "Cancelled";
    default:
      return "Open";
  }
}

function GhostOpsTableButton({
  orgId,
  schoolId,
  classItemId,
}: Readonly<{ orgId: string; schoolId: string; classItemId: string }>) {
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: () => bootstrapGhostOpsTable(orgId, schoolId, classItemId),
    onSuccess: (boot) => {
      router.push(
        `/features/school/${encodeURIComponent(schoolId)}/management-tables/${encodeURIComponent(boot.instanceId)}`,
      );
    },
  });
  return (
    <button
      type="button"
      disabled={mutation.isPending}
      onClick={() => mutation.mutate()}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border-default px-3 py-2 text-sm font-semibold text-text-primary hover:bg-surface-muted/50 disabled:opacity-50"
    >
      <Table2 className="size-4" aria-hidden />
      {mutation.isPending ? "Opening…" : "Ghost ops table"}
    </button>
  );
}

export function ClassRoadmapResourcesSidebar({
  orgId,
  schoolId,
  classItemId,
  canMutate,
  sessions,
  courses,
  materials,
  loading,
}: Readonly<{
  orgId: string;
  schoolId: string;
  classItemId: string;
  canMutate: boolean;
  sessions: readonly ClassRoadmapSidebarResource[];
  courses: readonly ClassRoadmapSidebarResource[];
  materials: readonly ClassRoadmapSidebarResource[];
  loading?: boolean;
}>) {
  const [tab, setTab] = useState<"resources" | "ghost">("resources");
  const [query, setQuery] = useState("");
  const [ghostOpen, setGhostOpen] = useState(false);
  const [activeGhostId, setActiveGhostId] = useState<string | null>(null);

  const filteredSessions = useMemo(() => filterResources(sessions, query), [query, sessions]);
  const filteredCourses = useMemo(() => filterResources(courses, query), [query, courses]);
  const filteredMaterials = useMemo(() => filterResources(materials, query), [materials, query]);

  const ghostsQuery = useQuery({
    queryKey: schoolQueryKeys.ghosts(orgId, schoolId, "class", classItemId),
    queryFn: () =>
      fetchSchoolGhosts(orgId, schoolId, { hostType: "class", hostId: classItemId }),
    enabled: tab === "ghost" && Boolean(orgId && schoolId && classItemId),
  });

  return (
    <aside className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl border border-border-default bg-surface-default shadow-sm">
      <div className="flex shrink-0 border-b border-border-default">
        <button
          type="button"
          className={[
            "flex-1 px-4 py-3 text-sm font-semibold transition-colors",
            tab === "resources"
              ? "border-b-2 border-primary-600 text-text-primary"
              : "text-text-tertiary hover:text-text-secondary",
          ].join(" ")}
          onClick={() => setTab("resources")}
        >
          Resources
        </button>
        <button
          type="button"
          className={[
            "flex-1 px-4 py-3 text-sm font-semibold transition-colors",
            tab === "ghost"
              ? "border-b-2 border-primary-600 text-text-primary"
              : "text-text-tertiary hover:text-text-secondary",
          ].join(" ")}
          onClick={() => setTab("ghost")}
        >
          Ghost Res.
        </button>
      </div>

      {tab === "resources" ? (
        <>
          <div className="shrink-0 border-b border-border-default p-3">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-tertiary" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                className="h-10 w-full rounded-lg border border-border-default bg-surface-muted/20 pl-9 pr-3 text-sm outline-none focus:border-primary-400"
              />
            </label>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3">
            <CollapsibleGroup title="Sessions">
              {loading ? (
                <p className="px-2 py-3 text-xs text-text-tertiary">Loading sessions…</p>
              ) : filteredSessions.length === 0 ? (
                <p className="px-2 py-3 text-xs text-text-tertiary">
                  No class sessions yet. Create them on the Class tab.
                </p>
              ) : (
                filteredSessions.map((resource) => (
                  <ClassRoadmapResourceRow key={resource.id} resource={resource} />
                ))
              )}
            </CollapsibleGroup>

            <CollapsibleGroup title="Class materials">
              {loading ? (
                <p className="px-2 py-3 text-xs text-text-tertiary">Loading class materials…</p>
              ) : filteredMaterials.length === 0 ? (
                <p className="px-2 py-3 text-xs text-text-tertiary">
                  No assignments, exams, or video lessons yet. Add rows on Assignments / Schedule tabs.
                </p>
              ) : (
                filteredMaterials.map((resource) => (
                  <ClassRoadmapResourceRow key={resource.id} resource={resource} />
                ))
              )}
            </CollapsibleGroup>

            <CollapsibleGroup title="Courses">
              {loading ? (
                <p className="px-2 py-3 text-xs text-text-tertiary">Loading courses…</p>
              ) : filteredCourses.length === 0 ? (
                <p className="px-2 py-3 text-xs text-text-tertiary">No school courses in this workspace yet.</p>
              ) : (
                filteredCourses.map((resource) => (
                  <ClassRoadmapResourceRow key={resource.id} resource={resource} />
                ))
              )}
            </CollapsibleGroup>
          </div>
        </>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="shrink-0 space-y-2 border-b border-border-default p-3">
            <button
              type="button"
              disabled={!canMutate}
              onClick={() => {
                setActiveGhostId(null);
                setGhostOpen(true);
              }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-800 px-3 py-2.5 text-sm font-semibold text-white hover:bg-primary-900 disabled:opacity-50"
            >
              <Plus className="size-4" aria-hidden />
              Create ghost
            </button>
            {canMutate ? (
              <GhostOpsTableButton
                orgId={orgId}
                schoolId={schoolId}
                classItemId={classItemId}
              />
            ) : null}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
            {ghostsQuery.isPending ? (
              <p className="px-2 py-6 text-center text-xs text-text-tertiary">Loading ghosts…</p>
            ) : ghostsQuery.isError ? (
              <p className="px-2 py-6 text-center text-xs text-red-600">
                {ghostsQuery.error instanceof ApiError
                  ? ghostsQuery.error.message
                  : "Could not load ghosts."}
              </p>
            ) : (ghostsQuery.data?.items.length ?? 0) === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 px-4 py-10 text-center">
                <Ghost className="size-8 text-primary-800" strokeWidth={1.4} aria-hidden />
                <p className="text-sm text-text-tertiary">
                  No ghost resources for this class yet. Create one to define a missing asset.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {ghostsQuery.data!.items.map((g) => (
                  <li key={g.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveGhostId(g.id);
                        setGhostOpen(true);
                      }}
                      className="flex w-full items-start gap-3 rounded-xl border border-border-default bg-white px-3 py-3 text-left shadow-sm transition-colors hover:bg-surface-muted/40"
                    >
                      <Ghost className="mt-0.5 size-4 shrink-0 text-primary-800" aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-text-primary">
                          {g.title || g.description || "Untitled ghost"}
                        </span>
                        <span className="mt-0.5 block text-xs text-text-tertiary">
                          {ghostStatusLabel(g.status)}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <GhostDrawer
        open={ghostOpen}
        canMutate={canMutate}
        ghostId={activeGhostId}
        host={{
          orgId,
          schoolId,
          hostType: "class",
          hostWorkspaceItemId: classItemId,
          slotKey: "class.library",
          resourceKind: "document",
          defaultNodeName: "Class resource",
        }}
        onClose={() => {
          setGhostOpen(false);
          void ghostsQuery.refetch();
        }}
        onGhostCreated={(g) => setActiveGhostId(g.id)}
      />
    </aside>
  );
}
