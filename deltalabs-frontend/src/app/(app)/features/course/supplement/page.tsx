import React from "react";
import { SupplementView } from "@/modules/Course/views";
import { CourseProvider } from "@/modules/Course";

const SupplementPage: React.FC = () => {
  return (
    <CourseProvider>
      <SupplementView />
    </CourseProvider>
  );
};

export default SupplementPage;
