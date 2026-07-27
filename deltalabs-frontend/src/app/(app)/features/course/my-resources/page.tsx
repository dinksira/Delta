"use client";

import React, { useState } from "react";
import { MyResourcesView } from "@/modules/Course/views";
import { CourseProvider } from "@/modules/Course";
import type { ResourceSidebarTabId } from "@/components/organisms/ResourceSidebar";

const MyResourcesPage: React.FC = () => {
  const [activeSidebarTab, setActiveSidebarTab] = useState<ResourceSidebarTabId>('resources');

  return (
    <CourseProvider>
      <MyResourcesView
        activeSidebarTab={activeSidebarTab}
        onSidebarTabChange={setActiveSidebarTab}
      />
    </CourseProvider>
  );
};

export default MyResourcesPage;
