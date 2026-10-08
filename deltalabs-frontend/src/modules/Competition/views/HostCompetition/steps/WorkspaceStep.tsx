/**
 * WorkspaceStep — Step 5 of the Host Competition wizard.
 * Three-column IDE layout: module rail (left), active content canvas (centre),
 * and module settings (right). Shows the empty prompt until a module is
 * selected; the Code Editor module opens the question-tab canvas.
 */

"use client";

import { cn } from "@/lib/utils";
import { useHostCompetitionWizard } from "@/modules/Competition/context/HostCompetitionWizardContext";

import { CodeWorkspaceCanvas } from "./CodeWorkspaceCanvas";
import { HOST_MODULES, ModuleListPanel } from "./ModuleListPanel";
import { ModuleSettingsPanel } from "./ModuleSettingsPanel";

function EmptyCanvas() {
  return (
    <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed border-border-default bg-surface-muted/40 px-6 text-center text-sm text-text-secondary">
      Select a module to get started...
    </div>
  );
}

function PlaceholderCanvas({ label }: Readonly<{ label: string }>) {
  return (
    <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed border-border-default bg-surface-muted/40 px-6 text-center text-sm text-text-secondary">
      The {label} canvas is not available yet — start with the Code Editor module.
    </div>
  );
}

export function WorkspaceStep() {
  const { state } = useHostCompetitionWizard();
  const activeModule = state.draft.activeModule;
  const activeMeta = HOST_MODULES.find((module) => module.id === activeModule);

  return (
    <div className={cn("grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)_240px]")}>
      <ModuleListPanel />

      <section
        aria-label="Active content"
        className="min-w-0 rounded-xl border border-border-default bg-surface-default p-4"
      >
        {activeModule === null ? (
          <EmptyCanvas />
        ) : activeModule === "code-editor" ? (
          <CodeWorkspaceCanvas />
        ) : (
          <PlaceholderCanvas label={activeMeta?.label ?? "module"} />
        )}
      </section>

      <ModuleSettingsPanel />
    </div>
  );
}

export default WorkspaceStep;
