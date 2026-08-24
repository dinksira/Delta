/**
 * ModuleRail
 * Atomic Level: Organism
 *
 * Left column of the Competition Workspace: a "Modules" panel header (cube icon)
 * and a vertical stack of ModuleNavItem pills. Page-level Previous/Next
 * navigation lives in the shared CompetitionWorkspaceTemplate footer bar.
 * @example <ModuleRail modules={MODULES} activeId="question" onSelect={setActive} />
 */

import type { LucideIcon } from "lucide-react";
import { Boxes } from "lucide-react";

import { ModuleNavItem } from "@/components/molecules/ModuleNavItem/ModuleNavItem";
import { Typography } from "@/components/theme/Typography";
import { cn } from "@/lib/utils";

export interface ModuleRailModule {
  id: string;
  label: string;
  icon: LucideIcon;
}

export interface ModuleRailProps {
  modules: readonly ModuleRailModule[];
  activeId: string;
  onSelect: (id: string) => void;
  className?: string;
}

export function ModuleRail({
  modules,
  activeId,
  onSelect,
  className,
}: Readonly<ModuleRailProps>) {
  return (
    <div
      className={cn(
        "flex w-full shrink-0 flex-col gap-5 rounded-xl border border-border-default bg-surface-default p-4 shadow-sm lg:w-64",
        className,
      )}
    >
      <div className="flex flex-col items-center gap-1 text-center">
        <Boxes className="size-5 text-primary-600" aria-hidden />
        <Typography className="text-sm font-semibold text-primary-700">Modules</Typography>
      </div>

      <nav className="flex flex-col gap-3" aria-label="Workspace modules">
        {modules.map((module) => (
          <ModuleNavItem
            key={module.id}
            id={module.id}
            label={module.label}
            icon={module.icon}
            active={module.id === activeId}
            onSelect={onSelect}
          />
        ))}
      </nav>
    </div>
  );
}

export default ModuleRail;