/**
 * OverviewStep — Step 1 of the Host Competition wizard.
 * Cover upload box + competition title + short description, bound to the
 * `HostCompetitionWizardContext` draft.
 */

"use client";

import { Upload } from "lucide-react";

import { Field } from "@/components/theme/Field";
import { Input } from "@/components/theme/Input";
import { Textarea } from "@/components/theme/Textarea";
import { useHostCompetitionWizard } from "@/modules/Competition/context/HostCompetitionWizardContext";

export function OverviewStep() {
  const { state, dispatch } = useHostCompetitionWizard();
  const { title, description, coverName } = state.draft;

  return (
    <div className="flex flex-col gap-5">
      <label
        htmlFor="host-cover-upload"
        className="flex h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border-default bg-surface-muted text-text-secondary transition-colors hover:border-primary-400 hover:text-primary-700 focus-within:ring-2 focus-within:ring-primary-200"
      >
        <Upload className="size-7" aria-hidden />
        <span className="text-sm font-medium">Upload Cover Image</span>
        {coverName && <span className="text-xs text-primary-700">{coverName}</span>}
      </label>
      <input
        id="host-cover-upload"
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          dispatch({ type: "UPDATE_DRAFT", payload: { coverName: file?.name ?? null } });
        }}
      />

      <Field id="host-title" label="Competition Title">
        <Input
          id="host-title"
          value={title}
          placeholder="eg. UX Design Sprint"
          onChange={(event) =>
            dispatch({ type: "UPDATE_DRAFT", payload: { title: event.target.value } })
          }
        />
      </Field>

      <Field id="host-description" label="Short Description">
        <Textarea
          id="host-description"
          rows={4}
          value={description}
          placeholder="Describe Your Competition..."
          onChange={(event) =>
            dispatch({ type: "UPDATE_DRAFT", payload: { description: event.target.value } })
          }
        />
      </Field>
    </div>
  );
}

export default OverviewStep;
