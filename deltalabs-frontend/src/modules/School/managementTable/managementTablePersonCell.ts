import type { ManagementTableColumnDto, SchoolMemberSearchPicker } from "@/modules/School/api";

export type ManagementTablePersonCellValue = Readonly<{
  userId?: string;
  fullName?: string | null;
  username?: string | null;
  email?: string | null;
}>;

/** Monday-style multi-person cell: `{ people: [...] }` (also accepts legacy single object / array). */
export type ManagementTablePeopleCellValue = Readonly<{
  people: readonly ManagementTablePersonCellValue[];
}>;

export function columnUsesPersonPicker(column: ManagementTableColumnDto): boolean {
  const editor = column.settings?.cellEditor;
  if (editor === "person") return true;
  const title = column.title.trim().toLowerCase();
  return (
    title === "student" ||
    title === "parent" ||
    title === "teacher" ||
    title === "assign teacher" ||
    title === "assignee"
  );
}

export function columnUsesMultiPersonPicker(column: ManagementTableColumnDto): boolean {
  if (!columnUsesPersonPicker(column)) return false;
  if (column.settings?.multiPerson === true) return true;
  return column.title.trim().toLowerCase() === "assignee";
}

export function resolvePersonPickerForColumn(
  column: ManagementTableColumnDto,
  tableDefault: SchoolMemberSearchPicker,
): SchoolMemberSearchPicker {
  const title = column.title.trim().toLowerCase();
  if (title === "parent") {
    return tableDefault === "platform" ? "platform" : "school_parents";
  }
  if (title === "student") {
    if (tableDefault === "platform") return "platform";
    if (tableDefault === "school_parents" || tableDefault === "class_students") return "class_students";
    return "school_students";
  }
  if (title === "teacher" || title === "assign teacher") {
    if (tableDefault === "platform") return "platform";
    return "school_teachers";
  }
  if (title === "assignee") {
    return tableDefault === "platform" ? "platform" : "platform";
  }
  return tableDefault;
}

function normalizePerson(obj: Record<string, unknown>): ManagementTablePersonCellValue {
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

export function parsePersonCellValue(raw: unknown): ManagementTablePersonCellValue {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.people) && obj.people[0] && typeof obj.people[0] === "object") {
      return normalizePerson(obj.people[0] as Record<string, unknown>);
    }
    return normalizePerson(obj);
  }
  if (Array.isArray(raw) && raw[0] && typeof raw[0] === "object") {
    return normalizePerson(raw[0] as Record<string, unknown>);
  }
  if (typeof raw === "string" && raw.trim()) {
    return { userId: "", fullName: raw.trim() };
  }
  return { userId: "" };
}

export function parsePersonCellPeople(raw: unknown): ManagementTablePersonCellValue[] {
  if (raw == null || raw === "") return [];
  if (Array.isArray(raw)) {
    return raw
      .filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === "object")
      .map((x) => normalizePerson(x))
      .filter((p) => Boolean(p.userId?.trim() || p.fullName?.trim()));
  }
  if (typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.people)) {
      return obj.people
        .filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === "object")
        .map((x) => normalizePerson(x))
        .filter((p) => Boolean(p.userId?.trim() || p.fullName?.trim()));
    }
    const single = normalizePerson(obj);
    return single.userId?.trim() || single.fullName?.trim() ? [single] : [];
  }
  if (typeof raw === "string" && raw.trim()) {
    return [{ userId: "", fullName: raw.trim() }];
  }
  return [];
}

export function formatPersonCellLabel(raw: unknown): string {
  const people = parsePersonCellPeople(raw);
  if (people.length === 0) return "";
  const first =
    people[0]!.fullName?.trim() || people[0]!.username?.trim() || people[0]!.email?.trim() || "";
  if (people.length === 1) return first;
  return `${first} +${people.length - 1}`;
}

export function personCellValueToJson(person: ManagementTablePersonCellValue): Record<string, unknown> {
  return {
    ...(person.userId ? { userId: person.userId } : {}),
    ...(person.fullName ? { fullName: person.fullName } : {}),
    ...(person.username ? { username: person.username } : {}),
    ...(person.email ? { email: person.email } : {}),
  };
}

export function peopleCellValueToJson(
  people: readonly ManagementTablePersonCellValue[],
): Record<string, unknown> {
  return {
    people: people.map((p) => personCellValueToJson(p)).filter((p) => Object.keys(p).length > 0),
  };
}

export function personUserIdsFromCell(raw: unknown): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const p of parsePersonCellPeople(raw)) {
    const id = p.userId?.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}
