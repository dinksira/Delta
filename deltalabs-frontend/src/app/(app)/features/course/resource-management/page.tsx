import React from "react";
import { ResourceManagementView } from "@/modules/Course/views";
import { CourseProvider } from "@/modules/Course";

const ResourceManagementPage: React.FC = () => {
  return (
    <CourseProvider>
      <ResourceManagementView />
    </CourseProvider>
  );
};

export default ResourceManagementPage;
