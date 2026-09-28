/**
 * relatedCourseData
 * Placeholder entries backing the "Related Course" rail on the course detail
 * page. Thumbnails resolve to locally bundled assets in `public/` so the rail
 * renders in the offline desktop shell without any network call.
 *
 * @example
 * ```tsx
 * <RelatedCoursesSection courses={RELATED_COURSES} searchValue="" ... />
 * ```
 */

import type { RelatedCourse } from "@/components/molecules/RelatedCourseCard";

// ===== CONSTANTS =====

/** Every subject the filter action cycles through. */
export type RelatedCourseSubject = "all" | "science" | "engineering" | "health" | "law";

/** Sort orders the sort action cycles through. */
export type RelatedCourseSort = "relevance" | "rating" | "title";

/** Human-readable subject labels keyed by subject filter value. */
export const RELATED_COURSE_SUBJECT_LABELS: Readonly<Record<RelatedCourseSubject, string>> = {
  all: "All subjects",
  science: "Science",
  engineering: "Engineering",
  health: "Health",
  law: "Law",
};

/** Every subject, in filter-cycle order. */
export const RELATED_COURSE_SUBJECTS: readonly RelatedCourseSubject[] = [
  "all",
  "science",
  "engineering",
  "health",
  "law",
];

/** Every sort order, in sort-cycle order. */
export const RELATED_COURSE_SORTS: readonly RelatedCourseSort[] = [
  "relevance",
  "rating",
  "title",
];

type RelatedCourseRecord = RelatedCourse & { subject: Exclude<RelatedCourseSubject, "all"> };

/** Source list, extended with the `subject` key used by the feature hook. */
export const RELATED_COURSE_RECORDS: readonly RelatedCourseRecord[] = [
  {
    id: "chem-101",
    title: "Chemistry",
    institution: "Haramaya University",
    thumbnailUrl: "/laboratory_glass.png",
    rating: 4,
    ratingCount: 128,
    status: "complement",
    subject: "science",
  },
  {
    id: "bio-201",
    title: "Cell Biology",
    institution: "Haramaya University",
    thumbnailUrl: "/physics_simulation.png",
    rating: 4.5,
    ratingCount: 214,
    status: "supplement",
    subject: "science",
  },
  {
    id: "mech-150",
    title: "Applied Mechanics",
    institution: "Addis Ababa University",
    thumbnailUrl: "/newton_cradle.png",
    rating: 3.5,
    ratingCount: 76,
    status: "complement",
    subject: "engineering",
  },
  {
    id: "pub-110",
    title: "Public Health Foundations",
    institution: "Jimma University",
    thumbnailUrl: "/safety_goggles.png",
    rating: 5,
    ratingCount: 42,
    status: "supplement",
    subject: "health",
  },
  {
    id: "law-300",
    title: "Introduction to Law",
    institution: "Haramaya University",
    thumbnailUrl: "/physics_thumbnails.png",
    rating: 4,
    ratingCount: 91,
    status: "complement",
    subject: "law",
  },
  {
    id: "phy-220",
    title: "Quantum Physics",
    institution: "Mekelle University",
    thumbnailUrl: "/gaming_monitor_1.png",
    rating: 4.5,
    ratingCount: 158,
    status: "supplement",
    subject: "science",
  },
] as const;
