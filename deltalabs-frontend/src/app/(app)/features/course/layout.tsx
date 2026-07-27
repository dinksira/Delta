"use client";

import type { ReactNode } from "react";

import { FeaturesHiddenGate } from "@/modules/Features/components/FeaturesHiddenGate";
import { CourseProvider } from "@/modules/Course/context/CourseContext";

export default function CourseWorkspaceLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <FeaturesHiddenGate featureKey="course">
      <CourseProvider>
        {children}
      </CourseProvider>
    </FeaturesHiddenGate>
  );
}
