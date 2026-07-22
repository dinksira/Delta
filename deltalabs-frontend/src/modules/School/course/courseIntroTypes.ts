/** Flexible Course Intro studio payload — Figma Course Intro Direct View. */

export type CourseIntroVideo = Readonly<{
  id: string;
  mediaId: string;
  /** Absolute progressive/HLS URL for the <video> player when known. */
  playbackUrl: string;
  title: string;
  label: string;
  description: string;
  keyframeTime: string;
  tags: readonly string[];
  status: "draft" | "published" | string;
  publishToFeed: boolean;
  createdAt: string;
  updatedAt: string;
}>;

export type CourseIntroReply = Readonly<{
  id: string;
  author: string;
  text: string;
  createdAt: string;
}>;

export type CourseIntroComment = Readonly<{
  id: string;
  author: string;
  authorUserId: string;
  text: string;
  createdAt: string;
  likes: number;
  dislikes: number;
  likedByMe: boolean;
  dislikedByMe: boolean;
  replies: readonly CourseIntroReply[];
}>;

/** About Course tab — matches Figma cover / name / welcome / details. */
export type CourseIntroAbout = Readonly<{
  coverImageUrl: string;
  courseName: string;
  welcomeMessage: string;
  details: string;
  /** Legacy fields kept for mobile compatibility. */
  summary: string;
  objectives: readonly string[];
  audience: string;
  duration: string;
  language: string;
  enrolledCount: number;
}>;

export type CourseIntroReview = Readonly<{
  id: string;
  author: string;
  rating: number;
  text: string;
  createdAt: string;
}>;

export type CourseIntroPrerequisites = Readonly<{
  /** Rich-text / plain body shown in the Figma editor. */
  body: string;
  /** Optional linked course workspace item ids (Add Course). */
  linkedCourseIds: readonly string[];
  required: readonly string[];
  recommended: readonly string[];
  materials: readonly string[];
}>;

export type CourseIntroPerformanceBar = Readonly<{
  name: string;
  score: number;
}>;

export type CourseIntroAnalysis = Readonly<{
  notes: string;
  strengths: readonly string[];
  gaps: readonly string[];
  targetCompletionRate: number | null;
  enrollmentCount: number;
  enrollmentDeltaPct: number;
  completionCount: number;
  completionDelta: number;
  performance: readonly CourseIntroPerformanceBar[];
}>;

export type CourseIntroRelatedCourse = Readonly<{
  id: string;
  title: string;
  orgLabel: string;
  rating: number;
  coverUrl: string;
}>;

export type CourseIntroDoc = Readonly<{
  schemaVersion: number;
  publishReady: boolean;
  videos: readonly CourseIntroVideo[];
  activeVideoId: string | null;
  comments: readonly CourseIntroComment[];
  about: CourseIntroAbout;
  relatedCourseIds: readonly string[];
  /** Cached display rows for related courses (optional). */
  relatedCourses: readonly CourseIntroRelatedCourse[];
  reviews: readonly CourseIntroReview[];
  prerequisites: CourseIntroPrerequisites;
  analysis: CourseIntroAnalysis;
}>;

export const EMPTY_COURSE_INTRO: CourseIntroDoc = {
  schemaVersion: 1,
  publishReady: false,
  videos: [],
  activeVideoId: null,
  comments: [],
  about: {
    coverImageUrl: "",
    courseName: "",
    welcomeMessage: "",
    details: "",
    summary: "",
    objectives: [],
    audience: "",
    duration: "",
    language: "",
    enrolledCount: 0,
  },
  relatedCourseIds: [],
  relatedCourses: [],
  reviews: [],
  prerequisites: {
    body: "",
    linkedCourseIds: [],
    required: [],
    recommended: [],
    materials: [],
  },
  analysis: {
    notes: "",
    strengths: [],
    gaps: [],
    targetCompletionRate: null,
    enrollmentCount: 0,
    enrollmentDeltaPct: 0,
    completionCount: 0,
    completionDelta: 0,
    performance: [
      { name: "Dink", score: 0 },
      { name: "Leul", score: 0 },
      { name: "Haile", score: 0 },
      { name: "Meron", score: 0 },
    ],
  },
};

function asStringList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((e) => String(e).trim()).filter(Boolean);
}

export function parseCourseIntroFromMetadata(
  metadata: Record<string, unknown> | null | undefined,
): CourseIntroDoc {
  const raw = metadata?.courseIntro ?? metadata?.course_intro;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return EMPTY_COURSE_INTRO;
  const map = raw as Record<string, unknown>;

  let videos: CourseIntroVideo[] = [];
  if (Array.isArray(map.videos)) {
    videos = map.videos
      .filter((v): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v))
      .map((v) => ({
        id: String(v.id ?? ""),
        mediaId: String(v.mediaId ?? v.media_id ?? ""),
        playbackUrl: String(v.playbackUrl ?? v.playback_url ?? ""),
        title: String(v.title ?? "Intro video"),
        label: String(v.label ?? ""),
        description: String(v.description ?? ""),
        keyframeTime: String(v.keyframeTime ?? v.keyframe_time ?? "00:00"),
        tags: asStringList(v.tags),
        status: String(v.status ?? "draft"),
        publishToFeed: Boolean(v.publishToFeed ?? v.publish_to_feed ?? false),
        createdAt: String(v.createdAt ?? v.created_at ?? ""),
        updatedAt: String(v.updatedAt ?? v.updated_at ?? ""),
      }));
  }

  const commentsRaw = Array.isArray(map.comments) ? map.comments : [];
  const comments: CourseIntroComment[] = commentsRaw
    .filter((c): c is Record<string, unknown> => !!c && typeof c === "object" && !Array.isArray(c))
    .map((c) => ({
      id: String(c.id ?? ""),
      author: String(c.author ?? "Someone"),
      authorUserId: String(c.authorUserId ?? c.author_user_id ?? ""),
      text: String(c.text ?? ""),
      createdAt: String(c.createdAt ?? c.created_at ?? ""),
      likes: Number(c.likes ?? 0),
      dislikes: Number(c.dislikes ?? 0),
      likedByMe: Boolean(c.likedByMe ?? c.liked_by_me ?? false),
      dislikedByMe: Boolean(c.dislikedByMe ?? c.disliked_by_me ?? false),
      replies: Array.isArray(c.replies)
        ? c.replies
            .filter((r): r is Record<string, unknown> => !!r && typeof r === "object" && !Array.isArray(r))
            .map((r) => ({
              id: String(r.id ?? ""),
              author: String(r.author ?? "Someone"),
              text: String(r.text ?? ""),
              createdAt: String(r.createdAt ?? r.created_at ?? ""),
            }))
        : [],
    }));

  const aboutRaw =
    map.about && typeof map.about === "object" && !Array.isArray(map.about)
      ? (map.about as Record<string, unknown>)
      : {};
  const prereqRaw =
    (map.prerequisites ?? map.prereqs) &&
    typeof (map.prerequisites ?? map.prereqs) === "object" &&
    !Array.isArray(map.prerequisites ?? map.prereqs)
      ? ((map.prerequisites ?? map.prereqs) as Record<string, unknown>)
      : {};
  const analysisRaw =
    map.analysis && typeof map.analysis === "object" && !Array.isArray(map.analysis)
      ? (map.analysis as Record<string, unknown>)
      : {};
  const reviewsRaw = Array.isArray(map.reviews) ? map.reviews : [];
  const relatedCoursesRaw = Array.isArray(map.relatedCourses) ? map.relatedCourses : [];
  const summary = String(aboutRaw.summary ?? "");
  const details = String(aboutRaw.details ?? aboutRaw.detail ?? summary);

  const performanceRaw = Array.isArray(analysisRaw.performance) ? analysisRaw.performance : null;
  const performance: CourseIntroPerformanceBar[] = performanceRaw
    ? performanceRaw
        .filter((p): p is Record<string, unknown> => !!p && typeof p === "object" && !Array.isArray(p))
        .map((p) => ({
          name: String(p.name ?? ""),
          score: Math.min(100, Math.max(0, Number(p.score ?? 0))),
        }))
    : [...EMPTY_COURSE_INTRO.analysis.performance];

  return {
    schemaVersion: Number(map.schemaVersion ?? map.schema_version ?? 1),
    publishReady: Boolean(map.publishReady ?? map.publish_ready ?? false),
    videos,
    activeVideoId:
      map.activeVideoId != null || map.active_video_id != null
        ? String(map.activeVideoId ?? map.active_video_id)
        : null,
    comments,
    about: {
      coverImageUrl: String(aboutRaw.coverImageUrl ?? aboutRaw.cover_image_url ?? ""),
      courseName: String(aboutRaw.courseName ?? aboutRaw.course_name ?? ""),
      welcomeMessage: String(aboutRaw.welcomeMessage ?? aboutRaw.welcome_message ?? ""),
      details,
      summary: summary || details,
      objectives: asStringList(aboutRaw.objectives),
      audience: String(aboutRaw.audience ?? ""),
      duration: String(aboutRaw.duration ?? ""),
      language: String(aboutRaw.language ?? ""),
      enrolledCount: Math.max(0, Number(aboutRaw.enrolledCount ?? aboutRaw.enrolled_count ?? 0)),
    },
    relatedCourseIds: asStringList(map.relatedCourseIds ?? map.related_course_ids),
    relatedCourses: relatedCoursesRaw
      .filter((r): r is Record<string, unknown> => !!r && typeof r === "object" && !Array.isArray(r))
      .map((r) => ({
        id: String(r.id ?? ""),
        title: String(r.title ?? "Course"),
        orgLabel: String(r.orgLabel ?? r.org_label ?? ""),
        rating: Number(r.rating ?? 0),
        coverUrl: String(r.coverUrl ?? r.cover_url ?? ""),
      })),
    reviews: reviewsRaw
      .filter((r): r is Record<string, unknown> => !!r && typeof r === "object" && !Array.isArray(r))
      .map((r) => ({
        id: String(r.id ?? ""),
        author: String(r.author ?? "Someone"),
        rating: Math.min(5, Math.max(1, Number(r.rating ?? 5))),
        text: String(r.text ?? ""),
        createdAt: String(r.createdAt ?? r.created_at ?? ""),
      })),
    prerequisites: {
      body: String(
        prereqRaw.body ??
          (Array.isArray(prereqRaw.required)
            ? asStringList(prereqRaw.required).join("\n")
            : ""),
      ),
      linkedCourseIds: asStringList(prereqRaw.linkedCourseIds ?? prereqRaw.linked_course_ids),
      required: asStringList(prereqRaw.required),
      recommended: asStringList(prereqRaw.recommended),
      materials: asStringList(prereqRaw.materials),
    },
    analysis: {
      notes: String(analysisRaw.notes ?? ""),
      strengths: asStringList(analysisRaw.strengths),
      gaps: asStringList(analysisRaw.gaps),
      targetCompletionRate:
        analysisRaw.targetCompletionRate != null || analysisRaw.target_completion_rate != null
          ? Number(analysisRaw.targetCompletionRate ?? analysisRaw.target_completion_rate)
          : null,
      enrollmentCount: Math.max(
        0,
        Number(analysisRaw.enrollmentCount ?? analysisRaw.enrollment_count ?? 0),
      ),
      enrollmentDeltaPct: Number(
        analysisRaw.enrollmentDeltaPct ?? analysisRaw.enrollment_delta_pct ?? 0,
      ),
      completionCount: Math.max(
        0,
        Number(analysisRaw.completionCount ?? analysisRaw.completion_count ?? 0),
      ),
      completionDelta: Number(analysisRaw.completionDelta ?? analysisRaw.completion_delta ?? 0),
      performance,
    },
  };
}

export function courseIntroToJson(doc: CourseIntroDoc): Record<string, unknown> {
  return {
    schemaVersion: doc.schemaVersion,
    publishReady: doc.publishReady,
    videos: doc.videos.map((v) => ({ ...v })),
    activeVideoId: doc.activeVideoId,
    comments: doc.comments.map((c) => ({
      ...c,
      replies: c.replies.map((r) => ({ ...r })),
    })),
    about: { ...doc.about, objectives: [...doc.about.objectives] },
    relatedCourseIds: [...doc.relatedCourseIds],
    relatedCourses: doc.relatedCourses.map((r) => ({ ...r })),
    reviews: doc.reviews.map((r) => ({ ...r })),
    prerequisites: {
      body: doc.prerequisites.body,
      linkedCourseIds: [...doc.prerequisites.linkedCourseIds],
      required: [...doc.prerequisites.required],
      recommended: [...doc.prerequisites.recommended],
      materials: [...doc.prerequisites.materials],
    },
    analysis: {
      notes: doc.analysis.notes,
      strengths: [...doc.analysis.strengths],
      gaps: [...doc.analysis.gaps],
      targetCompletionRate: doc.analysis.targetCompletionRate,
      enrollmentCount: doc.analysis.enrollmentCount,
      enrollmentDeltaPct: doc.analysis.enrollmentDeltaPct,
      completionCount: doc.analysis.completionCount,
      completionDelta: doc.analysis.completionDelta,
      performance: doc.analysis.performance.map((p) => ({ ...p })),
    },
  };
}

export type CourseIntroSubTabId =
  | "intro"
  | "about"
  | "related"
  | "reviews"
  | "prerequisites"
  | "analysis";

export const COURSE_INTRO_SUB_TABS: readonly { id: CourseIntroSubTabId; label: string }[] = [
  { id: "intro", label: "Intro" },
  { id: "about", label: "About Course" },
  { id: "related", label: "Related Courses" },
  { id: "reviews", label: "Reviews & Rating" },
  { id: "prerequisites", label: "Prerequisites & Requirements" },
  { id: "analysis", label: "Course Analysis" },
] as const;

export function averageReviewRating(reviews: readonly CourseIntroReview[]): number {
  if (!reviews.length) return 0;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

export function reviewStarBreakdown(
  reviews: readonly CourseIntroReview[],
): readonly { stars: number; count: number; pct: number }[] {
  const counts = [0, 0, 0, 0, 0];
  for (const r of reviews) {
    const i = Math.min(5, Math.max(1, Math.round(r.rating))) - 1;
    counts[i] = (counts[i] ?? 0) + 1;
  }
  const total = reviews.length || 1;
  return [5, 4, 3, 2, 1].map((stars) => {
    const count = counts[stars - 1] ?? 0;
    return { stars, count, pct: reviews.length ? Math.round((count / total) * 100) : 0 };
  });
}
