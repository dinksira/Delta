/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import React, { useState, useEffect } from "react";
import { ExerciseLayout } from "../components/exercise/templates/ExerciseLayout";
import { ExerciseCard } from "../components/exercise/molecules/ExerciseCard";
import { type ExerciseTabId } from "../components/exercise/organisms/ExerciseSideNav";
import { Typography } from "@/components/theme";
import { FriendsLobby } from "../components/exercise/organisms/FriendsLobby";
import { CommunityHeader, type CommunityTabId } from "../components/exercise/organisms/CommunityHeader";
import { CommunityExerciseCard } from "../components/exercise/molecules/CommunityExerciseCard";
import { PaginationControl } from "../components/exercise/molecules/PaginationControl";
import { cx } from "@/components/theme/utils";
import { HistoryLobby } from "../components/exercise/organisms/HistoryLobby";
import { TutorLobby } from "../components/exercise/organisms/TutorLobby";
import { NotificationList } from "../components/exercise/organisms/NotificationList";

/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */

const DUMMY_COMMUNITY_DATA = [
  // Community Tests
  { id: "1", title: "Kinematics", subtitle: "Addis Ababa UV", questions: 8, duration: "1 hr", thumbnail: "/course_thumbnail_workspace_1776179531260.png", type: "test" as const, tab: "test" },
  { id: "2", title: "Fluid Mechanics", subtitle: "Addis Ababa UV", questions: 8, duration: "1 hr", thumbnail: "/biology_neural_network_hero.png", type: "test" as const, tab: "test" },
  { id: "3", title: "Atoms", subtitle: "The Physics Community", questions: 8, duration: "1 hr", thumbnail: "/biology_neural_network_hero.png", type: "test" as const, tab: "test" },
  { id: "4", title: "Kinematics", subtitle: "John Doe", questions: 8, duration: "1 hr", thumbnail: "/biology_neural_network_hero.png", type: "test" as const, tab: "test" },
  // Community Exercises
  { id: "5", title: "Thermodynamics", subtitle: "Science Hub", questions: 12, duration: "45 min", thumbnail: "/course_thumbnail_workspace_1776179531260.png", type: "exercise" as const, tab: "exercise" },
  { id: "6", title: "Optics Lab", subtitle: "Community Lab", questions: 5, duration: "30 min", thumbnail: "/biology_neural_network_hero.png", type: "exercise" as const, tab: "exercise" },
  // My Exercises
  { id: "7", title: "Kinematics", subtitle: "Tutor Exam by kobedo", questions: 10, duration: "1.5 hr", thumbnail: "/course_thumbnail_workspace_1776179531260.png", type: "exercise" as const, tab: "my" },
  { id: "8", title: "Final Physics Test", subtitle: "Self-Study", questions: 20, duration: "2 hr", thumbnail: "/biology_neural_network_hero.png", type: "exercise" as const, tab: "my" },
];

/** 
 * ExerciseTestView
 * Main view for the Exercise & Test module.
 */
export const ExerciseTestView: React.FC = () => {
  const [activeSideTab, setActiveSideTab] = useState<ExerciseTabId>("home");
  const [communityTab, setCommunityTab] = useState<CommunityTabId>("test");
  const [currentPage, setCurrentPage] = useState(2);
  
  // Reset scroll when switching sub-tabs
  useEffect(() => {
    const container = document.querySelector('main.overflow-y-auto');
    if (container) {
      container.scrollTop = 0;
    }
  }, [activeSideTab, communityTab]);

  const filteredCommunityData = DUMMY_COMMUNITY_DATA.filter(item => item.tab === communityTab);

  return (
    <ExerciseLayout activeSideTab={activeSideTab} onSideTabChange={setActiveSideTab}>
      {/* Header Area: Only show for Community which has sub-tabs */}
      {activeSideTab === "community" && (
        <div className="flex flex-col w-full">
          <CommunityHeader 
            activeTab={communityTab} 
            onTabChange={(tab) => {
              setCommunityTab(tab);
              setCurrentPage(1);
            }} 
          />
        </div>
      )}

      {/* Content Area */}
      {activeSideTab === "home" && (
        <div className="flex flex-col md:flex-row gap-8">
          <ExerciseCard 
            type="exercise"
            title="Exercise"
            description="Take this physics exercise prepared by school of haramaya."
          />
          <ExerciseCard 
            type="test"
            title="Test"
            description="Take this physics test prepared by school of haramaya."
            isLive={true}
          />
        </div>
      )}

      {activeSideTab === "community" && (
        <div className="flex flex-col gap-8 pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredCommunityData.map((item) => (
              <CommunityExerciseCard 
                key={item.id}
                title={item.title}
                subtitle={item.subtitle}
                questionCount={item.questions}
                duration={item.duration}
                thumbnail={item.thumbnail}
                type={item.type}
              />
            ))}
          </div>
          
          <PaginationControl 
            currentPage={currentPage}
            totalPages={25}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {activeSideTab === "friends" && (
        <FriendsLobby />
      )}

      {activeSideTab === "history" && (
        <HistoryLobby />
      )}

      {activeSideTab === "tutor" && (
        <TutorLobby />
      )}

      {activeSideTab === "notification" && (
        <NotificationList />
      )}

      {/* Other tabs can be implemented here similarly */}
      {activeSideTab !== "home" && activeSideTab !== "friends" && activeSideTab !== "community" && activeSideTab !== "history" && activeSideTab !== "tutor" && activeSideTab !== "notification" && (
        <div className="py-20 text-center">
          <Typography className="text-text-tertiary">
            This section is currently under development.
          </Typography>
        </div>
      )}
    </ExerciseLayout>
  );
};

/** ################################ /COMPONENT ############################# */
