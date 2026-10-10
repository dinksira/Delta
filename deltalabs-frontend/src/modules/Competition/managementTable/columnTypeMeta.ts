/**
 * columnTypeMeta.ts
 *
 * Labels for management table column types (add-column picker).
 *
 * @example
 * ```tsx
 * const groups = MANAGEMENT_TABLE_ADD_COLUMN_GROUPS;
 * ```
 */

import type { LucideIcon } from "lucide-react";
import {
  AlignLeft,
  BarChart3,
  Calendar,
  CalendarClock,
  CheckSquare,
  File,
  Hash,
  Link2,
  Loader,
  Phone,
  SquareKanban,
  Tag,
  TextCursor,
  Ticket,
  Trophy,
  User,
  Users,
  Wrench,
} from "lucide-react";

// ===== TYPES =====

export type ManagementTableColumnTypeDto = "text" | "textarea" | "number" | "date" | "checkbox" | "dropdown" | "status" | "link" | "phone";

export type ManagementTableAddColumnOption = Readonly<{
  id: string;
  label: string;
  icon: LucideIcon;
  /** When omitted, the option is UI-only (coming soon). */
  supportedType?: ManagementTableColumnTypeDto;
  /** Override default column title when appending (schedule presets). */
  columnTitle?: string;
  columnSettings?: Record<string, unknown>;
}>;

export type ManagementTableAddColumnGroup = Readonly<{
  title: string;
  options: readonly ManagementTableAddColumnOption[];
}>;

// ===== CONSTANTS =====

/** Full management-table editor — includes coming-soon types for future columns. */
export const MANAGEMENT_TABLE_ADD_COLUMN_GROUPS: readonly ManagementTableAddColumnGroup[] = [
  {
    title: "Most used",
    options: [
      { id: "resource", label: "Resource", icon: SquareKanban },
      { id: "text", label: "Text", icon: TextCursor, supportedType: "text" },
      { id: "person", label: "Person", icon: User },
      { id: "link", label: "Link", icon: Link2, supportedType: "link" },
      { id: "status", label: "Status", icon: Tag, supportedType: "status" },
    ],
  },
  {
    title: "More",
    options: [
      { id: "date", label: "Date", icon: Calendar, supportedType: "date" },
      { id: "number", label: "Number", icon: Hash, supportedType: "number" },
      { id: "progress", label: "Progress", icon: Loader },
      { id: "dropdown", label: "Dropdown", icon: Tag, supportedType: "dropdown" },
      { id: "checkbox", label: "Checkbox", icon: CheckSquare, supportedType: "checkbox" },
      { id: "textarea", label: "Long text", icon: AlignLeft, supportedType: "textarea" },
      { id: "phone", label: "Phone", icon: Phone, supportedType: "phone" },
      { id: "file", label: "File", icon: File },
      { id: "service", label: "Service", icon: Wrench },
    ],
  },
];

/**
 * Competition-specific add-column presets.
 *
 * Each option maps to one field of a hosted competition (topic battle) so the
 * owner composes a "My Competitions" table whose column titles match the data
 * that gets auto-filled when a row is linked to a hosted battle. Pick a preset
 * and the matching battle data fills that column automatically.
 */
export const COMPETITION_ADD_COLUMN_GROUPS: readonly ManagementTableAddColumnGroup[] = [
  {
    title: "Identity",
    options: [
      { id: "comp-title", label: "Title", icon: TextCursor, supportedType: "text", columnTitle: "Title" },
      { id: "comp-difficulty", label: "Difficulty", icon: BarChart3, supportedType: "dropdown", columnTitle: "Difficulty" },
      { id: "comp-status", label: "Status", icon: Tag, supportedType: "status", columnTitle: "Status" },
      { id: "comp-link", label: "Link", icon: Link2, supportedType: "link", columnTitle: "Link" },
    ],
  },
  {
    title: "Schedule",
    options: [
      { id: "comp-start-date", label: "Start Date", icon: Calendar, supportedType: "date", columnTitle: "Start Date" },
      { id: "comp-end-date", label: "End Date", icon: CalendarClock, supportedType: "date", columnTitle: "End Date" },
    ],
  },
  {
    title: "Rewards & Scale",
    options: [
      { id: "comp-prize-pool", label: "Prize Pool", icon: Trophy, supportedType: "text", columnTitle: "Prize Pool" },
      { id: "comp-entry-fee", label: "Entry Fee", icon: Ticket, supportedType: "text", columnTitle: "Entry Fee" },
      { id: "comp-players", label: "Players", icon: Users, supportedType: "number", columnTitle: "Players" },
    ],
  },
];

// ===== MONDAY-STYLE STATUS & GROUP PRESETS =====

export type ManagementTableStatusTone =
  | "default"
  | "info"
  | "live"
  | "warning"
  | "success"
  | "error"
  | "secondary";

export interface ManagementTableStatusOption {
  readonly id: string;
  readonly label: string;
  readonly tone: ManagementTableStatusTone;
}

export const DEFAULT_COMPETITION_STATUS_OPTIONS: readonly ManagementTableStatusOption[] = [
  { id: "opt_draft", label: "Draft", tone: "default" },
  { id: "opt_upcoming", label: "Upcoming", tone: "info" },
  { id: "opt_live", label: "Live Now", tone: "live" },
  { id: "opt_working", label: "Working on it", tone: "warning" },
  { id: "opt_done", label: "Done", tone: "success" },
  { id: "opt_stuck", label: "Stuck", tone: "error" },
];

export const STATUS_TONE_CLASSES: Record<
  ManagementTableStatusTone,
  { bg: string; text: string; ring?: string }
> = {
  default: { bg: "bg-surface-muted", text: "text-text-secondary" },
  info: { bg: "bg-info-500", text: "text-white" },
  live: { bg: "bg-primary-600", text: "text-white", ring: "ring-2 ring-primary-300 ring-offset-1" },
  warning: { bg: "bg-warning-500", text: "text-white" },
  success: { bg: "bg-success-500", text: "text-white" },
  error: { bg: "bg-error-500", text: "text-white" },
  secondary: { bg: "bg-secondary-600", text: "text-white" },
};

export const GROUP_COLOR_KEYS = [
  "primary",
  "success",
  "warning",
  "secondary",
  "info",
  "error",
] as const;

export type GroupColorKey = (typeof GROUP_COLOR_KEYS)[number];

export const GROUP_COLOR_CLASSES: Record<
  GroupColorKey,
  { border: string; text: string; bg: string; fill: string; label: string }
> = {
  primary: {
    border: "border-primary-500",
    text: "text-primary-600",
    bg: "bg-primary-50",
    fill: "bg-primary-500",
    label: "Teal",
  },
  success: {
    border: "border-success-500",
    text: "text-success-600",
    bg: "bg-success-50",
    fill: "bg-success-500",
    label: "Green",
  },
  warning: {
    border: "border-warning-500",
    text: "text-warning-600",
    bg: "bg-warning-50",
    fill: "bg-warning-500",
    label: "Amber",
  },
  secondary: {
    border: "border-secondary-500",
    text: "text-secondary-600",
    bg: "bg-secondary-50",
    fill: "bg-secondary-500",
    label: "Purple",
  },
  info: {
    border: "border-info-500",
    text: "text-info-600",
    bg: "bg-info-50",
    fill: "bg-info-500",
    label: "Blue",
  },
  error: {
    border: "border-error-500",
    text: "text-error-600",
    bg: "bg-error-50",
    fill: "bg-error-500",
    label: "Coral",
  },
};

export function resolveGroupColor(colorKey?: string): (typeof GROUP_COLOR_CLASSES)[GroupColorKey] {
  if (colorKey && colorKey in GROUP_COLOR_CLASSES) {
    return GROUP_COLOR_CLASSES[colorKey as GroupColorKey];
  }
  return GROUP_COLOR_CLASSES.primary;
}

// ===== HELPERS =====

export function filterAddColumnGroups(
  groups: readonly ManagementTableAddColumnGroup[],
  search: string,
): readonly ManagementTableAddColumnGroup[] {
  const q = search.trim().toLowerCase();
  return groups
    .map((g) => ({
      ...g,
      options: g.options.filter((o) => (q ? o.label.toLowerCase().includes(q) : true)),
    }))
    .filter((g) => g.options.length > 0);
}

export function defaultSettingsForColumnType(type: ManagementTableColumnTypeDto): Record<string, unknown> {
  if (type === "status") {
    return {
      options: DEFAULT_COMPETITION_STATUS_OPTIONS,
    };
  }
  if (type === "dropdown") {
    return {
      options: [
        { id: "opt_easy", label: "Beginner" },
        { id: "opt_med", label: "Intermediate" },
        { id: "opt_hard", label: "Advanced" },
      ],
    };
  }
  return {};
}

export function defaultTitleForColumnType(type: ManagementTableColumnTypeDto): string {
  if (type === "textarea") return "Long text";
  if (type === "checkbox") return "Checkbox";
  return `${type.charAt(0).toUpperCase()}${type.slice(1)}`;
}

