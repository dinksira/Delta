/**
 * HireTutorSection
 * Course-detail entry point for the Hire a Tutor form.
 *
 * The previous version was a dead prototype: an unlabelled `<textarea>`, a
 * native `<select>`, hand-inlined SVGs, and non-functional buttons. It now
 * delegates to `HireTutorForm`, which composes the remediated organisms.
 *
 * @example
 * ```tsx
 * <HireTutorSection course={course} onSubmit={createRequest} />
 * ```
 */

import React from "react";

import type { Course } from "../../../../types/courseTypes";
import { HireTutorForm } from '../../features/hireTutor';
import type { HireTutorFormState } from '../../features/hireTutor';

export interface HireTutorSectionProps {
  /** Course the request belongs to. */
  course: Course;
  /** Fired when the learner submits a complete request. */
  onSubmit?: (state: HireTutorFormState) => void;
}

/** The Hire a Tutor section for a course. */
export const HireTutorSection: React.FC<HireTutorSectionProps> = ({ course, onSubmit }) => (
  <HireTutorForm
    title="Hire a tutor"
    description={`Request one-on-one support for ${course.title}.`}
    onSubmit={onSubmit}
  />
);

export default HireTutorSection;
