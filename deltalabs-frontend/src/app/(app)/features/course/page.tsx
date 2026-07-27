/**
 * CourseHomePage
 * Main entry point for the Course workspace.
 *
 * @example
 * ```tsx
 * <CourseHomePage />
 * ```
 */

import React from "react";
import { CourseHomeView } from "@/modules/Course/views";
import { CourseProvider } from "@/modules/Course";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

// ============================================================================
// CONSTANTS
// ============================================================================

// ============================================================================
// COMPONENT
// ============================================================================

export const CourseHomePage: React.FC = () => {
  return (
    <CourseProvider>
      <CourseHomeView />
    </CourseProvider>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default CourseHomePage;

// Trigger rebuild
