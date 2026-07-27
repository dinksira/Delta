import React from "react";
import { ExerciseTestView } from "@/modules/Course/views";
import { CourseProvider } from "@/modules/Course";

const ExerciseTestPage: React.FC = () => {
  return (
    <CourseProvider>
      <ExerciseTestView />
    </CourseProvider>
  );
};

export default ExerciseTestPage;
