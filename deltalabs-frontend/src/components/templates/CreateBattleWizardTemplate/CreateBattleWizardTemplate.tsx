/**
 * CreateBattleWizardTemplate
 * Atomic Level: Template
 *
 * Reusable 8-step wizard shell for creating a topic battle: header (back,
 * title + step subtitle, utility actions Integrate/Automate/Invite), linear
 * progress bar, icon step indicator, a card body (`children`), and
 * Previous/Next footer navigation. Layout follows the Step 1 redesign spec
 * (~1280px container, header zone 24px 32px, card content 32px 40px).
 */

"use client";

import { useState, type ReactNode } from "react";

import { Bot, Link2, Plug, UserPlus } from "lucide-react";

import { BackButton } from "@/components/theme/BackButton";
import { Button } from "@/components/theme/Button";
import { Typography } from "@/components/theme/Typography";
import { ProgressBar } from "@/components/atoms/ProgressBar/ProgressBar";
import { ProgressStepper } from "@/components/molecules/ProgressStepper/ProgressStepper";
import type { ProgressStepperStep } from "@/components/molecules/ProgressStepper/ProgressStepper.types";
import { cn } from "@/lib/utils";

export interface CreateBattleWizardTemplateProps {
  /** Main page title, e.g. "Create Topic Battle". */
  title: string;
  /** 1-based index of the active step. */
  currentStep: number;
  /** Total number of wizard steps. */
  totalSteps: number;
  /** Step list rendered in the indicator; id order must match steps 1..N. */
  steps: ProgressStepperStep[];

  onBack?: () => void;

  /** Step body content rendered inside the main card. */
  children?: ReactNode;

  onPrevious?: () => void;
  onNext?: () => void;
  previousDisabled?: boolean;
  nextDisabled?: boolean;
  nextLabel?: string;
  /** Hides the Previous/Next footer (used by full-screen sub-flows like the question builder). */
  hideNav?: boolean;
  /** Submission error banner shown above the footer nav. */
  submitError?: string | null;

  className?: string;
}

export function CreateBattleWizardTemplate({
  title,
  currentStep,
  totalSteps,
  steps,
  onBack,
  children,
  onPrevious,
  onNext,
  previousDisabled = false,
  nextDisabled = false,
  nextLabel = "Next",
  hideNav = false,
  submitError,
  className,
}: Readonly<CreateBattleWizardTemplateProps>) {
  const progress = Math.round((currentStep / totalSteps) * 100);
  const currentStepId = steps[currentStep - 1]?.id;
  const [copied, setCopied] = useState(false);

  const handleCopyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — keep the button a no-op.
    }
  };

  return (
    <div className={cn("flex h-full flex-col gap-6 overflow-y-auto px-4 py-6 md:px-8 md:py-8", className)}>
      {/* Header: back + centered title/subtitle + utility actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {onBack && <BackButton label="Back" onClick={onBack} />}
        </div>

        <div className="flex flex-col items-center text-center">
          <Typography as="h1" className="text-xl font-bold text-primary-700 md:text-2xl">
            {title}
          </Typography>
          <Typography className="text-[13px] font-medium text-text-secondary">
            Step {currentStep} of {totalSteps}
          </Typography>
        </div>

        <div className="hidden items-center gap-1 md:flex">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-muted hover:text-primary-700"
          >
            <Plug className="size-4" aria-hidden />
            Integrate
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-muted hover:text-primary-700"
          >
            <Bot className="size-4" aria-hidden />
            Automate
          </button>
          <div className="mx-2 h-5 w-px bg-border-default" aria-hidden />
          <button
            type="button"
            onClick={handleCopyInviteLink}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-muted hover:text-primary-700"
          >
            <UserPlus className="size-4" aria-hidden />
            {copied ? "Copied!" : "Invite"}
            <Link2 className="size-3.5" aria-hidden />
          </button>
        </div>
      </div>

      {/* Linear progress + 8-step indicator */}
      <div className="mx-auto mb-6 w-full max-w-7xl">
        <ProgressBar progress={progress} label={`${progress}% Complete`} valueText="Battle Ready!" />
        <div className="mt-4">
          <ProgressStepper
            steps={steps}
            currentStepId={currentStepId ?? steps[0].id}
            size="lg"
            filledCurrent
          />
        </div>
      </div>

      {/* Main card: step body + footer navigation */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col">
        <div className="flex flex-1 flex-col gap-6 rounded-2xl border border-border-default bg-surface-default px-6 py-8 shadow-sm md:px-10">
          {children}
        </div>

        {!hideNav && (
          <div className="mt-4 flex flex-col gap-3">
            {submitError && (
              <div className="rounded-lg border border-error-500 bg-error-50 px-4 py-3 text-sm font-medium text-error-700">
                {submitError}
              </div>
            )}
            <div className="flex items-center justify-between">
              <Button
                variant="secondary"
                onClick={onPrevious}
                disabled={previousDisabled}
                className="h-auto rounded-lg px-7 py-2.5 disabled:text-text-tertiary"
              >
                Previous
              </Button>
              <Button
                variant="primary"
                onClick={onNext}
                disabled={nextDisabled}
                className="h-auto rounded-lg bg-primary-700 px-8 py-2.5 hover:bg-primary-800"
              >
                {nextLabel}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CreateBattleWizardTemplate;
