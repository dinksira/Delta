import React from "react";
import { RoadmapView } from "@/modules/Course/views";
import { CourseProvider } from "@/modules/Course";

const RoadmapPage: React.FC = () => {
  return (
    <CourseProvider>
      <RoadmapView />
    </CourseProvider>
  );
};

export default RoadmapPage;
