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
  if (type === "dropdown" || type === "status") {
    return {
      options: [
        { id: "opt_a", label: type === "status" ? "Working on it" : "Option A" },
        { id: "opt_b", label: type === "status" ? "Done" : "Option B" },
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
