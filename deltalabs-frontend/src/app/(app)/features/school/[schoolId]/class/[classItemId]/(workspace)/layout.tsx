/** ################################ IMPORT ############################# */
import type { ReactNode } from "react";

import { ClassBottomNav } from "@/modules/School/class/ClassBottomNav";
import { ClassWorkspaceRouteLayout } from "@/modules/School/class/ClassWorkspaceRouteLayout";
/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Class list + bottom nav — not used on `/class/.../session/...` (see `(meet)` group). */
export default function ClassWorkspaceSegmentLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <>
      <ClassWorkspaceRouteLayout>{children}</ClassWorkspaceRouteLayout>
      <ClassBottomNav />
    </>
  );
}
/** ################################ /COMPONENT ############################# */
