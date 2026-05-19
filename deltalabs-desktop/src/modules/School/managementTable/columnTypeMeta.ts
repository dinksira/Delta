/** Labels for management table column types (add-column picker). */
import type { LucideIcon } from "lucide-react";
import {
  Calendar,
  CheckSquare,
  File,
  Hash,
  Link2,
  Loader,
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

export const MANAGEMENT_TABLE_ADD_COLUMN_GROUPS: readonly Readonly<{
  title: string;
  options: readonly ManagementTableAddColumnOption[];
}>[] = [
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
      { id: "date", label: "date", icon: Calendar, supportedType: "date" },
      { id: "number", label: "Number", icon: Hash, supportedType: "number" },
      { id: "progress", label: "Progress", icon: Loader },
      { id: "dropdown", label: "Drop Downs", icon: Tag, supportedType: "dropdown" },
      { id: "checkbox", label: "Check Box", icon: CheckSquare, supportedType: "checkbox" },
      { id: "file", label: "File", icon: File },
      { id: "service", label: "Service", icon: Wrench },
    ],
  },
];

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
