import React from "react";
import { SponsorView } from "@/modules/Course/views";
import { CourseProvider } from "@/modules/Course";

const SponsorPage: React.FC = () => {
  return (
    <CourseProvider>
      <SponsorView />
    </CourseProvider>
  );
};

export default SponsorPage;
