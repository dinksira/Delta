export function readAssignmentsTableInstanceId(metadata: Record<string, unknown> | null | undefined): string | null {
  const raw = metadata?.assignmentsTableInstanceId ?? metadata?.assignments_table_instance_id;
  return typeof raw === "string" && raw.trim().length > 0 ? raw.trim() : null;
}

export function readAssignmentsTableDefinitionId(metadata: Record<string, unknown> | null | undefined): string | null {
  const raw = metadata?.assignmentsTableDefinitionId ?? metadata?.assignments_table_definition_id;
  return typeof raw === "string" && raw.trim().length > 0 ? raw.trim() : null;
}
