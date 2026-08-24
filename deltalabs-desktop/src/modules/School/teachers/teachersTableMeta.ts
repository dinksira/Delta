export function readTeachersTableInstanceId(metadata: Record<string, unknown> | null | undefined): string | null {
  const raw = metadata?.teachersTableInstanceId;
  return typeof raw === "string" && raw.trim().length > 0 ? raw.trim() : null;
}

export function readTeachersTableDefinitionId(metadata: Record<string, unknown> | null | undefined): string | null {
  const raw = metadata?.teachersTableDefinitionId;
  return typeof raw === "string" && raw.trim().length > 0 ? raw.trim() : null;
}
