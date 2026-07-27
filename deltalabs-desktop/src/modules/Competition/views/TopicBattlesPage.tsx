/**
 * TopicBattlesPage
 * Browse, filter, and join topic battles. Shows payment confirmation modal on join.
 * Route: /features/competitions/topic-battles
 */

import { CheckCircle2, X } from "lucide-react";

import { TopicBattlesTemplate } from "@/components/templates/TopicBattlesTemplate/TopicBattlesTemplate";
import { PaymentConfirmationModal } from "@/components/organisms/PaymentConfirmationModal/PaymentConfirmationModal";
import { useTopicBattles } from "@/modules/Competition/hooks/useTopicBattles";
import { cn } from "@/lib/utils";

// ============================================================================
// COMPONENT
// ============================================================================

export function TopicBattlesPage() {
  const {
    battles,
    subjectCounts,
    isLoading,
    subjectFilter,
    setSubjectFilter,
    searchQuery,
    setSearchQuery,
    handleJoin,
    handleCreateNew,
    selectedBattle,
    handleCloseModal,
    handleConfirmPayment,
    walletBalance,
    addFunds,
    successMessage,
    handleDismissSuccess,
  } = useTopicBattles();

  const handleBack = () => {
    window.location.hash = "/features/competitions";
  };

  return (
    <>
      {successMessage && (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-[300] flex items-center gap-3",
            "rounded-lg border border-success-500/30 bg-success-500/10 px-4 py-3",
            "shadow-lg",
          )}
        >
          <CheckCircle2 className="size-5 text-success-500 shrink-0" aria-hidden />
          <span className="text-sm font-medium text-text-primary">{successMessage}</span>
          <button
            type="button"
            onClick={handleDismissSuccess}
            className="ml-2 rounded-md p-0.5 text-text-secondary hover:text-text-primary transition-colors"
            aria-label="Dismiss"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      <TopicBattlesTemplate
        battles={battles}
        isLoading={isLoading}
        subjectCounts={subjectCounts}
        activeSubject={subjectFilter}
        searchValue={searchQuery}
        onSubjectChange={setSubjectFilter}
        onSearchChange={setSearchQuery}
        onCreateNew={handleCreateNew}
        onJoin={handleJoin}
        onBack={handleBack}
      />

      {selectedBattle && (
        <PaymentConfirmationModal
          battle={selectedBattle}
          isOpen={!!selectedBattle}
          onClose={handleCloseModal}
          onConfirm={handleConfirmPayment}
          walletBalance={walletBalance}
          onAddFunds={addFunds}
        />
      )}
    </>
  );
}

export default TopicBattlesPage;
