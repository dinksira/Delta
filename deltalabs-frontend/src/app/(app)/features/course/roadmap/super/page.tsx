import React from "react";
import { RoadmapSuperView } from "@/modules/Course/views";
import { CourseProvider } from "@/modules/Course";

const RoadmapSuperPage: React.FC = () => {
  return (
    <CourseProvider>
      <RoadmapSuperView />
    </CourseProvider>
  );
};

export default RoadmapSuperPage;
