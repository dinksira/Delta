import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Box,
  FileQuestion,
  Flag,
  GitBranch,
  HelpCircle,
  List,
  RefreshCw,
  Users,
} from "lucide-react";

export type CourseNavId =
  | "intro"
  | "qa"
  | "exercise"
  | "summary"
  | "score"
  | "supplement"
  | "resources"
  | "roadmap"
  | "communication";

export const COURSE_NAV_ITEMS: readonly {
  id: CourseNavId;
  label: string;
  icon: LucideIcon;
}[] = [
  { id: "intro", label: "Course Intro", icon: List },
  { id: "qa", label: "Q&A", icon: HelpCircle },
  { id: "exercise", label: "Exercise & Test", icon: FileQuestion },
  { id: "summary", label: "Fast Summary", icon: RefreshCw },
  { id: "score", label: "Score", icon: Flag },
  { id: "supplement", label: "Supplement", icon: BookOpen },
  { id: "resources", label: "Resources", icon: Box },
  { id: "roadmap", label: "Roadmap", icon: GitBranch },
  { id: "communication", label: "Communication", icon: Users },
] as const;

export type CourseStartTile = Readonly<{
  key: string;
  label: string;
  navId: CourseNavId;
}>;

/** Start menu quick jumps (same chrome as class Start). */
export const COURSE_START_TILES: readonly CourseStartTile[] = [
  { key: "intro", label: "Course Intro", navId: "intro" },
  { key: "qa", label: "Q&A", navId: "qa" },
  { key: "exercise", label: "Exercise & Test", navId: "exercise" },
  { key: "summary", label: "Fast Summary", navId: "summary" },
  { key: "score", label: "Score", navId: "score" },
  { key: "supplement", label: "Supplement", navId: "supplement" },
  { key: "resources", label: "Resources", navId: "resources" },
  { key: "roadmap", label: "Roadmap", navId: "roadmap" },
  { key: "communication", label: "Communication", navId: "communication" },
] as const;

export const COURSE_START_TILE_ICONS: Record<string, LucideIcon> = {
  intro: List,
  qa: HelpCircle,
  exercise: FileQuestion,
  summary: RefreshCw,
  score: Flag,
  supplement: BookOpen,
  resources: Box,
  roadmap: GitBranch,
  communication: Users,
};

export function parseCourseNavId(raw: string | null): CourseNavId {
  const allowed = new Set(COURSE_NAV_ITEMS.map((i) => i.id));
  if (raw && allowed.has(raw as CourseNavId)) return raw as CourseNavId;
  return "intro";
}

export function isBuiltCourseNavSection(navId: CourseNavId): boolean {
  return navId === "intro";
}

/** Safe decode of `returnTo` for course → school workspace navigation. */
export function safeCourseReturnHref(returnToRaw: string | null, schoolId: string): string {
  const fallback = `/features/school/${encodeURIComponent(schoolId)}`;
  if (!returnToRaw?.trim()) return fallback;
  try {
    const decoded = decodeURIComponent(returnToRaw.trim());
    if (!decoded.startsWith("/features/school/")) return fallback;
    const after = decoded.slice("/features/school/".length);
    const firstSeg = after.split(/[/?#]/)[0] ?? "";
    if (firstSeg !== schoolId) return fallback;
    return decoded;
  } catch {
    return fallback;
  }
}
