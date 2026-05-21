/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
/** TutorLobby Organism: Orchestrates the tutor request and management views. */
import React, { useState } from "react";
import { Typography, Button } from "@/components/theme";
import { TutorCard } from "../molecules/TutorCard";
import { InvitedTutorCard } from "../molecules/InvitedTutorCard";
import { TutorExerciseCard } from "../molecules/TutorExerciseCard";
import { CommunitySearchBar } from "../molecules/CommunitySearchBar";
import { PaginationControl } from "../molecules/PaginationControl";
import { cx } from "@/components/theme/utils";

type TutorTab = "request" | "invited" | "questions";

const DUMMY_TUTORS = [
  { id: "1", name: "Mr Jospeh Kibru", organization: "Addis Ababa UV", subject: "Physics", rating: 4, avatar: "https://i.pravatar.cc/150?u=10" },
  { id: "2", name: "Mr Jospeh Kibru", organization: "Addis Ababa UV", subject: "Physics", rating: 4, avatar: "https://i.pravatar.cc/150?u=11" },
  { id: "3", name: "Mr Jospeh Kibru", organization: "Addis Ababa UV", subject: "Physics", rating: 4, avatar: "https://i.pravatar.cc/150?u=12" },
  { id: "4", name: "Mr Jospeh Kibru", organization: "Addis Ababa UV", subject: "Physics", rating: 4, avatar: "https://i.pravatar.cc/150?u=13" },
];

const DUMMY_INVITED = [
  { id: "1", name: "Mrs Muna", organization: "Addis Ababa UV", subject: "Physics", rating: 4, avatar: "https://i.pravatar.cc/150?u=14", status: "pending" as const, topic: "Kinematics questions" },
  { id: "2", name: "Mrs Muna", organization: "Addis Ababa UV", subject: "Physics", rating: 4, avatar: "https://i.pravatar.cc/150?u=15", status: "Accepted" as const, topic: "Kinematics questions" },
];

const DUMMY_ASSIGNED_EXERCISES = [
  { id: "1", title: "Kinematics", tutorName: "Joseph", questionCount: 25, duration: "30 mins", type: "Multiple Choice", thumbnail: "/course_thumbnail_workspace_1776179531260.png", difficulty: "Easy" },
  { id: "2", title: "Kinematics", tutorName: "Joseph", questionCount: 25, duration: "30 mins", type: "Multiple Choice", thumbnail: "/biology_neural_network_hero.png", difficulty: "Easy" },
];

export const TutorLobby: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TutorTab>("request");
  const [invitedSubTab, setInvitedSubTab] = useState<"direct" | "broadcast">("direct");
  const [currentPage, setCurrentPage] = useState(2);

  const tabs = [
    { id: "request" as TutorTab, label: "Request Tutor" },
    { id: "invited" as TutorTab, label: "Invited Tutors" },
    { id: "questions" as TutorTab, label: "Questions for me" },
  ];

  return (
    <div className="flex flex-col gap-10 pb-10">
      {/* Header Area */}
      <div className="flex flex-col gap-10 sticky top-[-24px] z-40 bg-white/95 backdrop-blur-md -mx-8 px-8 border-b border-[#E2E8F0]/30 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-12">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cx(
                    "relative py-4 text-[18px] font-black transition-all duration-300",
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
          <Button className="!bg-[#114B5F] !text-white rounded-lg px-6 h-10 text-[13px] font-bold border-none shadow-md">
            Broadcast
          </Button>
        </div>

        {/* Search Bar - only show if not in specific views that might need other controls */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
             <CommunitySearchBar />
          </div>
          {activeTab === "invited" && (
            <select className="h-14 px-6 rounded-2xl border border-border-primary bg-[#E2E8F0]/40 text-[#114B5F] font-bold outline-none cursor-pointer">
              <option>Chose Topics</option>
              <option>Physics</option>
              <option>Math</option>
            </select>
          )}
        </div>
      </div>

      {/* Content Area */}
      {activeTab === "request" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {DUMMY_TUTORS.map((tutor) => (
            <TutorCard key={tutor.id} {...tutor} />
          ))}
        </div>
      )}

      {activeTab === "invited" && (
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-8">
             <div className="flex items-center gap-10 border-b border-[#E2E8F0]/10 w-fit">
                <button 
                  onClick={() => setInvitedSubTab("direct")}
                  className={cx("py-2 text-[20px] font-black transition-colors", invitedSubTab === "direct" ? "text-[#114B5F]" : "text-[#64748B]/40")}
                >
                  Direct Invitations
                </button>
                <button 
                  onClick={() => setInvitedSubTab("broadcast")}
                  className={cx("py-2 text-[20px] font-black transition-colors", invitedSubTab === "broadcast" ? "text-[#114B5F]" : "text-[#64748B]/40")}
                >
                  Broadcast invites
                </button>
             </div>

             {invitedSubTab === "direct" && (
               <div className="flex flex-col gap-6 max-w-2xl">
                 {DUMMY_INVITED.map((item) => (
                   <InvitedTutorCard key={item.id} {...item} />
                 ))}
               </div>
             )}

             {invitedSubTab === "broadcast" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {DUMMY_ASSIGNED_EXERCISES.map((item) => (
                    <TutorExerciseCard key={item.id} {...item} />
                  ))}
                </div>
             )}
          </div>
        </div>
      )}

      {activeTab === "questions" && (
        <div className="py-20 text-center">
          <Typography className="text-slate-400 font-medium italic">
            No questions found for you yet.
          </Typography>
        </div>
      )}

      {/* Pagination */}
      <PaginationControl 
        currentPage={currentPage}
        totalPages={25}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default TutorLobby;
/** ################################ /COMPONENT ############################# */
