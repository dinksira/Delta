/**
 * api
 *
 * Competition management table API layer — calls dedicated /competitions/management-table/* endpoints.
 * No school dependency; scoped per-user via auth token.
 *
 * @example
 * ```ts
 * const bundle = await bootstrapCompetitionManagementTable("delta-labs");
 * const rows = await fetchCompetitionManagementTableRows(instanceId, "mtg_main", 1, 50);
 * ```
 */

import { apiClient } from "@/lib/apiClient";
import type {
  CompetitionManagementTableDefinitionDto,
  CompetitionManagementTableGroupDto,
  CompetitionManagementTableInstanceBundleDto,
  CompetitionManagementTableRowDto,
  CompetitionManagementTableRowListResponseDto,
} from "./types";

// ===== BOOTSTRAP =====

export async function bootstrapCompetitionManagementTable(
  orgId: string,
): Promise<CompetitionManagementTableInstanceBundleDto> {
  return apiClient.post<CompetitionManagementTableInstanceBundleDto>(
    "/v1/competitions/management-table/bootstrap",
    { searchParams: { org_id: orgId } },
  );
}

// ===== INSTANCE BUNDLE =====

export async function getCompetitionManagementTableInstance(
  instanceId: string,
  orgId = "delta-labs",
): Promise<CompetitionManagementTableInstanceBundleDto> {
  return apiClient.get<CompetitionManagementTableInstanceBundleDto>(
    "/v1/competitions/management-table/instance",
    { searchParams: { instance_id: instanceId, org_id: orgId } },
  );
}

// ===== ROWS =====

export async function fetchCompetitionManagementTableRows(
  instanceId: string,
  groupId: string | null,
  page: number,
  pageSize: number,
  orgId = "delta-labs",
): Promise<CompetitionManagementTableRowListResponseDto> {
  const params: Record<string, string> = {
    instance_id: instanceId,
    page: String(page),
    page_size: String(pageSize),
    org_id: orgId,
  };
  if (groupId) params.group_id = groupId;
  return apiClient.get<CompetitionManagementTableRowListResponseDto>(
    "/v1/competitions/management-table/rows",
    { searchParams: params },
  );
}

export async function createCompetitionManagementTableRow(
  instanceId: string,
  groupId: string | null,
  orgId = "delta-labs",
): Promise<CompetitionManagementTableRowDto> {
  const params: Record<string, string> = { instance_id: instanceId, org_id: orgId };
  if (groupId) params.group_id = groupId;
  return apiClient.post<CompetitionManagementTableRowDto>(
    "/v1/competitions/management-table/rows",
    { searchParams: params },
  );
}

export async function patchCompetitionManagementTableRow(
  instanceId: string,
  rowId: string,
  cells: Readonly<Record<string, unknown>>,
  orgId = "delta-labs",
): Promise<CompetitionManagementTableRowDto> {
  return apiClient.patch<CompetitionManagementTableRowDto>(
    `/v1/competitions/management-table/rows/${rowId}`,
    { json: { cells }, searchParams: { instance_id: instanceId, org_id: orgId } },
  );
}

export async function deleteCompetitionManagementTableRow(
  instanceId: string,
  rowId: string,
  orgId = "delta-labs",
): Promise<void> {
  await apiClient.delete(
    `/v1/competitions/management-table/rows/${rowId}`,
    { searchParams: { instance_id: instanceId, org_id: orgId } },
  );
}

export async function moveCompetitionManagementTableRow(
  instanceId: string,
  rowId: string,
  payload: Readonly<{ direction: "up" | "down" }>,
  orgId = "delta-labs",
): Promise<CompetitionManagementTableRowDto> {
  return apiClient.post<CompetitionManagementTableRowDto>(
    `/v1/competitions/management-table/rows/${rowId}/move`,
    { json: payload, searchParams: { instance_id: instanceId, org_id: orgId } },
  );
}

// ===== COLUMNS =====

export async function appendCompetitionManagementTableColumn(
  definitionId: string,
  payload: Readonly<{ title: string; type?: string; settings?: Record<string, unknown> }>,
  orgId = "delta-labs",
): Promise<CompetitionManagementTableDefinitionDto> {
  return apiClient.post<CompetitionManagementTableDefinitionDto>(
    "/v1/competitions/management-table/columns",
    { json: payload, searchParams: { definition_id: definitionId, org_id: orgId } },
  );
}

export async function patchCompetitionManagementTableColumn(
  definitionId: string,
  columnId: string,
  payload: Readonly<{ title: string }>,
  orgId = "delta-labs",
): Promise<CompetitionManagementTableDefinitionDto> {
  return apiClient.patch<CompetitionManagementTableDefinitionDto>(
    `/v1/competitions/management-table/columns/${columnId}`,
    { json: payload, searchParams: { definition_id: definitionId, org_id: orgId } },
  );
}

export async function deleteCompetitionManagementTableColumn(
  definitionId: string,
  columnId: string,
  orgId = "delta-labs",
): Promise<CompetitionManagementTableDefinitionDto> {
  return apiClient.delete<CompetitionManagementTableDefinitionDto>(
    `/v1/competitions/management-table/columns/${columnId}`,
    { searchParams: { definition_id: definitionId, org_id: orgId } },
  );
}

// ===== TABLE GROUPS =====

export async function createCompetitionManagementTableGroup(
  instanceId: string,
  title: string,
  orgId = "delta-labs",
): Promise<CompetitionManagementTableGroupDto> {
  return apiClient.post<CompetitionManagementTableGroupDto>(
    "/v1/competitions/management-table/groups",
    { json: { title }, searchParams: { instance_id: instanceId, org_id: orgId } },
  );
}
