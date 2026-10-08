/**
 * HostCompetitionWizardTemplate.types
 * Prop types for the `HostCompetitionWizardTemplate` page-level wizard shell.
 *
 * @example
 * ```tsx
 * <HostCompetitionWizardTemplate
 *   currentStep={1}
 *   onNext={handleNext}
 *   onPrevious={handlePrevious}
 * >
 *   <OverviewStep />
 * </HostCompetitionWizardTemplate>
 * ```
 */

import type { ReactNode } from "react";

/** Public props for `HostCompetitionWizardTemplate`. */
export interface HostCompetitionWizardTemplateProps {
  /** Branding title in the header; defaults to `"Host Competition"`. */
  title?: string;
  /** 1-based index of the active step. */
  currentStep: number;
  /** Total number of wizard steps. */
  totalSteps: number;
  /** Step header label rendered above the content card. */
  stepLabel: string;
  /** Leaves the wizard (header back). */
  onBack?: () => void;
  /** Step body rendered inside the content card. */
  children?: ReactNode;

  /** Footer Back (or header back on the first step — decided by the caller). */
  onPrevious?: () => void;
  previousDisabled?: boolean;
  previousLabel?: string;
  onNext?: () => void;
  nextDisabled?: boolean;
  /** Footer primary action; callers switch to `"Launch"` on the final step. */
  nextLabel?: string;

  /** Header "Draft" action; hidden when the callback is omitted. */
  onDraft?: () => void;
  /** True briefly after a draft save; relabels the Draft button. */
  draftSaved?: boolean;
  /** Header "Preview" action; hidden when the callback is omitted. */
  onPreview?: () => void;

  /** Error banner shown above the footer navigation. */
  submitError?: string | null;
  /** Extra classes merged onto the shell root. */
  className?: string;
}
