/**
 * MyCompetitionTemplate
 * Composes PageHeader + TabsRow (with MyCompetitionToolbar) + CustomizableTable body.
 */

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

// ============================================================================
// PROPS
// ============================================================================

export interface MyCompetitionTemplateProps {
  header: ReactNode;
  toolbar: ReactNode;
  table: ReactNode;
  className?: string;
}

// ============================================================================
// TEMPLATE
// ============================================================================

export function MyCompetitionTemplate({
  header,
  toolbar,
  table,
  className,
}: Readonly<MyCompetitionTemplateProps>) {
  return (
    <div className={cn("flex h-full flex-col gap-6 overflow-y-auto p-6", className)}>
      {header}
      {toolbar}
      {table}
    </div>
  );
}

export default MyCompetitionTemplate;
