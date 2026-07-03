import type { LucideIcon } from "lucide-react";
import {
  Atom,
  Award,
  Bus,
  Calendar,
  ClipboardList,
  FlaskConical,
  Fingerprint,
  PanelsTopLeft,
  PencilRuler,
  Presentation,
  Route,
  Server,
  User,
  UserRound,
  Users,
} from "lucide-react";

/** All class workspace `?nav=` values (fixed bar + start-menu overflow). */
export type ClassNavId =
  | "class"
  | "students"
  | "parents"
  | "attendance"
  | "teacher"
  | "schedules"
  | "grade"
  | "assignment"
  | "assets"
  | "plans"
  | "labs"
  | "rnd"
  | "transport"
  | "roadmap"
  | "materials"
  | "courses"
  | "other";

export type ClassStartTile = Readonly<{
  key: string;
  label: string;
  navId: ClassNavId;
}>;

export type StoredLastNavSlot = Readonly<{
  key: string;
  label: string;
  navId: ClassNavId;
}>;

/** First seven tabs after Start — always visible. */
export const CLASS_FIXED_NAV_IDS = [
  "class",
  "students",
  "parents",
  "attendance",
  "teacher",
  "schedules",
  "grade",
] as const satisfies readonly ClassNavId[];

export type ClassFixedNavId = (typeof CLASS_FIXED_NAV_IDS)[number];

export const DEFAULT_LAST_NAV_SLOT: StoredLastNavSlot = {
  key: "assignment",
  label: "Assignment",
  navId: "assignment",
};

/** 2×6 Start menu grid (top → bottom, left → right). */
export const CLASS_START_TILES: readonly ClassStartTile[] = [
  { key: "assets", label: "Assets", navId: "assets" },
  { key: "plans", label: "Plans", navId: "plans" },
  { key: "labs", label: "Labs", navId: "labs" },
  { key: "rnd", label: "R & D", navId: "rnd" },
  { key: "transport", label: "Transport", navId: "transport" },
  { key: "roadmap", label: "Roadmap", navId: "roadmap" },
  { key: "materials", label: "Materials", navId: "materials" },
  { key: "assignment", label: "Assignment", navId: "assignment" },
] as const;

export function bottomBarNavIds(lastSlot: StoredLastNavSlot): ReadonlySet<ClassNavId> {
  return new Set<ClassNavId>([...CLASS_FIXED_NAV_IDS, lastSlot.navId]);
}

export function startMenuTiles(lastSlot: StoredLastNavSlot): readonly ClassStartTile[] {
  const onBar = bottomBarNavIds(lastSlot);
  return CLASS_START_TILES.filter((tile) => !onBar.has(tile.navId));
}

export const CLASS_START_TILE_ICONS: Record<string, LucideIcon> = {
  assets: Server,
  plans: PanelsTopLeft,
  labs: FlaskConical,
  rnd: Atom,
  schedules: Calendar,
  transport: Bus,
  student: User,
  grade: Award,
  roadmap: Route,
  materials: PencilRuler,
  assignment: ClipboardList,
};

export const CLASS_FIXED_NAV_ICONS: Record<ClassFixedNavId, LucideIcon> = {
  class: Presentation,
  students: User,
  parents: Users,
  attendance: Fingerprint,
  teacher: UserRound,
  schedules: Calendar,
  grade: Award,
};

export const CLASS_FIXED_NAV_LABELS: Record<ClassFixedNavId, string> = {
  class: "Class",
  students: "Student",
  parents: "Parent",
  attendance: "Attendance",
  teacher: "Teacher",
  schedules: "Schedules",
  grade: "Grade",
};

export function iconForNavSlot(slot: StoredLastNavSlot): LucideIcon {
  return CLASS_START_TILE_ICONS[slot.key] ?? CLASS_START_TILE_ICONS.assignment ?? ClipboardList;
}

export function classLastNavStorageKey(classItemId: string): string {
  return `deltalabs:class:last-nav:${classItemId.trim()}`;
}

export function readStoredLastNavSlot(classItemId: string): StoredLastNavSlot | null {
  if (typeof window === "undefined" || !classItemId.trim()) return null;
  try {
    const raw = window.localStorage.getItem(classLastNavStorageKey(classItemId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredLastNavSlot>;
    if (
      typeof parsed.key === "string" &&
      typeof parsed.label === "string" &&
      typeof parsed.navId === "string" &&
      parsed.key.trim() &&
      parsed.label.trim() &&
      parsed.navId.trim()
    ) {
      return {
        key: parsed.key.trim(),
        label: parsed.label.trim(),
        navId: parsed.navId.trim() as ClassNavId,
      };
    }
  } catch {
    return null;
  }
  return null;
}

export function writeStoredLastNavSlot(classItemId: string, slot: StoredLastNavSlot): void {
  if (typeof window === "undefined" || !classItemId.trim()) return;
  try {
    window.localStorage.setItem(classLastNavStorageKey(classItemId), JSON.stringify(slot));
  } catch {
    // ignore quota / private mode
  }
}

export function parseClassNavId(raw: string | null): ClassNavId {
  const allIds = new Set<string>([
    ...CLASS_FIXED_NAV_IDS,
    DEFAULT_LAST_NAV_SLOT.navId,
    ...CLASS_START_TILES.map((t) => t.navId),
  ]);
  if (raw && allIds.has(raw)) return raw as ClassNavId;
  return "class";
}

export function isBuiltClassNavSection(navId: ClassNavId): boolean {
  return (
    navId === "class" ||
    navId === "students" ||
    navId === "parents" ||
    navId === "attendance" ||
    navId === "teacher" ||
    navId === "schedules" ||
    navId === "grade" ||
    navId === "assignment"
  );
}
