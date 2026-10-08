/**
 * TermsStep — Step 4 of the Host Competition wizard.
 * Rich-text rules editor (shared `RichTextEditor` toolbar) plus the
 * originality confirmation checkbox gating launch.
 */

"use client";

import { RichTextEditor } from "@/components/molecules/RichTextEditor/RichTextEditor";
import { Checkbox } from "@/components/theme/Checkbox";
import { useHostCompetitionWizard } from "@/modules/Competition/context/HostCompetitionWizardContext";

export function TermsStep() {
  const { state, dispatch } = useHostCompetitionWizard();
  const { termsHtml, termsConfirmed } = state.draft;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-sm font-medium text-text-primary">Rules</p>
        <RichTextEditor
          value={termsHtml}
          placeholder="Describe Your Competition..."
          onChange={(html) => dispatch({ type: "UPDATE_DRAFT", payload: { termsHtml: html } })}
        />
      </div>

      <label
        htmlFor="host-terms-confirm"
        className="flex cursor-pointer items-start gap-3 rounded-xl border border-border-default bg-surface-muted/60 px-4 py-3"
      >
        <Checkbox
          id="host-terms-confirm"
          checked={termsConfirmed}
          className="mt-0.5"
          onChange={(event) =>
            dispatch({ type: "UPDATE_DRAFT", payload: { termsConfirmed: event.target.checked } })
          }
        />
        <span className="text-sm leading-snug text-text-primary">
          I confirm these are my original rules and agree to the platform&apos;s hosting policy.
        </span>
      </label>
    </div>
  );
}

export default TermsStep;
