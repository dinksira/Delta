/**
 * HostCompetitionWizardTemplate
 * Atomic Level: Template
 *
 * Page shell for the multi-step "Host Competition" creation wizard:
 * header (back arrow, Layers badge + title, Integrate/Automate/Invite text
 * actions, Draft/Preview outline actions), a scrolling step card with its
 * section label, and a fixed footer with Back (left) / Next-or-Launch (right).
 *
 * @example
 * ```tsx
 * <HostCompetitionWizardTemplate
 *   currentStep={step}
 *   totalSteps={5}
 *   stepLabel="Overview"
 *   onNext={handleNext}
 *   nextLabel={step === 5 ? "Launch" : "Next"}
 *   onPrevious={handlePrevious}
 *   onDraft={handleDraft}
 *   onPreview={() => setPreviewOpen(true)}
 * >
 *   <OverviewStep />
 * </HostCompetitionWizardTemplate>
 * ```
 */

"use client";

import { type ReactNode, useState } from "react";

import { Bot, Layers, Pencil, Play, Plug, Share2 } from "lucide-react";

import { BackButton } from "@/components/theme/BackButton";
import { Button } from "@/components/theme/Button";
import { cn } from "@/lib/utils";

import type { HostCompetitionWizardTemplateProps } from "./HostCompetitionWizardTemplate.types";
import {
  contentCardClasses,
  footerClasses,
  headerActionClasses,
  headerDividerClasses,
  headerOutlineButtonClasses,
  stepCounterClasses,
  stepHeaderClasses,
  titleBadgeClasses,
} from "./variants";

export type { HostCompetitionWizardTemplateProps } from "./HostCompetitionWizardTemplate.types";

/** Small icon+label text action used in the header (Integrate/Automate/Invite). */
function HeaderAction({
  label,
  icon,
  onClick,
}: Readonly<{ label: string; icon: ReactNode; onClick?: () => void }>) {
  return (
    <button type="button" onClick={onClick} className={headerActionClasses}>
      {icon}
      {label}
    </button>
  );
}

export function HostCompetitionWizardTemplate({
  title = "Host Competition",
  currentStep,
  totalSteps,
  stepLabel,
  onBack,
  children,
  onPrevious,
  previousDisabled = false,
  previousLabel = "Back",
  onNext,
  nextDisabled = false,
  nextLabel = "Next",
  onDraft,
  draftSaved = false,
  onPreview,
  submitError,
  className,
}: Readonly<HostCompetitionWizardTemplateProps>) {
  const [copied, setCopied] = useState(false);

  const handleInvite = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — keep the action a no-op.
    }
  };

  return (
    <div className={cn("flex h-full flex-col bg-surface-default", className)}>
      {/* Global header: back + title, utility + outline actions */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border-default px-4 py-3 md:px-8">
        <div className="flex min-w-0 items-center gap-3">
          {onBack && <BackButton label="Back" onClick={onBack} />}
          <span className={titleBadgeClasses} aria-hidden>
            <Layers className="size-5" />
          </span>
          <h1 className="truncate text-xl font-bold leading-7 text-text-primary md:text-2xl md:leading-8">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-1">
          <div className="hidden items-center gap-1 md:flex">
            <HeaderAction label="Integrate" icon={<Plug className="size-4" aria-hidden />} />
            <HeaderAction label="Automate" icon={<Bot className="size-4" aria-hidden />} />
            <HeaderAction
              label={copied ? "Copied!" : "Invite"}
              icon={<Share2 className="size-4" aria-hidden />}
              onClick={handleInvite}
            />
            <span className={headerDividerClasses} aria-hidden />
          </div>

          {onDraft && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onDraft}
              className={headerOutlineButtonClasses}
            >
              <Pencil className="size-4" aria-hidden />
              {draftSaved ? "Saved" : "Draft"}
            </Button>
          )}
          {onPreview && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onPreview}
              className={headerOutlineButtonClasses}
            >
              <Play className="size-4" aria-hidden />
              Preview
            </Button>
          )}
        </div>
      </header>

      {/* Scrolling content region */}
      <main className="flex-1 overflow-y-auto px-4 py-5 md:px-8 md:py-6">
        <div className="mx-auto w-full max-w-5xl">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 className={stepHeaderClasses}>{stepLabel}</h2>
            <p className={stepCounterClasses}>
              Step {currentStep} of {totalSteps}
            </p>
          </div>
          <div className={contentCardClasses}>{children}</div>
        </div>
      </main>

      {/* Global bottom navigation */}
      <footer className={footerClasses}>
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
          <Button
            variant="secondary"
            onClick={onPrevious}
            disabled={previousDisabled}
            className="h-auto px-7 py-2.5 text-text-secondary"
          >
            {previousLabel}
          </Button>
          <Button
            variant="primary"
            onClick={onNext}
            disabled={nextDisabled}
            className="h-auto bg-primary-700 px-8 py-2.5 hover:bg-primary-800"
          >
            {nextLabel}
          </Button>
        </div>
        {submitError && (
          <p role="alert" className="mx-auto mt-2 max-w-5xl text-sm font-medium text-error-700">
            {submitError}
          </p>
        )}
      </footer>
    </div>
  );
}

export default HostCompetitionWizardTemplate;
