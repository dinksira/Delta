import type { ManagementTableColumnDto } from "@/modules/School/api";

export type ManagementTablePersonCellValue = Readonly<{
  userId?: string;
  fullName?: string | null;
  username?: string | null;
  email?: string | null;
}>;

export function columnUsesPersonPicker(column: ManagementTableColumnDto): boolean {
  const editor = column.settings?.cellEditor;
  if (editor === "person") return true;
  return column.title.trim().toLowerCase() === "student";
}

export function parsePersonCellValue(raw: unknown): ManagementTablePersonCellValue {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;
    return {
      userId: typeof obj.userId === "string" ? obj.userId : typeof obj.user_id === "string" ? obj.user_id : "",
      fullName:
        typeof obj.fullName === "string"
          ? obj.fullName
          : typeof obj.full_name === "string"
            ? obj.full_name
            : null,
      username: typeof obj.username === "string" ? obj.username : null,
      email: typeof obj.email === "string" ? obj.email : null,
    };
  }
  if (typeof raw === "string" && raw.trim()) {
    return { userId: "", fullName: raw.trim() };
  }
  return { userId: "" };
}

export function formatPersonCellLabel(raw: unknown): string {
  const person = parsePersonCellValue(raw);
  return person.fullName?.trim() || person.username?.trim() || person.email?.trim() || "";
}

export function personCellValueToJson(person: ManagementTablePersonCellValue): Record<string, unknown> {
  return {
    ...(person.userId ? { userId: person.userId } : {}),
    ...(person.fullName ? { fullName: person.fullName } : {}),
    ...(person.username ? { username: person.username } : {}),
    ...(person.email ? { email: person.email } : {}),
  };
}
