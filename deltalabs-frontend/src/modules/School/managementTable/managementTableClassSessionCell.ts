import type { ManagementTableColumnDto } from "@/modules/School/api";

export type ManagementTableClassSessionCellValue = Readonly<{
  sessionId?: string;
  title?: string | null;
}>;

export function columnUsesClassSessionPicker(column: ManagementTableColumnDto): boolean {
  const editor = column.settings?.cellEditor;
  if (editor === "class_session") return true;
  return column.title.trim().toLowerCase() === "session";
}

export function parseClassSessionCellValue(raw: unknown): ManagementTableClassSessionCellValue {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;
    return {
      sessionId:
        typeof obj.sessionId === "string"
          ? obj.sessionId
          : typeof obj.session_id === "string"
            ? obj.session_id
            : "",
      title: typeof obj.title === "string" ? obj.title : null,
    };
  }
  if (typeof raw === "string" && raw.trim()) {
    return { sessionId: "", title: raw.trim() };
  }
  return { sessionId: "" };
}

export function formatClassSessionCellLabel(raw: unknown): string {
  const session = parseClassSessionCellValue(raw);
  return session.title?.trim() || "";
}

export function classSessionCellValueToJson(
  session: ManagementTableClassSessionCellValue,
): Record<string, unknown> {
  return {
    ...(session.sessionId ? { sessionId: session.sessionId } : {}),
    ...(session.title ? { title: session.title } : {}),
  };
}
