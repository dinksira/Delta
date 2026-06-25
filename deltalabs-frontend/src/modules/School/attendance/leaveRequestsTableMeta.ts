export function readLeaveRequestsTableInstanceId(metadata: Record<string, unknown> | null | undefined): string | null {
  const raw = metadata?.leaveRequestsTableInstanceId;
  return typeof raw === "string" && raw.trim().length > 0 ? raw.trim() : null;
}

export function readLeaveRequestsTableDefinitionId(metadata: Record<string, unknown> | null | undefined): string | null {
  const raw = metadata?.leaveRequestsTableDefinitionId;
  return typeof raw === "string" && raw.trim().length > 0 ? raw.trim() : null;
}
