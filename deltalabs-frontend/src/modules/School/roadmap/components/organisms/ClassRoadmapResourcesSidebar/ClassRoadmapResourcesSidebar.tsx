"use client";

import { ChevronDown, Search } from "lucide-react";
import { useMemo, useState } from "react";

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
        <ChevronDown className={["size-4 text-text-tertiary transition-transform", open ? "rotate-0" : "-rotate-90"].join(" ")} aria-hidden />
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

export function ClassRoadmapResourcesSidebar({
  sessions,
  courses,
  materials,
  loading,
}: Readonly<{
  sessions: readonly ClassRoadmapSidebarResource[];
  courses: readonly ClassRoadmapSidebarResource[];
  materials: readonly ClassRoadmapSidebarResource[];
  loading?: boolean;
}>) {
  const [tab, setTab] = useState<"resources" | "ghost">("resources");
  const [query, setQuery] = useState("");

  const filteredSessions = useMemo(() => filterResources(sessions, query), [query, sessions]);
  const filteredCourses = useMemo(() => filterResources(courses, query), [query, courses]);
  const filteredMaterials = useMemo(() => filterResources(materials, query), [materials, query]);

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
                filteredSessions.map((resource) => <ClassRoadmapResourceRow key={resource.id} resource={resource} />)
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
                filteredMaterials.map((resource) => <ClassRoadmapResourceRow key={resource.id} resource={resource} />)
              )}
            </CollapsibleGroup>

            <CollapsibleGroup title="Courses">
              {loading ? (
                <p className="px-2 py-3 text-xs text-text-tertiary">Loading courses…</p>
              ) : filteredCourses.length === 0 ? (
                <p className="px-2 py-3 text-xs text-text-tertiary">No school courses in this workspace yet.</p>
              ) : (
                filteredCourses.map((resource) => <ClassRoadmapResourceRow key={resource.id} resource={resource} />)
              )}
            </CollapsibleGroup>
          </div>
        </>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
          <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-text-tertiary">
            Ghost resources will appear here when linked from other classes.
          </div>
        </div>
      )}
    </aside>
  );
}
