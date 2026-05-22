/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import React from "react";
import { NotificationCard } from "../molecules/NotificationCard";

/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** 
 * NotificationList Organism
 * Renders a vertical stack of notifications.
 */
export const NotificationList: React.FC = () => {
  const notifications = [
    { 
      id: "1", 
      title: "Answer on What is the idea of modern physics?", 
      description: "new answer given to your question", 
      isUnread: true 
    },
    { 
      id: "2", 
      title: "Answer on What is the idea of modern physics?", 
      description: "new answer given to your question", 
      isUnread: false 
    },
    { 
      id: "3", 
      title: "Answer on What is the idea of modern physics?", 
      description: "new answer given to your question", 
      isUnread: false 
    },
    { 
      id: "4", 
      title: "Answer on What is the idea of modern physics?", 
      description: "new answer given to your question", 
      isUnread: false 
    },
  ];

  return (
    <div className="flex flex-col gap-4 w-full py-6">
      {notifications.map((n) => (
        <NotificationCard 
          key={n.id}
          title={n.title}
          description={n.description}
          isUnread={n.isUnread}
        />
      ))}
    </div>
  );
};

/** ################################ /COMPONENT ############################# */
