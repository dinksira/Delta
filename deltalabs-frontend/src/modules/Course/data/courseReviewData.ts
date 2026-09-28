/**
 * courseReviewData
 * Static seed reviews and aggregate rating stats for the course reviews feed.
 *
 * In production these come from `GET /courses/{id}/reviews`; the shape below is
 * the contract that endpoint is expected to satisfy.
 */

/** A single review row, matching the `ReviewItem` molecule's shape. */
import type { Review } from "@/components/molecules/ReviewItem";

/** Aggregate stats shown by the `RatingSummary` header. */
export const COURSE_RATING_STATS = {
  average: 4.8,
  totalRatings: 1631,
  breakdown: [
    { stars: 5, percent: 82 },
    { stars: 4, percent: 15 },
    { stars: 3, percent: 2 },
    { stars: 2, percent: 0.4 },
    { stars: 1, percent: 0.6 },
  ],
} as const;

/** Seed reviews, pre-sorted by helpfulness. */
export const COURSE_REVIEWS: readonly Review[] = [
  {
    id: "rev-1",
    author: "Kristy Allen",
    date: "Feb 24, 2023",
    rating: 5,
    content:
      "The labs finally made stoichiometry click for me. Each module builds on the last, so nothing felt disconnected, and the graded checkpoints caught my mistakes before the final exam did.",
    upvotes: 1254,
    downvotes: 125,
    userVote: null,
  },
  {
    id: "rev-2",
    author: "Marcus Webb",
    date: "Jan 18, 2023",
    rating: 4,
    content:
      "Solid pacing and the worked examples are worth it. A few of the later calculus sections assume more background than the prerequisite page suggests, so budget extra time there.",
    upvotes: 612,
    downvotes: 48,
    userVote: null,
  },
  {
    id: "rev-3",
    author: "Priya Raman",
    date: "Dec 05, 2022",
    rating: 5,
    content:
      "I used this alongside a textbook and the practice problems were harder in a good way. The discussion threads on the harder weeks saved me more than once.",
    upvotes: 431,
    downvotes: 21,
    userVote: null,
  },
  {
    id: "rev-4",
    author: "Tobias Lund",
    date: "Nov 12, 2022",
    rating: 3,
    content:
      "Content is accurate and the interface is clean, but the video quality on the older lectures is poor and the captions frequently desync from the audio.",
    upvotes: 208,
    downvotes: 96,
    userVote: null,
  },
  {
    id: "rev-5",
    author: "Amara Osei",
    date: "Oct 30, 2022",
    rating: 5,
    content:
      "Finished the whole track in six weeks around a full-time job. The weekly targets were realistic and the certificate requirements were published up front, which I appreciated.",
    upvotes: 187,
    downvotes: 12,
    userVote: null,
  },
  {
    id: "rev-6",
    author: "Daniel Ferreira",
    date: "Sep 19, 2022",
    rating: 4,
    content:
      "Good coverage of the fundamentals and the quizzes are quick to retake. Would have liked more worked solutions for the final unit.",
    upvotes: 96,
    downvotes: 8,
    userVote: null,
  },
];

/** Reviews revealed per "Show more" press. */
export const REVIEWS_PAGE_SIZE = 3;
