import type { ReactNode } from "react";

import { SchoolManagementShell } from "@/modules/School/components/SchoolManagementShell";

export default function SchoolWorkspaceLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <SchoolManagementShell>{children}</SchoolManagementShell>;
}
