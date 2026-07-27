import React from "react";
import { UnrolledCoursesView } from "@/modules/Course/views";
import { CourseProvider } from "@/modules/Course";

const UnrolledCoursesPage: React.FC = () => {
  return (
    <CourseProvider>
      <UnrolledCoursesView />
    </CourseProvider>
  );
};

export default UnrolledCoursesPage;
