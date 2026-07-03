"use client";

import type { ReactNode } from "react";
import { useSearchParams } from "next/navigation";

import { CLASS_WORKSPACE_LAYOUT } from "@/modules/School/class/layoutConstants";

/**
 * Same **width and vertical rhythm** as `SchoolWorkspaceDetailView`: full width inside
 * `SchoolManagementShell` gutters (`pl-2 pr-6 md:pr-8 xl:pr-10`), no extra max-width card.
 * Bottom padding reserves space for {@link ClassBottomNav}.
 */
export function ClassWorkspaceRouteLayout({ children }: Readonly<{ children: ReactNode }>) {
  const searchParams = useSearchParams();
  const isRoadmap = searchParams.get("nav") === "roadmap";

  if (isRoadmap) {
    return (
      <section
        data-school-surface="class-workspace"
        className={[
          "flex min-h-0 flex-1 flex-col overflow-hidden bg-surface-canvas",
          CLASS_WORKSPACE_LAYOUT.routeBodyTopPadding,
          "pb-[calc(4.55rem+env(safe-area-inset-bottom))] md:pb-[calc(4.85rem+env(safe-area-inset-bottom))]",
        ].join(" ")}
        aria-label="Class workspace"
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
      </section>
    );
  }

  return (
    <section
      data-school-surface="class-workspace"
      className={[
        "min-h-[calc(100vh-10rem)] bg-surface-canvas",
        CLASS_WORKSPACE_LAYOUT.routeBodyTopPadding,
        "pb-[calc(4.55rem+env(safe-area-inset-bottom))] md:pb-[calc(4.85rem+env(safe-area-inset-bottom))]",
      ].join(" ")}
      aria-label="Class workspace"
    >
      <div className="space-y-6">{children}</div>
    </section>
  );
}
