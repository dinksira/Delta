/** ################################ COMPONENT ############################# */
/**
 * DescriptionSection
 * Left column of the Hire a Tutor form: the free-text description plus the
 * three pickers that attach context to the request.
 *
 * @example
 * ```tsx
 * <DescriptionSection {...handlers} />
 * ```
 */

/** ################################ IMPORT ############################# */
/** React core, shared primitives, and local building blocks. */
import React from "react";

import { CalendarPlus, Plus, Users } from "lucide-react";

import { CustomParametersModal } from "@/components/organisms/CustomParametersModal";
import { RoadmapSelectionModal } from "@/components/organisms/RoadmapSelectionModal";
import { TutorSelectionModal } from "@/components/organisms/TutorSelectionModal";
import { Field } from "@/components/theme/Field";
import { Textarea } from "@/components/theme/Textarea";
import { cn } from "@/lib/utils";
import { HIRE_TUTOR_ROADMAP, HIRE_TUTOR_TUTORS } from "./hireTutorData";
import type { DescriptionSectionProps, HireTutorFormState } from "./types";
import {
  attachButtonClasses,
  attachIconClasses,
  attachListClasses,
  attachLabelClasses,
  columnHeadingClasses,
  descriptionClasses,
  sectionClasses,
  summaryClasses,
} from "./variants";
/** ################################ /IMPORT ############################# */

/** Props for {@link AttachRow}. */
export interface AttachRowProps {
  /** Accessible name of the button. */
  label: string;
  /** Current value shown beside the button. */
  summary: string;
  /** Icon for the button. */
  icon: React.ReactNode;
  /** Opens the matching picker. */
  onOpen: () => void;
}

/** One "attach something" control with its current summary. */
function AttachRow({ label, summary, icon, onOpen }: Readonly<AttachRowProps>) {
  return (
    <div className={summaryClasses}>
      <button type="button" onClick={onOpen} className={attachButtonClasses}>
        <span className={attachIconClasses}>{icon}</span>
        <span className={attachLabelClasses}>{label}</span>
      </button>
      <span className="truncate text-xs text-text-secondary">{summary}</span>
    </div>
  );
}

/** Builds the one-line summary for the roadmap row. */
function roadmapSummary(form: HireTutorFormState): string {
  const count = form.roadmapSectionIds.length + form.roadmapResourceIds.length;
  return count === 0 ? "None selected" : `${count} selected`;
}

/** Builds the one-line summary for the parameters row. */
function parametersSummary(form: HireTutorFormState): string {
  return form.customParameters.length === 0
    ? "None added"
    : form.customParameters.map((parameter) => parameter.name).join(", ");
}

/** Builds the one-line summary for the tutor row. */
function tutorSummary(form: HireTutorFormState): string {
  if (form.autoMatch) {
    return "Auto match on";
  }
  return form.tutorIds.length === 0 ? "None invited" : `${form.tutorIds.length} invited`;
}

/** The three picker dialogs the left column can open. */
export function HireTutorPickers({
  form,
  openDialog,
  onCloseDialog,
  onAddParameters,
  onToggleTutor,
  onApplyRoadmap,
  onToggleRoadmapSection,
  onToggleRoadmapResource,
  onConfirmTutors,
  onAutoMatchChange,
}: Readonly<DescriptionSectionProps>) {
  return (
    <>
      <CustomParametersModal
        isOpen={openDialog === "parameters"}
        onClose={onCloseDialog}
        onAdd={onAddParameters}
      />
      <RoadmapSelectionModal
        isOpen={openDialog === "roadmap"}
        onClose={onCloseDialog}
        sections={HIRE_TUTOR_ROADMAP}
        selectedSectionIds={form.roadmapSectionIds}
        selectedResourceIds={form.roadmapResourceIds}
        onToggleSection={onToggleRoadmapSection}
        onToggleResource={onToggleRoadmapResource}
        onConfirm={onApplyRoadmap}
      />
      <TutorSelectionModal
        isOpen={openDialog === "tutors"}
        onClose={onCloseDialog}
        tutors={HIRE_TUTOR_TUTORS}
        selectedTutorIds={form.tutorIds}
        onToggleTutor={(tutor) => onToggleTutor(tutor.id)}
        autoMatch={form.autoMatch}
        onAutoMatchChange={onAutoMatchChange}
        onConfirm={onConfirmTutors}
      />
    </>
  );
}

/** The description field and its attached-context pickers. */
export function DescriptionSection(props: Readonly<DescriptionSectionProps>) {
  const { form, onOpenDialog, onDescriptionChange } = props;

  return (
    <section className={cn(sectionClasses)} aria-labelledby="hire-tutor-details-label">
      <h3 id="hire-tutor-details-label" className={columnHeadingClasses}>
        Lesson details
      </h3>

      <Field id="hire-tutor-description" label="Description" labelClassName="text-xs font-semibold">
        <Textarea
          id="hire-tutor-description"
          rows={5}
          value={form.description}
          placeholder="What do you need help with?"
          onChange={(event) => onDescriptionChange(event.target.value)}
          className={descriptionClasses}
        />
      </Field>

      <div className={attachListClasses}>
        <AttachRow
          label="Add custom parameter"
          summary={parametersSummary(form)}
          icon={<Plus className="size-4" aria-hidden="true" />}
          onOpen={() => onOpenDialog("parameters")}
        />
        <AttachRow
          label="Select roadmap"
          summary={roadmapSummary(form)}
          icon={<CalendarPlus className="size-4" aria-hidden="true" />}
          onOpen={() => onOpenDialog("roadmap")}
        />
        <AttachRow
          label="Invite tutor"
          summary={tutorSummary(form)}
          icon={<Users className="size-4" aria-hidden="true" />}
          onOpen={() => onOpenDialog("tutors")}
        />
      </div>

      <HireTutorPickers {...props} />
    </section>
  );
}

DescriptionSection.displayName = "DescriptionSection";
/** ################################ /COMPONENT ############################# */
