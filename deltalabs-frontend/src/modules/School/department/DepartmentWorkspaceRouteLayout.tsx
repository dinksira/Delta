import type { ReactNode } from "react";

/**
 * Thin route wrapper only — {@link SchoolWorkspaceDetailView} already applies the same
 * canvas `section` + vertical padding as the school page. A second padded `section` here
 * doubled `py-*` and nudged the whole layout down when entering a department route.
 */
export function DepartmentWorkspaceRouteLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div data-school-surface="department-workspace" className="min-h-0 min-w-0 flex-1">
      {children}
    </div>
  );
}
