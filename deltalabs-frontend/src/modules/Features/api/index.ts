/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { apiClient } from "@/lib/apiClient";
import { ApiError } from "@/lib/apiClient.types";
/** ################################ /IMPORT ############################# */

/** ################################ TYPES ############################# */
type FeatureCapabilityDto = Readonly<{
  canView: boolean;
  canCreate: boolean;
  canJoin: boolean;
  canManage: boolean;
}>;

type FeatureDto = Readonly<{
  featureKey: string;
  title: string;
  description: string;
  enabled: boolean;
  beta: boolean;
  sortOrder: number;
  routePath: string | null;
  membershipState: string;
  roleKeys: readonly string[];
  capabilities: FeatureCapabilityDto;
}>;

export type FeaturesListResponseDto = Readonly<{
  items: readonly FeatureDto[];
}>;
/** ################################ /TYPES ############################# */

export type FeaturesLayoutDto = Readonly<{
  orderKeys: readonly string[];
  hiddenKeys: readonly string[];
  labels: Readonly<Record<string, string>>;
  updatedAt: string;
}>;

export type FeaturesLayoutUpsertDto = Readonly<{
  order_keys: readonly string[];
  hidden_keys: readonly string[];
  labels: Readonly<Record<string, string>>;
}>;

/** ################################ COMPONENT ############################# */
/** Features API wrappers (global and org-scoped). */
export async function fetchFeaturesList(): Promise<FeaturesListResponseDto> {
  return apiClient.get<FeaturesListResponseDto>("/v1/features");
}

export async function fetchFeaturesLayout(): Promise<FeaturesLayoutDto> {
  return apiClient.get<FeaturesLayoutDto>("/v1/features/layout");
}

export async function upsertFeaturesLayout(
  payload: FeaturesLayoutUpsertDto,
): Promise<FeaturesLayoutDto> {
  try {
    return await apiClient.post<FeaturesLayoutDto>("/v1/features/layout", { json: payload });
  } catch (error) {
    if (error instanceof ApiError && error.status === 405) {
      return apiClient.put<FeaturesLayoutDto>("/v1/features/layout", { json: payload });
    }
    throw error;
  }
}

export async function fetchFeatureByKey(featureKey: string): Promise<FeatureDto> {
  return apiClient.get<FeatureDto>(`/v1/features/${featureKey}`);
}

export async function fetchOrgFeaturesList(orgId: string): Promise<FeaturesListResponseDto> {
  return apiClient.get<FeaturesListResponseDto>(`/v1/orgs/${orgId}/features`);
}

export async function fetchOrgFeatureByKey(orgId: string, featureKey: string): Promise<FeatureDto> {
  return apiClient.get<FeatureDto>(`/v1/orgs/${orgId}/features/${featureKey}`);
}
/** ################################ /COMPONENT ############################# */
