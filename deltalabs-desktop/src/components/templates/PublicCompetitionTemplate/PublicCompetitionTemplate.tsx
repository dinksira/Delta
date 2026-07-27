/**
 * PublicCompetitionTemplate
 * Two-column layout: left (YourStatus + Achievements) | right (GameModes + Upcoming).
 * NOTE: TabsRow is rendered by the parent page, not inside this template.
 */

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

// ============================================================================
// PROPS
// ============================================================================

export interface PublicCompetitionTemplateProps {
  leftColumn: ReactNode;
  rightColumn: ReactNode;
  className?: string;
}

// ============================================================================
// TEMPLATE
// ============================================================================

export function PublicCompetitionTemplate({
  leftColumn,
  rightColumn,
  className,
}: Readonly<PublicCompetitionTemplateProps>) {
  return (
    <div className={cn("flex flex-1 gap-6 overflow-hidden", className)}>
      {/* Left column — status + achievements */}
      <div className="flex w-[280px] shrink-0 flex-col gap-6 overflow-y-auto">
        {leftColumn}
      </div>

      {/* Right column — game modes + upcoming */}
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto">
        {rightColumn}
      </div>
    </div>
  );
}

export default PublicCompetitionTemplate;
