/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import React from "react";
import { LiveCard } from "../molecules/LiveCard";

/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** 
 * LiveList Organism
 * Renders a grid of live session cards.
 */
export const LiveList: React.FC = () => {
  const sessions = [
    { 
      id: "1", 
      title: "What is Quantum", 
      authorName: "Leul Mekonnen", 
      invitedLabel: "Invited", 
      isLive: true, 
      viewerCount: 4 
    },
    { 
      id: "2", 
      title: "What is Mechanics", 
      authorName: "Leul Mekonnen", 
      invitedLabel: "Invited By", 
      isLive: false, 
      viewerCount: 0 
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full py-6">
      {sessions.map((s) => (
        <LiveCard 
          key={s.id}
          title={s.title}
          authorName={s.authorName}
          invitedLabel={s.invitedLabel}
          isLive={s.isLive}
          viewerCount={s.viewerCount}
        />
      ))}
    </div>
  );
};

/** ################################ /COMPONENT ############################# */
