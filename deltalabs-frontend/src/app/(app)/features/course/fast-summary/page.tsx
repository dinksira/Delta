import React from "react";
import { FastSummaryView } from "@/modules/Course/views";
import { CourseProvider } from "@/modules/Course";

const FastSummaryPage: React.FC = () => {
  return (
    <CourseProvider>
      <FastSummaryView />
    </CourseProvider>
  );
};

export default FastSummaryPage;
