/**
 * HostCompetitionPage — route view for `/features/competitions/host`.
 * Multi-step "Host Competition" creation wizard: Overview → Prize Details →
 * Competition Timeline → Terms & Conditions → Competition Workspace, wired
 * to `HostCompetitionWizardContext`. Drafts persist to localStorage; Launch
 * marks the draft as launched and shows a success panel.
 */

"use client";

import { useCallback, useState } from "react";

import { useRouter } from "next/navigation";

import { HostCompetitionWizardTemplate } from "@/components/templates/HostCompetitionWizardTemplate";
import { Button } from "@/components/theme/Button";
import { StatusBanner, type StatusBannerType } from "@/components/theme/StatusBanner";
import {
  HOST_COMPETITION_STEPS,
  HOST_COMPETITION_STEP_COUNT,
  HostCompetitionWizardProvider,
  useHostCompetitionWizard,
} from "@/modules/Competition/context/HostCompetitionWizardContext";

import { PreviewDialog } from "./PreviewDialog";
import { OverviewStep } from "./steps/OverviewStep";
import { PrizesStep } from "./steps/PrizesStep";
import { TermsStep } from "./steps/TermsStep";
import { TimelineStep } from "./steps/TimelineStep";
import { WorkspaceStep } from "./steps/WorkspaceStep";

/** localStorage key holding the last saved host-competition draft. */
export const HOST_COMPETITION_STORAGE_KEY = "host-competition-draft";

/** Token-only banner styles keyed by `StatusBannerType`. */
const BANNER_TYPE_STYLES: Readonly<Record<StatusBannerType, string>> = {
  success: "rounded-lg border border-success-500 bg-success-50 text-success-700",
  error: "rounded-lg border border-error-500 bg-error-50 text-error-700",
  info: "rounded-lg border border-info-500 bg-info-50 text-info-700",
};

function HostCompetitionWizard() {
  const { state, dispatch } = useHostCompetitionWizard();
  const router = useRouter();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const { step, draft, launched } = state;
  const total = HOST_COMPETITION_STEP_COUNT;
  const isLast = step === total;
  const stepDef = HOST_COMPETITION_STEPS[step - 1];

  const handleBack = useCallback(() => {
    router.push("/features/competitions");
  }, [router]);

  const handlePrevious = useCallback(() => {
    if (step === 1) {
      handleBack();
      return;
    }
    dispatch({ type: "PREVIOUS_STEP" });
  }, [dispatch, handleBack, step]);

  const handleDraft = useCallback(() => {
    dispatch({ type: "SAVE_DRAFT" });
    try {
      window.localStorage.setItem(HOST_COMPETITION_STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // Storage unavailable — the in-memory draft still holds.
    }
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 2000);
  }, [dispatch, draft]);

  const handleLaunch = useCallback(() => {
    dispatch({ type: "SAVE_DRAFT" });
    dispatch({ type: "LAUNCH" });
    try {
      window.localStorage.setItem(HOST_COMPETITION_STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // Storage unavailable — launch still proceeds.
    }
  }, [dispatch, draft]);

  const handleNext = useCallback(() => {
    if (isLast) {
      handleLaunch();
      return;
    }
    dispatch({ type: "NEXT_STEP" });
  }, [dispatch, handleLaunch, isLast]);

  if (launched) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-5 p-8">
        <StatusBanner
          type="success"
          typeStyles={BANNER_TYPE_STYLES}
          message={`"${draft.title.trim() || "Your competition"}" has been launched.`}
        />
        <Button variant="primary" onClick={handleBack}>
          Back to competitions
        </Button>
      </div>
    );
  }

  const nextDisabled =
    (step === 1 && draft.title.trim().length === 0) || (isLast && !draft.termsConfirmed);
  const submitError =
    step === 1 && draft.title.trim().length === 0
      ? "Add a competition title to continue."
      : isLast && !draft.termsConfirmed
        ? "Confirm the terms to launch."
        : null;

  const stepBody = (() => {
    switch (stepDef.id) {
      case "overview":
        return <OverviewStep />;
      case "prizes":
        return <PrizesStep />;
      case "timeline":
        return <TimelineStep />;
      case "terms":
        return <TermsStep />;
      default:
        return <WorkspaceStep />;
    }
  })();

  return (
    <>
      <HostCompetitionWizardTemplate
        currentStep={step}
        totalSteps={total}
        stepLabel={stepDef.label}
        onBack={handleBack}
        onPrevious={handlePrevious}
        previousLabel={step === 1 ? "Leave" : "Back"}
        onNext={handleNext}
        nextLabel={isLast ? "Launch" : "Next"}
        nextDisabled={nextDisabled}
        onDraft={handleDraft}
        draftSaved={savedFlash}
        onPreview={() => setPreviewOpen(true)}
        submitError={submitError}
      >
        {stepBody}
      </HostCompetitionWizardTemplate>

      <PreviewDialog isOpen={previewOpen} onClose={() => setPreviewOpen(false)} draft={draft} />
    </>
  );
}

export function HostCompetitionPage() {
  return (
    <HostCompetitionWizardProvider>
      <HostCompetitionWizard />
    </HostCompetitionWizardProvider>
  );
}

export default HostCompetitionPage;
