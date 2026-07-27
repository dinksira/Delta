"use client";

import React, { useState } from "react";
import { NotificationView } from "@/modules/Course/views";
import { CourseProvider } from "@/modules/Course";
import type { ResourceSidebarTabId } from "@/components/organisms/ResourceSidebar";

const NotificationPage: React.FC = () => {
  const [activeSidebarTab, setActiveSidebarTab] = useState<ResourceSidebarTabId>('notification');

  return (
    <CourseProvider>
      <NotificationView
        activeSidebarTab={activeSidebarTab}
        onSidebarTabChange={setActiveSidebarTab}
      />
    </CourseProvider>
  );
};

export default NotificationPage;
