/**
 * HostCompetitionWizardTemplate
 * Renders PageHeader (with rightSlot containing Draft/Preview buttons) + current step + WizardFooterNav.
 */

import type { ReactNode } from "react";

import { WizardFooterNav } from "@/components/molecules/WizardFooterNav/WizardFooterNav";
import { cn } from "@/lib/utils";

// ============================================================================
// PROPS
// ============================================================================

export interface HostCompetitionWizardTemplateProps {
  headerSlot: ReactNode;
  body: ReactNode;
  isFirstStep: boolean;
  isLastStep: boolean;
  canGoNext: boolean;
  onBack: () => void;
  onNext: () => void;
  onLaunch: () => void;
  className?: string;
}

// ============================================================================
// TEMPLATE
// ============================================================================

export function HostCompetitionWizardTemplate({
  headerSlot,
  body,
  isFirstStep,
  isLastStep,
  canGoNext,
  onBack,
  onNext,
  onLaunch,
  className,
}: Readonly<HostCompetitionWizardTemplateProps>) {
  return (
    <div className={cn("flex h-full flex-col gap-6 overflow-y-auto p-6", className)}>
      {/* Header — PageHeader with its own border-b spans full width */}
      {headerSlot}

      {/* Current step body */}
      <div className="flex-1">{body}</div>

      {/* Footer nav */}
      <WizardFooterNav
        isFirstStep={isFirstStep}
        isLastStep={isLastStep}
        canGoNext={canGoNext}
        onBack={onBack}
        onNext={onNext}
        onLaunch={onLaunch}
      />
    </div>
  );
}

export default HostCompetitionWizardTemplate;
