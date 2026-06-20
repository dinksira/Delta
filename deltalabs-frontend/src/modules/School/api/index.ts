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
export type SchoolWorkspaceItemTypeDto =
  | "folder"
  | "department"
  | "class"
  | "course"
  | "management-table"
  | "resource"
  | "student"
  | "parent"
  | "service"
  | "staff";

export type SchoolWorkspaceItemDto = Readonly<{
  id: string;
  orgId: string;
  schoolId: string;
  parentId?: string | null;
  type: SchoolWorkspaceItemTypeDto;
  title: string;
  description?: string | null;
  metadata: Record<string, unknown>;
  isRoot: boolean;
  createdAt: string;
  updatedAt: string;
}>;

export type SchoolWorkspaceListResponseDto = Readonly<{
  items: readonly SchoolWorkspaceItemDto[];
}>;

export type ClassSessionTypeDto = "virtual" | "in_person" | "hybrid";
export type ClassSessionStatusDto = "draft" | "scheduled" | "live" | "completed";

export type ClassSessionDto = Readonly<{
  id: string;
  orgId: string;
  schoolId: string;
  classWorkspaceItemId: string;
  title: string;
  description?: string | null;
  weight?: number | null;
  durationMinutes?: number | null;
  sessionType: ClassSessionTypeDto;
  scheduledAt?: string | null;
  status: ClassSessionStatusDto;
  creationMode?: "single" | "multiple" | null;
  createdAt: string;
  updatedAt: string;
}>;

export type ClassSessionListResponseDto = Readonly<{
  items: readonly ClassSessionDto[];
}>;

export type ClassEnrollmentUserDto = Readonly<{
  userId: string;
  username?: string | null;
  email?: string | null;
  fullName?: string | null;
}>;

export type ClassEnrollmentDto = Readonly<{
  id: string;
  orgId: string;
  schoolId: string;
  classWorkspaceItemId: string;
  userId: string;
  role: "student";
  status: "active" | "withdrawn" | "pending";
  enrolledAt: string;
  updatedAt: string;
  enrolledByUserId?: string | null;
  user: ClassEnrollmentUserDto;
}>;

export type ClassEnrollmentListResponseDto = Readonly<{
  items: readonly ClassEnrollmentDto[];
}>;

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

/** GET /v1/orgs/:orgId/access — requires org membership. */
export type OrgAccessDto = Readonly<{
  orgId: string;
  roleKeys: readonly string[];
  permissions: readonly string[];
  membershipState: string;
}>;

export async function fetchOrgAccess(orgId: string): Promise<OrgAccessDto> {
  return apiClient.get<OrgAccessDto>(`/v1/orgs/${encodeURIComponent(orgId)}/access`);
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

export async function fetchSchoolWorkspaceItems(
  orgId: string,
  schoolId: string,
  itemType?: SchoolWorkspaceItemTypeDto,
  parentId?: string | null,
): Promise<SchoolWorkspaceListResponseDto> {
  const searchParams: Record<string, string> = {};
  if (itemType) searchParams.type = itemType;
  if (parentId) searchParams.parentId = parentId;
  return apiClient.get<SchoolWorkspaceListResponseDto>(
    `/v1/orgs/${orgId}/schools/${schoolId}/workspace/items`,
    Object.keys(searchParams).length > 0 ? { searchParams } : undefined,
  );
}

export async function fetchSchoolWorkspaceItem(
  orgId: string,
  schoolId: string,
  itemId: string,
): Promise<SchoolWorkspaceItemDto> {
  return apiClient.get<SchoolWorkspaceItemDto>(
    `/v1/orgs/${orgId}/schools/${schoolId}/workspace/items/${encodeURIComponent(itemId)}`,
  );
}

export async function createSchoolWorkspaceItem(
  orgId: string,
  schoolId: string,
  payload: Readonly<{
    type: SchoolWorkspaceItemTypeDto;
    title: string;
    description?: string;
    metadata?: Record<string, unknown>;
    parentId?: string;
  }>,
): Promise<SchoolWorkspaceItemDto> {
  return apiClient.post<SchoolWorkspaceItemDto>(
    `/v1/orgs/${orgId}/schools/${schoolId}/workspace/items`,
    { json: payload },
  );
}

export async function updateSchoolWorkspaceItem(
  orgId: string,
  schoolId: string,
  itemId: string,
  payload: Readonly<{
    title?: string;
    description?: string;
    metadata?: Record<string, unknown>;
  }>,
): Promise<SchoolWorkspaceItemDto> {
  return apiClient.patch<SchoolWorkspaceItemDto>(
    `/v1/orgs/${orgId}/schools/${schoolId}/workspace/items/${itemId}`,
    { json: payload },
  );
}

export async function deleteSchoolWorkspaceItem(
  orgId: string,
  schoolId: string,
  itemId: string,
): Promise<{ status: string; itemId: string }> {
  return apiClient.delete<{ status: string; itemId: string }>(
    `/v1/orgs/${orgId}/schools/${schoolId}/workspace/items/${itemId}`,
  );
}

export async function fetchClassSessions(
  orgId: string,
  schoolId: string,
  classWorkspaceItemId: string,
): Promise<ClassSessionListResponseDto> {
  return apiClient.get<ClassSessionListResponseDto>(
    `/v1/orgs/${orgId}/schools/${schoolId}/classes/${encodeURIComponent(classWorkspaceItemId)}/sessions`,
  );
}

export async function createClassSession(
  orgId: string,
  schoolId: string,
  classWorkspaceItemId: string,
  payload: Readonly<{
    title: string;
    description?: string;
    weight?: number;
    durationMinutes?: number;
    sessionType?: ClassSessionTypeDto;
    scheduledAt?: string;
    creationMode?: "single" | "multiple";
  }>,
): Promise<ClassSessionDto> {
  return apiClient.post<ClassSessionDto>(
    `/v1/orgs/${orgId}/schools/${schoolId}/classes/${encodeURIComponent(classWorkspaceItemId)}/sessions`,
    { json: payload },
  );
}

export async function updateClassSession(
  orgId: string,
  schoolId: string,
  classWorkspaceItemId: string,
  sessionId: string,
  payload: Readonly<{
    title?: string;
    description?: string;
    weight?: number;
    durationMinutes?: number;
    sessionType?: ClassSessionTypeDto;
    scheduledAt?: string | null;
    status?: ClassSessionStatusDto;
  }>,
): Promise<ClassSessionDto> {
  return apiClient.patch<ClassSessionDto>(
    `/v1/orgs/${orgId}/schools/${schoolId}/classes/${encodeURIComponent(classWorkspaceItemId)}/sessions/${encodeURIComponent(sessionId)}`,
    { json: payload },
  );
}

export async function deleteClassSession(
  orgId: string,
  schoolId: string,
  classWorkspaceItemId: string,
  sessionId: string,
): Promise<{ status: string; sessionId: string }> {
  return apiClient.delete<{ status: string; sessionId: string }>(
    `/v1/orgs/${orgId}/schools/${schoolId}/classes/${encodeURIComponent(classWorkspaceItemId)}/sessions/${encodeURIComponent(sessionId)}`,
  );
}

export async function fetchClassEnrollments(
  orgId: string,
  schoolId: string,
  classWorkspaceItemId: string,
): Promise<ClassEnrollmentListResponseDto> {
  return apiClient.get<ClassEnrollmentListResponseDto>(
    `/v1/orgs/${orgId}/schools/${schoolId}/classes/${encodeURIComponent(classWorkspaceItemId)}/enrollments`,
  );
}

export async function enrollClassStudent(
  orgId: string,
  schoolId: string,
  classWorkspaceItemId: string,
  payload: Readonly<{ userId?: string; email?: string }>,
): Promise<ClassEnrollmentDto> {
  return apiClient.post<ClassEnrollmentDto>(
    `/v1/orgs/${orgId}/schools/${schoolId}/classes/${encodeURIComponent(classWorkspaceItemId)}/enrollments`,
    { json: payload },
  );
}

export async function withdrawClassEnrollment(
  orgId: string,
  schoolId: string,
  classWorkspaceItemId: string,
  enrollmentId: string,
): Promise<{ status: string; enrollmentId: string }> {
  return apiClient.delete<{ status: string; enrollmentId: string }>(
    `/v1/orgs/${orgId}/schools/${schoolId}/classes/${encodeURIComponent(classWorkspaceItemId)}/enrollments/${encodeURIComponent(enrollmentId)}`,
  );
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

/** Management tables — flexible column templates and row data (Monday-style boards). */
export type ManagementTableColumnTypeDto =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "checkbox"
  | "dropdown"
  | "status"
  | "link"
  | "phone";

export type ManagementTableColumnDto = Readonly<{
  id: string;
  title: string;
  type: ManagementTableColumnTypeDto;
  order: number;
  settings: Readonly<Record<string, unknown>>;
}>;

export type ManagementTableDefinitionDto = Readonly<{
  id: string;
  orgId: string;
  schoolId: string;
  title: string;
  visibility: "self_owned" | "sharable";
  sourceDefinitionId?: string | null;
  version: number;
  columns: readonly ManagementTableColumnDto[];
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}>;

export type ManagementTableDefinitionListResponseDto = Readonly<{
  items: readonly ManagementTableDefinitionDto[];
}>;

export type ManagementTableGroupDto = Readonly<{
  id: string;
  title: string;
  order: number;
}>;

export type ManagementTableInstanceDto = Readonly<{
  id: string;
  orgId: string;
  schoolId: string;
  definitionId: string;
  definitionVersion: number;
  workspaceItemId?: string | null;
  title: string;
  /** Present on API v2+; missing rows fall back to a single implicit main group. */
  tableGroups?: readonly ManagementTableGroupDto[];
  createdAt: string;
  updatedAt: string;
}>;

export type ManagementTableInstanceBundleDto = Readonly<{
  instance: ManagementTableInstanceDto;
  definition: ManagementTableDefinitionDto;
}>;

export type ManagementTableRowDto = Readonly<{
  id: string;
  instanceId: string;
  groupId?: string | null;
  position: number;
  cells: Readonly<Record<string, unknown>>;
  createdAt: string;
  updatedAt: string;
}>;

export type ManagementTableRowListResponseDto = Readonly<{
  items: readonly ManagementTableRowDto[];
  total: number;
}>;

export type ManagementTableWorkspaceBootstrapDto = Readonly<{
  instance: ManagementTableInstanceDto;
  definition: ManagementTableDefinitionDto;
  alreadyLinked: boolean;
}>;

export async function fetchManagementTableDefinitions(
  orgId: string,
  schoolId: string,
  scope: "all" | "template" | "mine" = "all",
): Promise<ManagementTableDefinitionListResponseDto> {
  return apiClient.get<ManagementTableDefinitionListResponseDto>(
    `/v1/orgs/${encodeURIComponent(orgId)}/schools/${encodeURIComponent(schoolId)}/management-tables/definitions`,
    { searchParams: { scope } },
  );
}

export async function createManagementTableDefinition(
  orgId: string,
  schoolId: string,
  payload: Readonly<{ title: string; visibility?: "self_owned" | "sharable" }>,
): Promise<ManagementTableDefinitionDto> {
  return apiClient.post<ManagementTableDefinitionDto>(
    `/v1/orgs/${encodeURIComponent(orgId)}/schools/${encodeURIComponent(schoolId)}/management-tables/definitions`,
    { json: payload },
  );
}

export async function appendManagementTableColumn(
  orgId: string,
  schoolId: string,
  definitionId: string,
  payload: Readonly<{ title: string; type: ManagementTableColumnTypeDto; settings?: Record<string, unknown> }>,
): Promise<ManagementTableDefinitionDto> {
  return apiClient.post<ManagementTableDefinitionDto>(
    `/v1/orgs/${encodeURIComponent(orgId)}/schools/${encodeURIComponent(schoolId)}/management-tables/definitions/${encodeURIComponent(definitionId)}/columns`,
    { json: payload },
  );
}

export async function patchManagementTableColumn(
  orgId: string,
  schoolId: string,
  definitionId: string,
  columnId: string,
  payload: Readonly<{ title: string }>,
): Promise<ManagementTableDefinitionDto> {
  return apiClient.patch<ManagementTableDefinitionDto>(
    `/v1/orgs/${encodeURIComponent(orgId)}/schools/${encodeURIComponent(schoolId)}/management-tables/definitions/${encodeURIComponent(definitionId)}/columns/${encodeURIComponent(columnId)}`,
    { json: payload },
  );
}

export async function deleteManagementTableColumn(
  orgId: string,
  schoolId: string,
  definitionId: string,
  columnId: string,
): Promise<ManagementTableDefinitionDto> {
  return apiClient.delete<ManagementTableDefinitionDto>(
    `/v1/orgs/${encodeURIComponent(orgId)}/schools/${encodeURIComponent(schoolId)}/management-tables/definitions/${encodeURIComponent(definitionId)}/columns/${encodeURIComponent(columnId)}`,
  );
}

export async function inheritManagementTableDefinition(
  orgId: string,
  schoolId: string,
  sourceDefinitionId: string,
  payload: Readonly<{ title: string; visibility?: "self_owned" | "sharable" }>,
): Promise<ManagementTableDefinitionDto> {
  return apiClient.post<ManagementTableDefinitionDto>(
    `/v1/orgs/${encodeURIComponent(orgId)}/schools/${encodeURIComponent(schoolId)}/management-tables/definitions/${encodeURIComponent(sourceDefinitionId)}/inherit`,
    { json: payload },
  );
}

export async function createManagementTableInstance(
  orgId: string,
  schoolId: string,
  payload: Readonly<{
    definitionId: string;
    title?: string;
    workspaceItemId?: string;
  }>,
): Promise<ManagementTableInstanceBundleDto> {
  return apiClient.post<ManagementTableInstanceBundleDto>(
    `/v1/orgs/${encodeURIComponent(orgId)}/schools/${encodeURIComponent(schoolId)}/management-tables/instances`,
    { json: payload },
  );
}

export async function fetchManagementTableInstanceBundle(
  orgId: string,
  schoolId: string,
  instanceId: string,
): Promise<ManagementTableInstanceBundleDto> {
  return apiClient.get<ManagementTableInstanceBundleDto>(
    `/v1/orgs/${encodeURIComponent(orgId)}/schools/${encodeURIComponent(schoolId)}/management-tables/instances/${encodeURIComponent(instanceId)}`,
  );
}

export async function fetchManagementTableRows(
  orgId: string,
  schoolId: string,
  instanceId: string,
  page = 1,
  pageSize = 200,
  groupId?: string,
): Promise<ManagementTableRowListResponseDto> {
  return apiClient.get<ManagementTableRowListResponseDto>(
    `/v1/orgs/${encodeURIComponent(orgId)}/schools/${encodeURIComponent(schoolId)}/management-tables/instances/${encodeURIComponent(instanceId)}/rows`,
    {
      searchParams: {
        page: String(page),
        pageSize: String(pageSize),
        ...(groupId ? { groupId } : {}),
      },
    },
  );
}

export async function createManagementTableRow(
  orgId: string,
  schoolId: string,
  instanceId: string,
  groupId?: string,
): Promise<ManagementTableRowDto> {
  return apiClient.post<ManagementTableRowDto>(
    `/v1/orgs/${encodeURIComponent(orgId)}/schools/${encodeURIComponent(schoolId)}/management-tables/instances/${encodeURIComponent(instanceId)}/rows`,
    { searchParams: groupId ? { groupId } : {} },
  );
}

export async function createManagementTableTableGroup(
  orgId: string,
  schoolId: string,
  instanceId: string,
  payload: Readonly<{ title: string }>,
): Promise<ManagementTableGroupDto> {
  return apiClient.post<ManagementTableGroupDto>(
    `/v1/orgs/${encodeURIComponent(orgId)}/schools/${encodeURIComponent(schoolId)}/management-tables/instances/${encodeURIComponent(instanceId)}/table-groups`,
    { json: payload },
  );
}

export async function patchManagementTableRowCells(
  orgId: string,
  schoolId: string,
  instanceId: string,
  rowId: string,
  cells: Readonly<Record<string, unknown>>,
): Promise<ManagementTableRowDto> {
  return apiClient.patch<ManagementTableRowDto>(
    `/v1/orgs/${encodeURIComponent(orgId)}/schools/${encodeURIComponent(schoolId)}/management-tables/instances/${encodeURIComponent(instanceId)}/rows/${encodeURIComponent(rowId)}`,
    { json: { cells } },
  );
}

export async function bootstrapManagementTableWorkspaceItem(
  orgId: string,
  schoolId: string,
  workspaceItemId: string,
): Promise<ManagementTableWorkspaceBootstrapDto> {
  return apiClient.post<ManagementTableWorkspaceBootstrapDto>(
    `/v1/orgs/${encodeURIComponent(orgId)}/schools/${encodeURIComponent(schoolId)}/workspace/items/${encodeURIComponent(workspaceItemId)}/management-table/bootstrap`,
  );
}

export type SchoolMemberSearchUserDto = Readonly<{
  userId: string;
  username?: string | null;
  email?: string | null;
  fullName?: string | null;
}>;

export type SchoolMemberSearchResponseDto = Readonly<{
  items: readonly SchoolMemberSearchUserDto[];
}>;

export type SchoolMemberSearchPicker = "school_students" | "school_parents" | "class_students" | "platform";

export async function searchSchoolMembers(
  orgId: string,
  schoolId: string,
  q: string,
  limit = 20,
  picker: SchoolMemberSearchPicker = "school_students",
  classWorkspaceItemId?: string,
): Promise<SchoolMemberSearchResponseDto> {
  return apiClient.get<SchoolMemberSearchResponseDto>(
    `/v1/orgs/${encodeURIComponent(orgId)}/schools/${encodeURIComponent(schoolId)}/members/search`,
    {
      searchParams: {
        q,
        limit,
        picker,
        ...(classWorkspaceItemId?.trim() ? { classWorkspaceItemId: classWorkspaceItemId.trim() } : {}),
      },
    },
  );
}

export async function bootstrapClassStudentsTable(
  orgId: string,
  schoolId: string,
  classWorkspaceItemId: string,
): Promise<ManagementTableWorkspaceBootstrapDto> {
  return bootstrapStudentsTableWorkspaceItem(orgId, schoolId, classWorkspaceItemId);
}

export async function bootstrapStudentsTableWorkspaceItem(
  orgId: string,
  schoolId: string,
  workspaceItemId: string,
): Promise<ManagementTableWorkspaceBootstrapDto> {
  return apiClient.post<ManagementTableWorkspaceBootstrapDto>(
    `/v1/orgs/${encodeURIComponent(orgId)}/schools/${encodeURIComponent(schoolId)}/workspace/items/${encodeURIComponent(workspaceItemId)}/students-table/bootstrap`,
  );
}

export async function bootstrapClassParentsTable(
  orgId: string,
  schoolId: string,
  classWorkspaceItemId: string,
): Promise<ManagementTableWorkspaceBootstrapDto> {
  return bootstrapParentsTableWorkspaceItem(orgId, schoolId, classWorkspaceItemId);
}

export async function bootstrapParentsTableWorkspaceItem(
  orgId: string,
  schoolId: string,
  workspaceItemId: string,
): Promise<ManagementTableWorkspaceBootstrapDto> {
  return apiClient.post<ManagementTableWorkspaceBootstrapDto>(
    `/v1/orgs/${encodeURIComponent(orgId)}/schools/${encodeURIComponent(schoolId)}/workspace/items/${encodeURIComponent(workspaceItemId)}/parents-table/bootstrap`,
  );
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
