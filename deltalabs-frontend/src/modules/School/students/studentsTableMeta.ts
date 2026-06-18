export function readStudentsTableInstanceId(metadata: Record<string, unknown> | null | undefined): string | null {
  const raw = metadata?.studentsTableInstanceId;
  return typeof raw === "string" && raw.trim().length > 0 ? raw.trim() : null;
}

export function readStudentsTableDefinitionId(metadata: Record<string, unknown> | null | undefined): string | null {
  const raw = metadata?.studentsTableDefinitionId;
  return typeof raw === "string" && raw.trim().length > 0 ? raw.trim() : null;
}
