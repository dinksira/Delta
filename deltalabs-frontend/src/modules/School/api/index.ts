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

export type SchoolDto = Readonly<{
  id: string;
  orgId: string;
  name: string;
  slug: string;
  schoolType: string;
  onboardingStatus?: "active" | "pending_partner_acceptance";
  email?: string | null;
  logoUrl?: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}>;

export type SchoolListResponseDto = Readonly<{
  items: readonly SchoolDto[];
}>;

/** GET /v1/me/schools — school-scoped membership row. */
export type MySchoolMembershipItemDto = Readonly<{
  schoolId: string;
  orgId: string;
  name: string;
  slug: string;
  schoolType: string;
  archived: boolean;
  roleKeys: readonly string[];
}>;

export type MySchoolsResponseDto = Readonly<{
  items: readonly MySchoolMembershipItemDto[];
}>;

export type SchoolCreateInputDto = Readonly<{
  name: string;
  school_type: string;
  email?: string;
  logo_url?: string;
  custom_fields?: readonly {
    key: string;
    value: string;
  }[];
  partners?: readonly {
    full_name: string;
    email?: string;
    ownership_percentage: number;
    share_accesses?: readonly {
      access_name: string;
      status: string;
    }[];
  }[];
  documents?: readonly {
    title: string;
    url?: string;
  }[];
}>;

/** POST /v1/schools — optional tenant to attach the school to (requires school:manage on that org). */
export type SchoolCreateMeInputDto = SchoolCreateInputDto &
  Readonly<{
    target_org_id?: string;
  }>;

export type MarketplaceItemDto = Readonly<{
  id: string;
  orgId: string;
  schoolId: string;
  schoolName: string;
  schoolType?: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  ownerUserId: string;
  bidderUserId?: string | null;
  status: "active" | "under_offer" | "sold" | "withdrawn";
  createdAt: string;
}>;

export type MarketplaceListResponseDto = Readonly<{
  items: readonly MarketplaceItemDto[];
  total: number;
  page: number;
  pageSize: number;
}>;

export type MarketplaceQueryParamsDto = Readonly<{
  view: "community" | "bids" | "listings";
  q?: string;
  status?: "active" | "under_offer" | "sold" | "withdrawn";
  schoolType?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "created_at" | "price" | "title";
  sortDirection?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}>;

export type MarketplaceUpdateInputDto = Readonly<{
  title?: string;
  description?: string;
  price?: number;
  currency?: string;
}>;

export type OfferStatus = "requested" | "approved" | "amendment" | "rejected";
export type OfferView = "received" | "sent";

export type OfferDto = Readonly<{
  id: string;
  orgId: string;
  schoolId: string;
  schoolName: string;
  status: OfferStatus;
  requestedAt: string;
  updatedAt: string;
  recipientEmail?: string | null;
  senderUserId?: string | null;
  senderEmail?: string | null;
  negotiationTurn?: "sender" | "recipient";
  listingId?: string | null;
  shortlisted?: boolean;
  partyFullName?: string | null;
  partyEmail?: string | null;
  ownershipPercentage?: number | null;
  shareAccesses?: readonly {
    accessName: string;
    status: "can_view" | "can_edit" | "can_manage";
  }[];
  offeredPrice?: number | null;
  offeredCurrency?: string | null;
  note?: string | null;
  offerKind?: string | null;
  amendmentData?: {
    ownership_percentage?: number;
    share_accesses?: {
      access_name: string;
      status: "can_view" | "can_edit" | "can_manage";
    }[];
    offered_price?: number;
    offered_currency?: string;
    note?: string | null;
  } | null;
}>;

export type OfferListResponseDto = Readonly<{
  items: readonly OfferDto[];
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

export async function fetchMySchools(): Promise<MySchoolsResponseDto> {
  return apiClient.get<MySchoolsResponseDto>("/v1/me/schools");
}

export async function joinOrg(orgId: string) {
  return apiClient.post<{ status: string; org_id: string }>(`/v1/orgs/${orgId}/join`);
}

export async function fetchOrgSchools(orgId: string) {
  return apiClient.get<SchoolListResponseDto>(`/v1/orgs/${orgId}/schools`);
}

export async function fetchOrgArchivedSchools(orgId: string): Promise<SchoolListResponseDto> {
  return apiClient.get<SchoolListResponseDto>(`/v1/orgs/${orgId}/schools`, {
    searchParams: { archived: true },
  });
}

export async function createSchool(
  orgId: string,
  payload: SchoolCreateInputDto,
): Promise<SchoolDto> {
  return apiClient.post<SchoolDto>(`/v1/orgs/${orgId}/schools`, {
    json: payload,
  });
}

/** Me-centric create: may provision a workspace org server-side unless ``target_org_id`` is set. */
export async function createSchoolForMe(payload: SchoolCreateMeInputDto): Promise<SchoolDto> {
  return apiClient.post<SchoolDto>("/v1/schools", { json: payload });
}

export async function setSchoolArchived(
  orgId: string,
  schoolId: string,
  archived: boolean,
): Promise<{ archived: boolean }> {
  return apiClient.patch<{ archived: boolean }>(`/v1/orgs/${orgId}/schools/${schoolId}/archive`, {
    json: { archived },
  });
}

export async function fetchSchoolMarketplace(
  orgId: string,
  params: MarketplaceQueryParamsDto,
): Promise<MarketplaceListResponseDto> {
  return apiClient.get<MarketplaceListResponseDto>(`/v1/orgs/${orgId}/schools/marketplace`, {
    searchParams: params,
  });
}

export async function fetchSchoolMarketplaceItem(orgId: string, listingId: string): Promise<MarketplaceItemDto> {
  return apiClient.get<MarketplaceItemDto>(`/v1/orgs/${orgId}/schools/marketplace/${listingId}`);
}

export async function fetchGlobalSchoolMarketplace(params: MarketplaceQueryParamsDto): Promise<MarketplaceListResponseDto> {
  return apiClient.get<MarketplaceListResponseDto>("/v1/schools/marketplace", {
    searchParams: params,
  });
}

export async function fetchGlobalSchoolMarketplaceItem(listingId: string): Promise<MarketplaceItemDto> {
  return apiClient.get<MarketplaceItemDto>(`/v1/schools/marketplace/${listingId}`);
}

export async function createSchoolMarketplaceItem(
  orgId: string,
  payload: Readonly<{
    school_id: string;
    title: string;
    description: string;
    price: number;
    currency?: string;
  }>,
): Promise<MarketplaceItemDto> {
  return apiClient.post<MarketplaceItemDto>(`/v1/orgs/${orgId}/schools/marketplace`, { json: payload });
}

export async function updateSchoolMarketplaceItem(
  orgId: string,
  listingId: string,
  payload: MarketplaceUpdateInputDto,
): Promise<MarketplaceItemDto> {
  return apiClient.patch<MarketplaceItemDto>(`/v1/orgs/${orgId}/schools/marketplace/${listingId}`, { json: payload });
}

export async function updateGlobalSchoolMarketplaceItem(
  listingId: string,
  payload: MarketplaceUpdateInputDto,
): Promise<MarketplaceItemDto> {
  return apiClient.patch<MarketplaceItemDto>(`/v1/schools/marketplace/${listingId}`, { json: payload });
}

export async function withdrawSchoolMarketplaceItem(orgId: string, listingId: string): Promise<MarketplaceItemDto> {
  return apiClient.post<MarketplaceItemDto>(`/v1/orgs/${orgId}/schools/marketplace/${listingId}/withdraw`);
}

export async function withdrawGlobalSchoolMarketplaceItem(listingId: string): Promise<MarketplaceItemDto> {
  return apiClient.post<MarketplaceItemDto>(`/v1/schools/marketplace/${listingId}/withdraw`);
}

export async function deleteSchoolMarketplaceItem(orgId: string, listingId: string): Promise<{ status: string; listingId: string }> {
  return apiClient.delete<{ status: string; listingId: string }>(`/v1/orgs/${orgId}/schools/marketplace/${listingId}`);
}

export async function deleteGlobalSchoolMarketplaceItem(listingId: string): Promise<{ status: string; listingId: string }> {
  return apiClient.delete<{ status: string; listingId: string }>(`/v1/schools/marketplace/${listingId}`);
}

export async function buySchoolMarketplaceItem(
  orgId: string,
  listingId: string,
): Promise<OfferDto> {
  return apiClient.post<OfferDto>(`/v1/orgs/${orgId}/schools/marketplace/buy`, {
    json: { listing_id: listingId },
  });
}

export async function buyGlobalSchoolMarketplaceItem(listingId: string): Promise<OfferDto> {
  return apiClient.post<OfferDto>("/v1/schools/marketplace/buy", {
    json: { listing_id: listingId },
  });
}

export async function bidSchoolMarketplaceItem(
  orgId: string,
  payload: Readonly<{ listing_id: string; offered_price: number; offered_currency?: string; note?: string }>,
): Promise<OfferDto> {
  return apiClient.post<OfferDto>(`/v1/orgs/${orgId}/schools/marketplace/bid`, {
    json: payload,
  });
}

export async function bidGlobalSchoolMarketplaceItem(
  payload: Readonly<{ listing_id: string; offered_price: number; offered_currency?: string; note?: string }>,
): Promise<OfferDto> {
  return apiClient.post<OfferDto>("/v1/schools/marketplace/bid", {
    json: payload,
  });
}

export async function withdrawGlobalSchoolMarketplaceBid(offerId: string): Promise<OfferDto> {
  return apiClient.post<OfferDto>(`/v1/schools/marketplace/bids/${offerId}/withdraw`);
}

export async function fetchMarketplaceListingOffers(
  orgId: string,
  listingId: string,
): Promise<OfferListResponseDto> {
  return apiClient.get<OfferListResponseDto>(`/v1/orgs/${orgId}/schools/marketplace/${listingId}/offers`);
}

export async function fetchSchoolOffers(
  status: OfferStatus,
  view: OfferView,
  orgId?: string | null,
): Promise<OfferListResponseDto> {
  return apiClient.get<OfferListResponseDto>("/v1/schools/offers", {
    searchParams: { status, view, orgId: orgId ?? undefined },
  });
}

export async function createSchoolOffer(
  orgId: string,
  schoolId: string,
): Promise<OfferDto> {
  return apiClient.post<OfferDto>(`/v1/orgs/${orgId}/schools/offers`, {
    json: { school_id: schoolId },
  });
}

export async function updateSchoolOfferStatus(
  orgId: string,
  offerId: string,
  status: OfferStatus,
  amendmentData?: {
    ownership_percentage?: number;
    share_accesses?: { access_name: string; status: "can_view" | "can_edit" | "can_manage" }[];
    offered_price?: number;
    offered_currency?: string;
    note?: string | null;
  },
): Promise<OfferDto> {
  return apiClient.patch<OfferDto>(`/v1/orgs/${orgId}/schools/offers/${offerId}/status`, {
    json: { status, amendment_data: amendmentData },
  });
}

export async function shortlistSchoolOffer(
  orgId: string,
  offerId: string,
): Promise<OfferDto> {
  return apiClient.post<OfferDto>(`/v1/orgs/${orgId}/schools/offers/${offerId}/shortlist`);
}

export async function unshortlistSchoolOffer(
  orgId: string,
  offerId: string,
): Promise<OfferDto> {
  return apiClient.post<OfferDto>(`/v1/orgs/${orgId}/schools/offers/${offerId}/unshortlist`);
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

export async function uploadSchoolDocumentFile(
  orgId: string,
  file: File,
): Promise<Readonly<{ mediaId: string; objectKey: string; referenceUrl: string }>> {
  const intent = await createOrgMediaUploadIntent(orgId, {
    filename: file.name,
    content_type: file.type || "application/octet-stream",
    file_size_bytes: file.size,
    caption: "School document",
    hashtags: [],
    visibility: "org",
    publish_to_feed: false,
  });
  const uploadRes = await fetch(intent.uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  });
  if (!uploadRes.ok) {
    throw new Error("Failed to upload document file.");
  }
  return {
    mediaId: intent.mediaId,
    objectKey: intent.objectKey,
    referenceUrl: `media://${intent.mediaId}`,
  };
}
/** ################################ /COMPONENT ############################# */
