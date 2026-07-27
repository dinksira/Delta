import React from "react";
import { CourseMessageView } from "@/modules/Course/views";
import { CourseProvider } from "@/modules/Course";

const CourseMessagePage: React.FC = () => {
  return (
    <CourseProvider>
      <CourseMessageView />
    </CourseProvider>
  );
};

export default CourseMessagePage;
