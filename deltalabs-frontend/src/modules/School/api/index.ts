/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { apiClient } from "@/lib/apiClient";
/** ################################ /IMPORT ############################# */

/** ################################ TYPES ############################# */
export type OrgDto = Readonly<{
  id: string;
  name: string;
  slug: string;
}>;

export type MyOrgsResponseDto = Readonly<{
  items: readonly OrgDto[];
}>;

export type MediaUploadIntentRequestDto = Readonly<{
  filename: string;
  content_type: string;
  file_size_bytes: number;
  caption?: string;
  hashtags?: readonly string[];
  visibility?: "public" | "org" | "private";
  publish_to_feed?: boolean;
}>;

export type MediaUploadIntentResponseDto = Readonly<{
  mediaId: string;
  objectKey: string;
  uploadUrl: string;
  expiresInSeconds: number;
  provider: string;
  bucket: string;
}>;
/** ################################ /TYPES ############################# */

/** ################################ COMPONENT ############################# */
/** Org + school + media integration API wrappers. */
export async function createOrg(payload: Readonly<{ name: string; slug: string }>) {
  return apiClient.post<{ org: OrgDto }>("/v1/orgs", { json: payload });
}

export async function fetchMyOrgs(): Promise<MyOrgsResponseDto> {
  return apiClient.get<MyOrgsResponseDto>("/v1/orgs/me");
}

export async function joinOrg(orgId: string) {
  return apiClient.post<{ status: string; org_id: string }>(`/v1/orgs/${orgId}/join`);
}

export async function fetchOrgSchools(orgId: string) {
  return apiClient.get(`/v1/orgs/${orgId}/schools`);
}

export async function fetchOrgLabs(orgId: string) {
  return apiClient.get(`/v1/orgs/${orgId}/labs`);
}

export async function fetchSchoolModuleStatus() {
  return apiClient.get("/v1/schools");
}

export async function createOrgMediaUploadIntent(
  orgId: string,
  payload: MediaUploadIntentRequestDto,
): Promise<MediaUploadIntentResponseDto> {
  return apiClient.post<MediaUploadIntentResponseDto>(`/v1/orgs/${orgId}/media/upload-intent`, {
    json: payload,
  });
}

export async function fetchOrgMedia(orgId: string, mediaId: string) {
  return apiClient.get(`/v1/orgs/${orgId}/media/${mediaId}`);
}
/** ################################ /COMPONENT ############################# */
