/**
 * HostCompetitionPage
 * 5-step wizard for hosting a new competition.
 * Route: /features/competitions/host
 */

import { useCallback, useState } from "react";
import { Search, RefreshCw, UserPlus } from "lucide-react";

import { useRouter } from "next/navigation";

import { useHostCompetitionWizard } from "@/modules/Competition/hooks/useHostCompetitionWizard";
import { PageHeader } from "@/components/organisms/PageHeader/PageHeader";
import { WizardHeaderActions } from "@/components/molecules/WizardHeaderActions/WizardHeaderActions";
import { HostCompetitionWizardTemplate } from "@/components/templates/HostCompetitionWizardTemplate/HostCompetitionWizardTemplate";
import { ConfirmLaunchModal } from "@/components/organisms/ConfirmLaunchModal/ConfirmLaunchModal";
import { OverviewStep } from "@/components/organisms/OverviewStep/OverviewStep";
import { PrizeDetailsStep } from "@/components/organisms/PrizeDetailsStep/PrizeDetailsStep";
import { CompetitionTimelineStep } from "@/components/organisms/CompetitionTimelineStep/CompetitionTimelineStep";
import { TermsStep } from "@/components/organisms/TermsStep/TermsStep";
import { CompetitionWorkspaceStep } from "@/components/organisms/CompetitionWorkspaceStep/CompetitionWorkspaceStep";

// ============================================================================
// COMPONENT
// ============================================================================

export function HostCompetitionPage() {
  const router = useRouter();
  const [showLaunchModal, setShowLaunchModal] = useState(false);

  const wizard = useHostCompetitionWizard();

  const handleBack = useCallback(() => {
    router.push("/features/competitions");
  }, [router]);

  const handleSaveDraft = useCallback(async () => {
    await wizard.saveDraft();
  }, [wizard]);

  const handlePreview = useCallback(() => {
  }, [wizard.draft]);

  const handleShare = useCallback(() => {
  }, []);

  const handleLaunch = useCallback(() => {
    setShowLaunchModal(true);
  }, []);

  const handleConfirmLaunch = useCallback(async () => {
    const result = await wizard.launchCompetition();
    if (result.ok) {
      setShowLaunchModal(false);
      router.push("/features/competitions");
    }
    return result;
  }, [wizard, router]);

  const handleCloseLaunchModal = useCallback(() => {
    setShowLaunchModal(false);
  }, []);

  const headerActions = [
    { icon: <Search className="size-4" />, label: "Integrate" },
    { icon: <RefreshCw className="size-4" />, label: "Automate" },
    { icon: <UserPlus className="size-4" />, label: "Invite" },
  ];

  const renderStep = () => {
    switch (wizard.currentStep) {
      case 0:
        return (
          <OverviewStep
            imagePreview={wizard.draft.overview.coverImagePreview}
            title={wizard.draft.overview.title}
            description={wizard.draft.overview.description}
            onFileSelect={wizard.setCoverImage}
            onTitleChange={wizard.setOverviewTitle}
            onDescriptionChange={wizard.setOverviewDescription}
          />
        );
      case 1:
        return (
          <PrizeDetailsStep
            prizes={wizard.draft.prizes}
            onAdd={wizard.addPrize}
            onChange={wizard.updatePrize}
            onRemove={wizard.removePrize}
          />
        );
      case 2:
        return (
          <CompetitionTimelineStep
            phases={wizard.draft.timeline}
            onAdd={wizard.addPhase}
            onChange={wizard.updatePhase}
            onRemove={wizard.removePhase}
          />
        );
      case 3:
        return (
          <TermsStep
            content={wizard.draft.terms.richTextContent}
            agreed={wizard.draft.terms.agreed}
            onContentChange={wizard.setTermsContent}
            onAgreedChange={wizard.setTermsAgreed}
          />
        );
      case 4:
        return (
          <CompetitionWorkspaceStep
            selectedModule={wizard.draft.workspace.selectedModule}
            onSelectModule={wizard.setSelectedModule}
            codeEditorState={wizard.codeEditorState}
            activeCodeEditorQuestion={wizard.activeCodeEditorQuestion}
            onAddQuestion={wizard.addQuestion}
            onSelectQuestion={wizard.selectQuestion}
            onUpdateActiveQuestion={wizard.updateActiveQuestion}
            onUpdateActiveQuestionSettings={wizard.updateActiveQuestionSettings}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <HostCompetitionWizardTemplate
        headerSlot={
          <PageHeader
            title="Host Competition"
            actions={headerActions}
            onBack={handleBack}
            onShare={handleShare}
            rightSlot={
              <WizardHeaderActions
                onSaveDraft={handleSaveDraft}
                onPreview={handlePreview}
              />
            }
          />
        }
        body={renderStep()}
        isFirstStep={wizard.isFirstStep}
        isLastStep={wizard.isLastStep}
        canGoNext={wizard.canGoNext}
        onBack={wizard.prevStep}
        onNext={wizard.nextStep}
        onLaunch={handleLaunch}
      />

      <ConfirmLaunchModal
        isOpen={showLaunchModal}
        onClose={handleCloseLaunchModal}
        draft={wizard.draft}
        onConfirm={handleConfirmLaunch}
      />
    </>
  );
}

export default HostCompetitionPage;
