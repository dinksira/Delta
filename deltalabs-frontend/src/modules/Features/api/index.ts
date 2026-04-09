/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { apiClient } from "@/lib/apiClient";
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

/** ################################ COMPONENT ############################# */
/** Features API wrappers (global and org-scoped). */
export async function fetchFeaturesList(): Promise<FeaturesListResponseDto> {
  return apiClient.get<FeaturesListResponseDto>("/v1/features");
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
