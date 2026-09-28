/** ################################ COMPONENT ############################# */
/**
 * HireTutorForm
 * Composes `HireTutorLayout`, `DescriptionSection`, and
 * `EstimationPaymentSection` around a single `useHireTutorForm` state owner.
 *
 * This is the entry point a route or view renders.
 *
 * @example
 * ```tsx
 * <HireTutorForm onSubmit={(request) => createRequest(request)} />
 * ```
 */

/** ################################ IMPORT ############################# */
/** React core, shared primitives, and local building blocks. */
import React from "react";

import { Button } from "@/components/theme/Button";
import { DescriptionSection } from "./DescriptionSection";
import { EstimationPaymentSection } from "./EstimationPaymentSection";
import { HireTutorLayout } from "./HireTutorLayout";
import { HIRE_TUTOR_PAYMENT_OPTIONS } from "./hireTutorData";
import type {
  DescriptionSectionProps,
  EstimationPaymentSectionProps,
  HireTutorFormState,
} from "./types";
import { useHireTutorForm } from "./useHireTutorForm";
import type { HireTutorFormApi, UseHireTutorFormOptions } from "./useHireTutorForm";
/** ################################ /IMPORT ############################# */

/** Props for {@link HireTutorForm}. */
export interface HireTutorFormProps extends UseHireTutorFormOptions {
  /** Heading above the form. */
  title?: string;
  /** Supporting copy under the heading. */
  description?: string;
  /** Label for the submit button. */
  submitLabel?: string;
  /** Called with the form state when the user submits. */
  onSubmit?: (state: HireTutorFormState) => void;
}

/**
 * Maps the form API onto the props each presentational section expects.
 *
 * Keeping this out of the component stops the wiring from dominating it, and
 * makes the two prop objects reusable in tests.
 */
function useHireTutorSectionProps(api: HireTutorFormApi) {
  const shared = {
    form: api.form,
    openDialog: api.openDialog,
    onOpenDialog: api.openPicker,
    onCloseDialog: api.closePicker,
  };

  const descriptionProps: DescriptionSectionProps = {
    ...shared,
    onDescriptionChange: api.setDescription,
    onAddParameters: api.setCustomParameters,
    onToggleTutor: api.toggleTutor,
    onApplyRoadmap: api.applyRoadmapSelection,
    onToggleRoadmapSection: api.toggleRoadmapSection,
    onToggleRoadmapResource: api.toggleRoadmapResource,
    onConfirmTutors: api.confirmTutors,
    onAutoMatchChange: api.setAutoMatch,
  };

  const estimationProps: EstimationPaymentSectionProps = {
    ...shared,
    onDateSelect: api.setScheduledDate,
    onTimeSelect: api.setScheduledTime,
    onPaymentOptionSelect: api.setPaymentOption,
    onAmountChange: api.setAmount,
    paymentOptions: HIRE_TUTOR_PAYMENT_OPTIONS,
    selectedPaymentOption: api.selectedPaymentOption,
    estimatedAmount: api.estimatedAmount,
    sessionHours: api.sessionHours,
  };

  return { descriptionProps, estimationProps };
}

/** The wired-up Hire a Tutor form. */
export function HireTutorForm({
  title,
  description,
  submitLabel = "Request tutor",
  onSubmit,
  ...formOptions
}: Readonly<HireTutorFormProps>) {
  const api = useHireTutorForm(formOptions);
  const { descriptionProps, estimationProps } = useHireTutorSectionProps(api);

  return (
    <HireTutorLayout
      title={title}
      description={description}
      descriptionSection={<DescriptionSection {...descriptionProps} />}
      estimationSection={<EstimationPaymentSection {...estimationProps} />}
      footer={
        <HireTutorFooter
          isComplete={api.isComplete}
          isSubmitReady={onSubmit !== undefined}
          label={submitLabel}
          onSubmit={() => onSubmit?.(api.form)}
        />
      }
    />
  );
}

/** Props for {@link HireTutorFooter}. */
export interface HireTutorFooterProps {
  /** Whether the form has everything it needs. */
  isComplete: boolean;
  /** Whether anything will handle the request. */
  isSubmitReady: boolean;
  /** Submit button label. */
  label: string;
  /** Submits. */
  onSubmit: () => void;
}

/** Submit action plus the hint explaining what is still missing. */
export function HireTutorFooter({
  isComplete,
  isSubmitReady,
  label,
  onSubmit,
}: Readonly<HireTutorFooterProps>) {
  return (
    <>
      <Button size="lg" disabled={!isComplete || !isSubmitReady} onClick={onSubmit}>
        {label}
      </Button>
      {!isComplete ? (
        <p className="text-xs text-text-secondary">
          Add a description, a date, a payment option, and either a tutor or auto match.
        </p>
      ) : !isSubmitReady ? (
        <p className="text-xs text-text-secondary">
          Pass an onSubmit handler to send this request.
        </p>
      ) : null}
    </>
  );
}

HireTutorForm.displayName = "HireTutorForm";
/** ################################ /COMPONENT ############################# */
