export function readSchedulesTableInstanceId(metadata: Record<string, unknown> | null | undefined): string | null {
  const raw = metadata?.schedulesTableInstanceId ?? metadata?.schedules_table_instance_id;
  return typeof raw === "string" && raw.trim().length > 0 ? raw.trim() : null;
}

export function readSchedulesTableDefinitionId(metadata: Record<string, unknown> | null | undefined): string | null {
  const raw = metadata?.schedulesTableDefinitionId ?? metadata?.schedules_table_definition_id;
  return typeof raw === "string" && raw.trim().length > 0 ? raw.trim() : null;
}
