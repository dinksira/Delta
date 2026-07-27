import React from "react";
import { OfflineCoursesView } from "@/modules/Course/views";
import { CourseProvider } from "@/modules/Course";

const OfflineCoursesPage: React.FC = () => {
  return (
    <CourseProvider>
      <OfflineCoursesView />
    </CourseProvider>
  );
};

export default OfflineCoursesPage;
