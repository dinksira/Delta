/** ################################ DATA ############################# */
/**
 * Seed data for the Hire a Tutor feature.
 *
 * Kept beside the feature rather than inside the components, so the picker
 * organisms stay generic and the view decides what a course can offer. Replace
 * these with API data once the endpoint exists.
 */

import type { PaymentOption } from "@/components/organisms/PaymentOptionDropdown/PaymentOptionDropdown.types";
import type { RoadmapSection } from "@/components/organisms/RoadmapSelectionModal/RoadmapSelectionModal.types";
import type { Tutor } from "@/components/organisms/TutorSelectionModal/TutorSelectionModal.types";
/** ################################ /DATA ############################# */

/** Hourly rate used to turn booked hours into an estimate. */
export const TUTOR_HOURLY_RATE = 45;

/** Default session length, in hours, when nothing else is known. */
export const DEFAULT_SESSION_HOURS = 2;

/** Payment options offered for a tutoring request. */
export const HIRE_TUTOR_PAYMENT_OPTIONS: readonly PaymentOption[] = [
  { id: "card", name: "Credit or debit card", icon: "card", tone: "primary" },
  { id: "bank", name: "Bank transfer", icon: "bank", tone: "neutral" },
  { id: "wallet", name: "Mobile wallet", icon: "wallet", tone: "info" },
  { id: "later", name: "Pay after the session", icon: "none", tone: "success" },
];

/** Roadmap the learner can attach to the request. */
export const HIRE_TUTOR_ROADMAP: readonly RoadmapSection[] = [
  {
    id: "foundations",
    title: "Foundations",
    description: "Core concepts and prerequisite topics to review first.",
    tags: ["Starter"],
    resources: [
      {
        id: "foundations-notes",
        title: "Chapter notes",
        description: "Annotated summary of the opening chapters.",
        kind: "document",
        tags: ["Notes"],
        isReviewable: true,
      },
      {
        id: "foundations-walkthrough",
        title: "Concept walkthrough",
        description: "A short screencast on the core idea.",
        kind: "video",
        tags: ["Video"],
      },
    ],
  },
  {
    id: "practice",
    title: "Practice set",
    description: "Exercises ordered by difficulty.",
    tags: ["Core"],
    resources: [
      {
        id: "practice-drill",
        title: "Drill pack",
        description: "Graded exercises with worked solutions.",
        kind: "document",
        tags: ["Exercises"],
        isReviewable: true,
      },
      {
        id: "practice-audio",
        title: "Explainer audio",
        description: "Audio walkthrough for reviewing on the move.",
        kind: "audio",
        tags: ["Audio"],
      },
    ],
  },
  {
    id: "exam-prep",
    title: "Exam preparation",
    description: "Timed practice and past-paper strategy.",
    tags: ["Advanced"],
    resources: [
      {
        id: "exam-prep-mock",
        title: "Mock paper",
        description: "Full-length paper under timed conditions.",
        kind: "document",
        tags: ["Mock"],
        isReviewable: true,
      },
    ],
  },
];

/** Tutors that can be invited. No portraits: `Avatar` falls back to a monogram. */
export const HIRE_TUTOR_TUTORS: readonly Tutor[] = [
  {
    id: "tutor-amara",
    name: "Amara Osei",
    title: "MSc Applied Mathematics · 4.9 (128)",
  },
  {
    id: "tutor-daniel",
    name: "Daniel Reyes",
    title: "BEng Mechanical Engineering · 4.8 (96)",
  },
  {
    id: "tutor-lina",
    name: "Lina Haddad",
    title: "PhD Molecular Biology · 4.7 (74)",
  },
  {
    id: "tutor-tomas",
    name: "Tomas Novak",
    title: "MSc Computer Science · 4.6 (61)",
  },
];
