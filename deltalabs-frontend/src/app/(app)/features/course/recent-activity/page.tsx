import React from "react";
import { RecentActivityView } from "@/modules/Course/views";
import { CourseProvider } from "@/modules/Course";

const RecentActivityPage: React.FC = () => {
  return (
    <CourseProvider>
      <RecentActivityView />
    </CourseProvider>
  );
};

export default RecentActivityPage;
