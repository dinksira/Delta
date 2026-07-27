import React from "react";
import { RoadmapDetailView } from "@/modules/Course/views";
import { CourseProvider } from "@/modules/Course";

const RoadmapDetailPage: React.FC = () => {
  return (
    <CourseProvider>
      <RoadmapDetailView />
    </CourseProvider>
  );
};

export default RoadmapDetailPage;
