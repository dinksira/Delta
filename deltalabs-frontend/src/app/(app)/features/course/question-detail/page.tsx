"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { QuestionDetailView } from "@/modules/Course/views";
import { CourseProvider } from "@/modules/Course";

const QuestionDetailPage: React.FC = () => {
  const router = useRouter();

  return (
    <CourseProvider>
      <QuestionDetailView
        questionId=""
        onBack={() => router.back()}
      />
    </CourseProvider>
  );
};

export default QuestionDetailPage;
