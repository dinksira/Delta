import React from "react";
import { WishlistView } from "@/modules/Course/views";
import { CourseProvider } from "@/modules/Course";

const WishlistPage: React.FC = () => {
  return (
    <CourseProvider>
      <WishlistView />
    </CourseProvider>
  );
};

export default WishlistPage;
