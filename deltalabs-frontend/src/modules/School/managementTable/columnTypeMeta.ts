/** Labels for management table column types (add-column picker). */
import type { LucideIcon } from "lucide-react";
import {
  AlignLeft,
  Calendar,
  CheckSquare,
  File,
  Hash,
  Link2,
  Loader,
  Phone,
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
