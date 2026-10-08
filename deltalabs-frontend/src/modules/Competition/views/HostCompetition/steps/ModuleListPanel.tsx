/**
 * ModuleListPanel — left rail of the Host Competition workspace.
 * Vertical list of selectable module buttons with an active fill state.
 */

"use client";

import { Box, Code2, FileText, ListChecks, PenTool } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  useHostCompetitionWizard,
  type HostModuleId,
} from "@/modules/Competition/context/HostCompetitionWizardContext";

/** Module registry shared with the workspace canvas. */
export const HOST_MODULES: ReadonlyArray<{ id: HostModuleId; label: string; icon: LucideIcon }> = [
  { id: "code-editor", label: "Code Editor", icon: Code2 },
  { id: "question-builder", label: "Question Builder", icon: ListChecks },
  { id: "markdown-pad", label: "Markdown Pad", icon: FileText },
  { id: "design-canvas", label: "Design Canvas", icon: PenTool },
];

export function ModuleListPanel() {
  const { state, dispatch } = useHostCompetitionWizard();
  const activeModule = state.draft.activeModule;

  return (
    <nav
      aria-label="Modules"
      className="rounded-xl border border-border-default bg-surface-default p-3"
    >
      <h3 className="mb-3 flex items-center gap-2 px-1 text-sm font-semibold text-text-primary">
        <Box className="size-4 text-primary-700" aria-hidden />
        Modules
      </h3>
      <ul className="flex flex-col gap-2">
        {HOST_MODULES.map((module) => {
          const Icon = module.icon;
          const isActive = activeModule === module.id;
          return (
            <li key={module.id}>
              <button
                type="button"
                aria-pressed={isActive}
                onClick={() => dispatch({ type: "SET_ACTIVE_MODULE", payload: module.id })}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200",
                  isActive
                    ? "bg-primary-700 text-white hover:bg-primary-800"
                    : "border border-border-default bg-surface-default text-text-primary hover:bg-surface-muted",
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                {module.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default ModuleListPanel;
