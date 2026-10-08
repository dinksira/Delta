/**
 * PreviewDialog — read-only summary of the host-competition draft
 * (overview, prize count, timeline, terms confirmation, workspace state)
 * opened from the wizard header's Preview action.
 */

"use client";

import { Dialog, DialogSection } from "@/components/theme/Dialog";
import type { HostCompetitionDraft } from "@/modules/Competition/context/HostCompetitionWizardContext";

export interface PreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  draft: HostCompetitionDraft;
}

function summarizeList(values: string[], fallback: string): string {
  const filled = values.filter((value) => value.trim().length > 0);
  return filled.length > 0 ? filled.join(", ") : fallback;
}

export function PreviewDialog({ isOpen, onClose, draft }: Readonly<PreviewDialogProps>) {
  const activeModuleLabel = draft.activeModule
    ? draft.activeModule.replace(/-/g, " ")
    : "No module selected";

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Preview" size="lg">
      <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
        <DialogSection title="Overview">
          <p className="text-sm text-text-primary">
            {draft.title.trim() || "Untitled competition"}
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            {draft.description.trim() || "No description yet."}
          </p>
          {draft.coverName && <p className="mt-1 text-xs text-text-secondary">{draft.coverName}</p>}
        </DialogSection>

        <DialogSection title="Prize Details">
          <p className="text-sm text-text-primary">
            {draft.prizes.length} {draft.prizes.length === 1 ? "prize" : "prizes"}:{" "}
            {summarizeList(
              draft.prizes.map((prize) => prize.rank),
              "ranks not set",
            )}
          </p>
        </DialogSection>

        <DialogSection title="Competition Timeline">
          <p className="text-sm text-text-primary">
            {draft.phases.length} {draft.phases.length === 1 ? "phase" : "phases"}:{" "}
            {summarizeList(
              draft.phases.map((phase) => phase.name),
              "names not set",
            )}
          </p>
        </DialogSection>

        <DialogSection title="Terms &amp; Conditions">
          <p className="text-sm text-text-primary">
            {draft.termsConfirmed
              ? "Originality confirmed."
              : "Confirmation checkbox still pending."}
          </p>
        </DialogSection>

        <DialogSection title="Competition Workspace">
          <p className="text-sm capitalize text-text-primary">
            {activeModuleLabel} · {draft.questions.length}{" "}
            {draft.questions.length === 1 ? "question" : "questions"}
          </p>
        </DialogSection>
      </div>
    </Dialog>
  );
}

export default PreviewDialog;
