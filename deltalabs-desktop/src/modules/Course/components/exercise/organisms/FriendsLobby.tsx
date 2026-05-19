import React from "react";
import { SharedSessionHeader } from "../organisms/SharedSessionHeader";
import { SharedSessionCard } from "../molecules/SharedSessionCard";
import { CommunitySearchBar } from "../molecules/CommunitySearchBar";
import { PaginationControl } from "../molecules/PaginationControl";

const DUMMY_SESSIONS = [
  { 
    id: "1", 
    title: "Kinematics", 
    subtitle: "Addis Ababa UV", 
    questions: 8, 
    duration: "1 hr", 
    thumbnail: "/course_thumbnail_workspace_1776179531260.png", 
    roleLabel: "Invited by Leul",
    avatars: ["https://i.pravatar.cc/150?u=1", "https://i.pravatar.cc/150?u=2"]
  },
  { 
    id: "2", 
    title: "Kinematics", 
    subtitle: "Addis Ababa UV", 
    questions: 8, 
    duration: "1 hr", 
    thumbnail: "/biology_neural_network_hero.png", 
    roleLabel: "Owner",
    avatars: ["https://i.pravatar.cc/150?u=3", "https://i.pravatar.cc/150?u=4"]
  },
  { 
    id: "3", 
    title: "Kinematics", 
    subtitle: "Addis Ababa UV", 
    questions: 8, 
    duration: "1 hr", 
    thumbnail: "/biology_neural_network_hero.png", 
    roleLabel: "Owner",
    avatars: ["https://i.pravatar.cc/150?u=5", "https://i.pravatar.cc/150?u=6"]
  },
  { 
    id: "4", 
    title: "Kinematics", 
    subtitle: "Addis Ababa UV", 
    questions: 8, 
    duration: "1 hr", 
    thumbnail: "/biology_neural_network_hero.png", 
    roleLabel: "Invited by Leul",
    avatars: ["https://i.pravatar.cc/150?u=7", "https://i.pravatar.cc/150?u=8"]
  },
];

export const FriendsLobby: React.FC = () => {
  const [currentPage, setCurrentPage] = React.useState(2);

  return (
    <div className="flex flex-col gap-10 pb-10">
      {/* Header & Search */}
      <div className="flex flex-col gap-10 sticky top-[-24px] z-40 bg-white/95 backdrop-blur-md pb-6 -mx-8 px-8 border-b border-[#E2E8F0]/30 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <SharedSessionHeader />
        <CommunitySearchBar />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {DUMMY_SESSIONS.map((session) => (
          <SharedSessionCard 
            key={session.id}
            title={session.title}
            subtitle={session.subtitle}
            questionCount={session.questions}
            duration={session.duration}
            thumbnail={session.thumbnail}
            roleLabel={session.roleLabel}
            avatars={session.avatars}
          />
        ))}
      </div>

      {/* Pagination */}
      <PaginationControl 
        currentPage={currentPage}
        totalPages={25}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default FriendsLobby;
/** ################################ /COMPONENT ############################# */
