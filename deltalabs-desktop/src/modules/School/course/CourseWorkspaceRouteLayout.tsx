"use client";

import type { ReactNode } from "react";

import { CLASS_WORKSPACE_LAYOUT } from "@/modules/School/class/layoutConstants";

/**
 * Same width/rhythm as class workspace; bottom padding reserves space for {@link CourseBottomNav}.
 */
export function CourseWorkspaceRouteLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <section
      data-school-surface="course-workspace"
      className={[
        "min-h-[calc(100vh-10rem)] bg-surface-canvas",
        CLASS_WORKSPACE_LAYOUT.routeBodyTopPadding,
        "pb-[calc(4.55rem+env(safe-area-inset-bottom))] md:pb-[calc(4.85rem+env(safe-area-inset-bottom))]",
      ].join(" ")}
      aria-label="Course workspace"
    >
      <div className="space-y-6">{children}</div>
    </section>
  );
}
