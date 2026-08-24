export function readParentsTableInstanceId(metadata: Record<string, unknown> | null | undefined): string | null {
  const raw = metadata?.parentsTableInstanceId;
  return typeof raw === "string" && raw.trim().length > 0 ? raw.trim() : null;
}

export function readParentsTableDefinitionId(metadata: Record<string, unknown> | null | undefined): string | null {
  const raw = metadata?.parentsTableDefinitionId;
  return typeof raw === "string" && raw.trim().length > 0 ? raw.trim() : null;
}
