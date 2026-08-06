/**
 * ModuleSettingsPanel
 * Atomic Level: Organism
 *
 * Right column of the Competition Workspace: a "Module Setting" panel header
 * (wrench icon) and module-specific settings rendered as `children`. Page-level
 * Previous/Next navigation lives in the shared CompetitionWorkspaceTemplate
 * footer bar, not here.
 * @example <ModuleSettingsPanel>{children}</ModuleSettingsPanel>
 */

import type { ReactNode } from "react";
import { Settings2 } from "lucide-react";

import { Typography } from "@/components/theme/Typography";
import { cn } from "@/lib/utils";

export interface ModuleSettingsPanelProps {
  /** Settings (e.g. module / question inspector) for the active workspace module. */
  children?: ReactNode;
  title?: string;
  className?: string;
}

export function ModuleSettingsPanel({
  children,
  title = "Module Setting",
  className,
}: Readonly<ModuleSettingsPanelProps>) {
  return (
    <div
      className={cn(
        "flex w-full shrink-0 flex-col gap-5 rounded-xl border border-border-default bg-surface-default p-4 shadow-sm lg:w-80",
        className,
      )}
    >
      <div className="flex flex-col items-center gap-1 text-center">
        <Settings2 className="size-5 text-primary-600" aria-hidden />
        <Typography className="text-sm font-semibold text-primary-700">{title}</Typography>
      </div>

      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}

export default ModuleSettingsPanel;