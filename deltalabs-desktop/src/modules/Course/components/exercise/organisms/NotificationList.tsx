/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
/** NotificationList Organism: Orchestrates the collection of notifications. */
import React from "react";
import { Typography } from "@/components/theme";
import { NotificationCard } from "../molecules/NotificationCard";

const DUMMY_NOTIFICATIONS = [
  { id: "1", title: "Your exam setup is ready", subtitle: "from kebede alemu", isUnread: true },
  { id: "2", title: "Requested Resource Denied", subtitle: "resource denied", isUnread: false },
  { id: "3", title: "Your Rent Request is accepted", subtitle: "you are requested", isUnread: false },
  { id: "4", title: "Requested on Resource", subtitle: "resource rent request", isUnread: false },
];

export const NotificationList: React.FC = () => {
  return (
    <div className="flex flex-col gap-8 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-1 w-fit pt-4">
        <Typography className="text-[24px] font-black text-[#114B5F]">
          Notification
        </Typography>
        <div className="h-[3px] w-full bg-[#114B5F] rounded-full" />
      </div>

      {/* List */}
      <div className="flex flex-col gap-5">
        {DUMMY_NOTIFICATIONS.map((notification) => (
          <NotificationCard 
            key={notification.id}
            title={notification.title}
            subtitle={notification.subtitle}
            isUnread={notification.isUnread}
          />
        ))}
      </div>
    </div>
  );
};

export default NotificationList;
/** ################################ /COMPONENT ############################# */
