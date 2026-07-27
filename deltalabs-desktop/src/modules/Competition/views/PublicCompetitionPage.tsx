/**
 * PublicCompetitionPage
 * Hub page for both "Public Competitions" and "My Competitions" tabs.
 * Route: /features/competitions
 *
 * - Public tab: left-column status/achievements + right-column game modes/upcoming
 * - My Competitions tab: editable customizable table
 */

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { Trophy, Users } from "lucide-react";

import { usePublicData } from "@/modules/Competition/hooks/usePublicData";
import { useCustomTable } from "@/modules/Competition/hooks/useCustomTable";
import { PageHeader } from "@/components/organisms/PageHeader/PageHeader";
import { TabsRow } from "@/components/organisms/TabsRow/TabsRow";
import { MyCompetitionToolbar } from "@/components/organisms/MyCompetitionToolbar/MyCompetitionToolbar";
import { CustomizableTable } from "@/components/organisms/CustomizableTable/CustomizableTable";
import { PublicCompetitionTemplate } from "@/components/templates/PublicCompetitionTemplate/PublicCompetitionTemplate";
import { MyCompetitionTemplate } from "@/components/templates/MyCompetitionTemplate/MyCompetitionTemplate";
import { YourStatusCard } from "@/components/organisms/YourStatusCard/YourStatusCard";
import { AchievementsCard } from "@/components/organisms/AchievementsCard/AchievementsCard";
import { GameModeRow } from "@/components/organisms/GameModeRow/GameModeRow";
import { UpcomingCompetitionCard } from "@/components/organisms/UpcomingCompetitionCard/UpcomingCompetitionCard";

// ============================================================================
// COMPONENT
// ============================================================================

export function PublicCompetitionPage() {
  const router = useRouter();

  const {
    userStatus,
    achievements,
    gameModes,
    upcomingCompetitions,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    isLoaded,
  } = usePublicData();

  const table = useCustomTable();

  const handleFilterClick = useCallback(() => {
  }, []);

  const handleHostCompetition = useCallback(() => {
    router.push("/features/competitions/host");
  }, [router]);

  const handleCtaClick = useCallback((modeId: string) => {
    if (modeId === "topic-battles") {
      window.location.hash = "#/features/competitions/topic-battles";
    }
  }, []);

  const headerActions = [
    { icon: <Trophy className="size-4" />, label: "Integrate" },
    { icon: <Trophy className="size-4" />, label: "Automate" },
    { icon: <Users className="size-4" />, label: "Invite" },
  ];

  if (!isLoaded) {
    return null;
  }

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-6">
      {/* Page header — title changes with tab */}
      <PageHeader
        title={activeTab === "public" ? "Active Competition" : "My Competition"}
        actions={headerActions}
      />

      {/* Tab bar — default right-side for public, MyCompetitionToolbar for mine */}
      <TabsRow
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onFilterClick={handleFilterClick}
        onHostCompetition={handleHostCompetition}
        rightSlot={
          activeTab === "mine" ? (
            <MyCompetitionToolbar onHostCompetition={handleHostCompetition} />
          ) : undefined
        }
      />

      {/* Conditional tab content */}
      {activeTab === "public" ? (
        <PublicCompetitionTemplate
          leftColumn={
            <>
              <YourStatusCard
                tier={userStatus.tier}
                level={userStatus.level}
                currentPoints={userStatus.currentPoints}
                maxPoints={userStatus.maxPoints}
                totalEarnings={userStatus.totalEarnings}
                totalWon={userStatus.totalWon}
              />
              <AchievementsCard achievements={achievements} />
            </>
          }
          rightColumn={
            <>
              <GameModeRow modes={gameModes} onCtaClick={handleCtaClick} />
              <UpcomingCompetitionCard
                competitions={upcomingCompetitions}
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                onFilterClick={handleFilterClick}
              />
            </>
          }
        />
      ) : (
        <MyCompetitionTemplate
          header={null}
          toolbar={null}
          table={
            <CustomizableTable
              columns={table.columns}
              rows={table.rows}
              selectAll={table.selectAll}
              selectedRows={table.selectedRows}
              onToggleSelectAll={table.toggleSelectAll}
              onAddColumn={table.addColumn}
              onAddRow={table.addRow}
              onToggleRowSelection={table.toggleRowSelection}
              onUpdateCell={table.updateCell}
              onUpdateColumnLabel={table.updateColumnLabel}
              onRemoveColumn={table.removeColumn}
              onRemoveRow={table.removeRow}
            />
          }
        />
      )}
    </div>
  );
}

export default PublicCompetitionPage;
