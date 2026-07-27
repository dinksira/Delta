/**
 * CompetitionDetailPage
 * Route: /features/competitions/:competitionId
 * Fetches competition detail by ID and renders the CompetitionDetailTemplate.
 */

import { useCallback, useState } from "react";

import { Bell, Play, Trophy, Users } from "lucide-react";

import { CompetitionDetailTemplate } from "@/components/templates/CompetitionDetailTemplate/CompetitionDetailTemplate";
import { Button } from "@/components/theme/Button";
import { TermsAndConditionsModal } from "@/components/organisms/TermsAndConditionsModal/TermsAndConditionsModal";
import { useCompetitionDetail } from "@/modules/Competition/hooks/useCompetitionDetail";

// ============================================================================
// COMPONENT
// ============================================================================

export interface CompetitionDetailPageProps {
  competitionId: string;
}

export function CompetitionDetailPage({
  competitionId,
}: Readonly<CompetitionDetailPageProps>) {
  const { detail, isLoading, error } = useCompetitionDetail(competitionId);
  const [showTerms, setShowTerms] = useState(false);

  const handleBack = useCallback(() => {
    window.history.back();
  }, []);

  const handleIntegrate = useCallback(() => {
  }, []);

  const handleAutomate = useCallback(() => {
  }, []);

  const handleInvite = useCallback(() => {
  }, []);

  const handleBell = useCallback(() => {
  }, []);

  const handleContinue = useCallback(() => {
  }, []);

  const handleOpenTerms = useCallback(() => {
    setShowTerms(true);
  }, []);

  const handleCloseTerms = useCallback(() => {
    setShowTerms(false);
  }, []);

  const handleAcceptTerms = useCallback(() => {
    setShowTerms(false);
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-text-secondary">
        Loading...
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-text-secondary">{error ?? "Competition not found"}</p>
      </div>
    );
  }

  const headerActions = [
    { icon: <Trophy className="size-4" />, label: "Integrate", onClick: handleIntegrate },
    { icon: <Trophy className="size-4" />, label: "Automate", onClick: handleAutomate },
    { icon: <Users className="size-4" />, label: "Invite", onClick: handleInvite },
  ];

  const headerRightSlot = (
    <div className="flex items-center gap-2">
      {/* Notification bell */}
      <button
        type="button"
        onClick={handleBell}
        className="relative flex size-9 items-center justify-center rounded-md border border-border-default text-text-secondary hover:bg-surface-secondary hover:text-text-primary transition-colors"
        aria-label="Notifications"
      >
        <Bell className="size-4" />
        <span className="absolute right-2 top-2 size-2 rounded-full bg-success-500" />
      </button>

      {/* Continue */}
      <Button variant="secondary" size="sm" onClick={handleContinue}>
        <Play className="size-4" />
        Continue
      </Button>

      {/* Start Challenge */}
      <Button variant="primary" size="sm" onClick={handleOpenTerms}>
        <Play className="size-4" />
        Start Challenge
      </Button>
    </div>
  );

  return (
    <>
      <CompetitionDetailTemplate
        title={detail.title}
        headerActions={headerActions}
        headerRightSlot={headerRightSlot}
        onBack={handleBack}
        bannerImageUrl={detail.bannerImageUrl}
        heroTitle={detail.heroTitle}
        heroSubtitle={detail.heroSubtitle}
        deadline={detail.deadline}
        overview={detail.overview}
        prizes={detail.prizes}
        timeline={detail.timeline}
      />

      <TermsAndConditionsModal
        isOpen={showTerms}
        onClose={handleCloseTerms}
        onAccept={handleAcceptTerms}
      />
    </>
  );
}

export default CompetitionDetailPage;
