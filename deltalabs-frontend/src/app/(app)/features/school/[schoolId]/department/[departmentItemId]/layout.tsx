/** ################################ IMPORT ############################# */
import type { ReactNode } from "react";

import { DepartmentWorkspaceRouteLayout } from "@/modules/School/department";
/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
export default function DepartmentItemLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <DepartmentWorkspaceRouteLayout>{children}</DepartmentWorkspaceRouteLayout>;
}
/** ################################ /COMPONENT ############################# */
