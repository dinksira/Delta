import React from "react";
import { ScoreView } from "@/modules/Course/views";
import { CourseProvider } from "@/modules/Course";

const ScorePage: React.FC = () => {
  return (
    <CourseProvider>
      <ScoreView />
    </CourseProvider>
  );
};

export default ScorePage;
