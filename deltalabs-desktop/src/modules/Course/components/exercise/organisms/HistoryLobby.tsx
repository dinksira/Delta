/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
/** HistoryLobby Organism: Orchestrates the exercise history views. */
import React, { useState } from "react";
import { HistoryExerciseCard } from "../molecules/HistoryExerciseCard";
import { HistoryAnalysisCard } from "../molecules/HistoryAnalysisCard";
import { cx } from "@/components/theme/utils";

type HistoryTab = "completed" | "unfinished" | "analysis";

const COMPLETED_DATA = [
  { id: "1", title: "Ethiopian National Exam questions about Fluid Mechanics", description: "Explain how the angle of projection, the incline angle, and the initial velocity affect the trajectory, time of flight, maximum height, and range of a projectile launched from an inclined plane. Discuss how ..", difficulty: "Easy", type: "Multiple Choice", duration: "30 mins", attempts: "300+ attempts", userName: "Leul Solomon", userAvatar: "https://i.pravatar.cc/150?u=1", timeAgo: "Answered 4 mins ago" },
  { id: "2", title: "Ethiopian National Exam questions about Fluid Mechanics", description: "Explain how the angle of projection, the incline angle, and the initial velocity affect the trajectory, time of flight, maximum height, and range of a projectile launched from an inclined plane. Discuss how ..", difficulty: "Easy", type: "Multiple Choice", duration: "30 mins", attempts: "300+ attempts", userName: "Leul Solomon", userAvatar: "https://i.pravatar.cc/150?u=2", timeAgo: "Answered 4 mins ago" },
  { id: "3", title: "Ethiopian National Exam questions about Fluid Mechanics", description: "Explain how the angle of projection, the incline angle, and the initial velocity affect the trajectory, time of flight, maximum height, and range of a projectile launched from an inclined plane. Discuss how ..", difficulty: "Easy", type: "Multiple Choice", duration: "30 mins", attempts: "300+ attempts", userName: "Leul Solomon", userAvatar: "https://i.pravatar.cc/150?u=3", timeAgo: "Answered 4 mins ago" },
];

const ANALYSIS_DATA = [
  { id: "1", title: "Kinematics", performance: 50, attempts: 10, correctPercentage: 53, incorrectPercentage: 47, difficulty: "Hard" as const },
  { id: "2", title: "Atoms", performance: 50, attempts: 10, correctPercentage: 53, incorrectPercentage: 47, difficulty: "Hard" as const },
  { id: "3", title: "Mechanics", performance: 50, attempts: 10, correctPercentage: 53, incorrectPercentage: 47, difficulty: "Hard" as const },
];

export const HistoryLobby: React.FC = () => {
  const [activeTab, setActiveTab] = useState<HistoryTab>("completed");

  const tabs = [
    { id: "completed" as HistoryTab, label: "Completed Exercise" },
    { id: "unfinished" as HistoryTab, label: "Unfinished Exercises" },
    { id: "analysis" as HistoryTab, label: "Analysis" },
  ];

  return (
    <div className="flex flex-col gap-10">
      {/* Tab Navigation */}
      <div className="flex items-center gap-12 w-fit mx-auto sm:mx-0 sticky top-[-24px] z-40 bg-white/95 backdrop-blur-md -mx-8 px-8 border-b border-[#E2E8F0]/30 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cx(
                "relative py-6 text-[18px] font-black transition-all duration-300",
                isActive ? "text-[#114B5F]" : "text-[#64748B]/60 hover:text-[#114B5F]/80"
              )}
            >
              {tab.label}
              {isActive && (
                <div className="absolute bottom-[-1px] left-0 right-0 h-[3px] bg-[#114B5F] rounded-t-full shadow-[0_-2px_6px_rgba(17,75,95,0.3)]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="flex flex-col gap-2 pb-20">
        {(activeTab === "completed" || activeTab === "unfinished") && (
          <div className="flex flex-col">
            {(activeTab === "completed" ? COMPLETED_DATA : COMPLETED_DATA.slice(0, 2)).map((item) => (
              <HistoryExerciseCard 
                key={item.id}
                {...item}
                actionLabel={activeTab === "completed" ? "Go to Exercise" : "Resume Exercise"}
              />
            ))}
          </div>
        )}

        {activeTab === "analysis" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
            {ANALYSIS_DATA.map((item) => (
              <HistoryAnalysisCard key={item.id} {...item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryLobby;
/** ################################ /COMPONENT ############################# */
