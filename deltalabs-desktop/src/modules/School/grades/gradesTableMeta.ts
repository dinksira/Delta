export function readGradesTableInstanceId(metadata: Record<string, unknown> | null | undefined): string | null {
  const raw = metadata?.gradesTableInstanceId ?? metadata?.grades_table_instance_id;
  return typeof raw === "string" && raw.trim().length > 0 ? raw.trim() : null;
}

export function readGradesTableDefinitionId(metadata: Record<string, unknown> | null | undefined): string | null {
  const raw = metadata?.gradesTableDefinitionId ?? metadata?.grades_table_definition_id;
  return typeof raw === "string" && raw.trim().length > 0 ? raw.trim() : null;
}
