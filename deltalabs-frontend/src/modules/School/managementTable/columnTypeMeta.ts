/** Labels for management table column types (add-column picker). */
import type { LucideIcon } from "lucide-react";
import {
  AlignLeft,
  Calendar,
  CheckSquare,
  Clock,
  File,
  Hash,
  Home,
  Link2,
  Loader,
  Phone,
  RotateCw,
  SquareKanban,
  Tag,
  TextCursor,
  User,
  Wrench,
} from "lucide-react";

import type { ManagementTableColumnTypeDto } from "@/modules/School/api";

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

/** Class students table — same supported types as mobile (no coming-soon placeholders). */
export const CLASS_STUDENTS_TABLE_ADD_COLUMN_GROUPS: readonly ManagementTableAddColumnGroup[] = [
  {
    title: "Most used",
    options: [
      { id: "text", label: "Text", icon: TextCursor, supportedType: "text" },
      { id: "link", label: "Link", icon: Link2, supportedType: "link" },
      { id: "status", label: "Status", icon: Tag, supportedType: "status" },
    ],
  },
  {
    title: "More",
    options: [
      { id: "date", label: "Date", icon: Calendar, supportedType: "date" },
      { id: "number", label: "Number", icon: Hash, supportedType: "number" },
      { id: "dropdown", label: "Dropdown", icon: Tag, supportedType: "dropdown" },
      { id: "checkbox", label: "Checkbox", icon: CheckSquare, supportedType: "checkbox" },
      { id: "textarea", label: "Long text", icon: AlignLeft, supportedType: "textarea" },
      { id: "phone", label: "Phone", icon: Phone, supportedType: "phone" },
    ],
  },
];

export const CLASS_PARENTS_TABLE_ADD_COLUMN_GROUPS = CLASS_STUDENTS_TABLE_ADD_COLUMN_GROUPS;

export const CLASS_LEAVE_REQUESTS_TABLE_ADD_COLUMN_GROUPS: readonly ManagementTableAddColumnGroup[] = [
  {
    title: "Most used",
    options: [
      { id: "text", label: "Text", icon: TextCursor, supportedType: "text" },
      { id: "date", label: "Date", icon: Calendar, supportedType: "date" },
      { id: "textarea", label: "Long text", icon: AlignLeft, supportedType: "textarea" },
      { id: "link", label: "Link / document", icon: Link2, supportedType: "link" },
      { id: "status", label: "Status", icon: Tag, supportedType: "status" },
    ],
  },
  {
    title: "More",
    options: [
      { id: "number", label: "Number", icon: Hash, supportedType: "number" },
      { id: "dropdown", label: "Dropdown", icon: Tag, supportedType: "dropdown" },
      { id: "checkbox", label: "Checkbox", icon: CheckSquare, supportedType: "checkbox" },
      { id: "phone", label: "Phone", icon: Phone, supportedType: "phone" },
    ],
  },
];

export const CLASS_TEACHERS_TABLE_ADD_COLUMN_GROUPS: readonly ManagementTableAddColumnGroup[] = [
  {
    title: "Most used",
    options: [
      { id: "text", label: "Text", icon: TextCursor, supportedType: "text" },
      { id: "link", label: "Link", icon: Link2, supportedType: "link" },
      { id: "status", label: "Status", icon: Tag, supportedType: "status" },
    ],
  },
  {
    title: "More",
    options: [
      { id: "date", label: "Date", icon: Calendar, supportedType: "date" },
      { id: "number", label: "Number", icon: Hash, supportedType: "number" },
      { id: "dropdown", label: "Dropdown", icon: Tag, supportedType: "dropdown" },
      { id: "checkbox", label: "Checkbox", icon: CheckSquare, supportedType: "checkbox" },
      { id: "textarea", label: "Long text", icon: AlignLeft, supportedType: "textarea" },
      { id: "phone", label: "Phone", icon: Phone, supportedType: "phone" },
    ],
  },
];

export const CLASS_GRADES_TABLE_ADD_COLUMN_GROUPS: readonly ManagementTableAddColumnGroup[] = [
  {
    title: "Assessments",
    options: [
      { id: "number", label: "Number", icon: Hash, supportedType: "number" },
      { id: "text", label: "Text", icon: TextCursor, supportedType: "text" },
      { id: "status", label: "Status", icon: Tag, supportedType: "status" },
    ],
  },
  {
    title: "More",
    options: [
      { id: "date", label: "Date", icon: Calendar, supportedType: "date" },
      { id: "dropdown", label: "Dropdown", icon: Tag, supportedType: "dropdown" },
      { id: "checkbox", label: "Checkbox", icon: CheckSquare, supportedType: "checkbox" },
      { id: "textarea", label: "Long text", icon: AlignLeft, supportedType: "textarea" },
      { id: "link", label: "Link", icon: Link2, supportedType: "link" },
      { id: "phone", label: "Phone", icon: Phone, supportedType: "phone" },
    ],
  },
];

const SCHEDULE_STATUS_OPTIONS = [
  { id: "scheduled", label: "Scheduled" },
  { id: "live", label: "Live" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

export const CLASS_SCHEDULES_TABLE_ADD_COLUMN_GROUPS: readonly ManagementTableAddColumnGroup[] = [
  {
    title: "Most used",
    options: [
      { id: "session", label: "Session", icon: RotateCw, supportedType: "text", columnTitle: "Session", columnSettings: { cellEditor: "class_session" } },
      { id: "date", label: "Date", icon: Calendar, supportedType: "date", columnTitle: "Date" },
      { id: "text", label: "Text", icon: TextCursor, supportedType: "text", columnTitle: "Text" },
      {
        id: "duration",
        label: "Duration",
        icon: Clock,
        supportedType: "number",
        columnTitle: "Duration",
        columnSettings: { unit: "minutes" },
      },
    ],
  },
  {
    title: "More",
    options: [
      {
        id: "status",
        label: "Status",
        icon: Tag,
        supportedType: "status",
        columnTitle: "Status",
        columnSettings: { options: SCHEDULE_STATUS_OPTIONS },
      },
      {
        id: "time",
        label: "Time",
        icon: Clock,
        supportedType: "text",
        columnTitle: "Time",
        columnSettings: { cellEditor: "time" },
      },
      {
        id: "assign_teacher",
        label: "Assign Teacher",
        icon: User,
        supportedType: "text",
        columnTitle: "Assign Teacher",
        columnSettings: { cellEditor: "person" },
      },
      { id: "class_room", label: "Class Room", icon: Home, supportedType: "text", columnTitle: "Class Room" },
    ],
  },
];

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
