import type { ReactNode } from "react";

/** One step in a wizard progress indicator. */
export interface ProgressStepperStep {
  id: string;
  label: string;
  description?: string;
  /** Optional icon rendered inside the badge instead of the step number. */
  icon?: ReactNode;
}

export interface ProgressStepperProps {
  steps: ProgressStepperStep[];
  currentStepId: string;
  onStepClick?: (stepId: string) => void;
  /** Badge size: `"sm"` (32px, default) or `"lg"` (48px for wide wizard headers). */
  size?: "sm" | "lg";
  /** Fills the active badge with the primary color (white icon/number) instead of the outline state. */
  filledCurrent?: boolean;
  className?: string;
}
