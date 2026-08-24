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
  /** Backend may also emit snake_case depending on serialization settings. */
  media_id?: string;
  object_key?: string;
  upload_url?: string;
  expires_in_seconds?: number;
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

export type ClassRoadmapContentStatusDto = "pending" | "completed";
export type ClassRoadmapResourceKindDto = "session" | "course" | "assignment" | "exam" | "video";
export type ClassRoadmapContentTypeDto = "video" | "exam" | "assignment" | "session" | "course";

export type ClassRoadmapContentItemDto = Readonly<{
  id: string;
  kind: ClassRoadmapResourceKindDto;
  contentType: ClassRoadmapContentTypeDto;
  title: string;
  subtitle?: string | null;
  sourceKey?: string | null;
  tags: readonly string[];
  status: ClassRoadmapContentStatusDto;
}>;

export type ClassRoadmapSectionDto = Readonly<{
  id: string;
  title: string;
  description: string;
  tags: readonly string[];
  collapsed: boolean;
  contents: readonly ClassRoadmapContentItemDto[];
}>;

export type ClassRoadmapDto = Readonly<{
  orgId: string;
  schoolId: string;
  classWorkspaceItemId: string;
  sections: readonly ClassRoadmapSectionDto[];
  currentSectionId: string | null;
  currentContentId: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}>;

export type ClassRoadmapPutInputDto = Readonly<{
  sections: readonly ClassRoadmapSectionDto[];
  currentSectionId?: string | null;
  currentContentId?: string | null;
}>;

export type ClassRoadmapSidebarResourceDto = Readonly<{
  id: string;
  kind: ClassRoadmapResourceKindDto;
  contentType: ClassRoadmapContentTypeDto;
  title: string;
  subtitle?: string | null;
  sourceKey: string;
}>;

export type ClassRoadmapResourcesResponseDto = Readonly<{
  sessions: readonly ClassRoadmapSidebarResourceDto[];
  courses: readonly ClassRoadmapSidebarResourceDto[];
  materials: readonly ClassRoadmapSidebarResourceDto[];
}>;

export async function fetchClassRoadmap(
  orgId: string,
  schoolId: string,
  classWorkspaceItemId: string,
): Promise<ClassRoadmapDto> {
  return apiClient.get<ClassRoadmapDto>(
    `/v1/orgs/${orgId}/schools/${schoolId}/classes/${encodeURIComponent(classWorkspaceItemId)}/roadmap`,
  );
}

export async function putClassRoadmap(
  orgId: string,
  schoolId: string,
  classWorkspaceItemId: string,
  payload: ClassRoadmapPutInputDto,
): Promise<ClassRoadmapDto> {
  return apiClient.put<ClassRoadmapDto>(
    `/v1/orgs/${orgId}/schools/${schoolId}/classes/${encodeURIComponent(classWorkspaceItemId)}/roadmap`,
    { json: payload },
  );
}

export async function fetchClassRoadmapResources(
  orgId: string,
  schoolId: string,
  classWorkspaceItemId: string,
): Promise<ClassRoadmapResourcesResponseDto> {
  return apiClient.get<ClassRoadmapResourcesResponseDto>(
    `/v1/orgs/${orgId}/schools/${schoolId}/classes/${encodeURIComponent(classWorkspaceItemId)}/roadmap/resources`,
  );
}

export type AttendanceMarkStatusDto = "present" | "absent" | "late";
export type AttendanceDeviceTypeDto = "qr_scanner" | "fingerprint" | "other";
export type AttendanceDeviceStatusDto = "online" | "offline";
export type AttendanceSessionTrackingDto = "manual" | "device";

export type AttendanceSessionDto = Readonly<{
  id: string;
  title: string;
  scheduledAt: string | null;
  hidden: boolean;
  trackingMode: AttendanceSessionTrackingDto;
  createdAt: string;
}>;

export type AttendanceDeviceDto = Readonly<{
  id: string;
  name: string;
  deviceType: AttendanceDeviceTypeDto;
  attendanceSessionLabel: string;
  status: AttendanceDeviceStatusDto;
  lastSyncedAt: string | null;
  createdAt: string;
}>;

export type AttendanceFormulaConfigDto = Readonly<{
  mode: "preset" | "custom";
  operation: "sum" | "average" | "count_present";
  sessionIds: readonly string[];
  customExpression: string;
}>;

export type AttendanceFaceDetectionSettingsDto = Readonly<{
  section: string;
  trackOption: "random_sampling" | "continuous";
  samplingIntervalMinutes: number;
  presenceThresholdPercent: number;
}>;

export type AttendanceRealtimeTrackConfigDto = Readonly<{
  enabled: boolean;
  faceDetection: boolean;
  voiceRecognition: boolean;
  recordVideo: boolean;
  recordAudio: boolean;
  faceDetectionSettings: AttendanceFaceDetectionSettingsDto;
}>;

export type ClassAttendanceStateDto = Readonly<{
  sessions: readonly AttendanceSessionDto[];
  devices: readonly AttendanceDeviceDto[];
  marks: Readonly<Record<string, AttendanceMarkStatusDto>>;
  formulaConfig: AttendanceFormulaConfigDto;
  realtimeTrack: AttendanceRealtimeTrackConfigDto;
}>;

export async function fetchClassAttendanceState(
  orgId: string,
  schoolId: string,
  classWorkspaceItemId: string,
): Promise<ClassAttendanceStateDto> {
  return apiClient.get<ClassAttendanceStateDto>(
    `/v1/orgs/${orgId}/schools/${schoolId}/classes/${encodeURIComponent(classWorkspaceItemId)}/attendance`,
  );
}

export async function updateClassAttendanceSessionSettings(
  orgId: string,
  schoolId: string,
  classWorkspaceItemId: string,
  payload: Readonly<{
    classSessionId: string;
    hidden?: boolean;
    trackingMode?: AttendanceSessionTrackingDto;
  }>,
): Promise<ClassAttendanceStateDto> {
  return apiClient.post<ClassAttendanceStateDto>(
    `/v1/orgs/${orgId}/schools/${schoolId}/classes/${encodeURIComponent(classWorkspaceItemId)}/attendance/sessions`,
    { json: payload },
  );
}

export async function registerClassAttendanceDevice(
  orgId: string,
  schoolId: string,
  classWorkspaceItemId: string,
  payload: Readonly<{
    name: string;
    deviceType?: AttendanceDeviceTypeDto;
    attendanceSessionLabel?: string;
  }>,
): Promise<ClassAttendanceStateDto> {
  return apiClient.post<ClassAttendanceStateDto>(
    `/v1/orgs/${orgId}/schools/${schoolId}/classes/${encodeURIComponent(classWorkspaceItemId)}/attendance/devices`,
    { json: payload },
  );
}

export async function patchClassAttendanceMark(
  orgId: string,
  schoolId: string,
  classWorkspaceItemId: string,
  payload: Readonly<{
    studentId: string;
    sessionId: string;
    status: AttendanceMarkStatusDto | null;
  }>,
): Promise<ClassAttendanceStateDto> {
  return apiClient.patch<ClassAttendanceStateDto>(
    `/v1/orgs/${orgId}/schools/${schoolId}/classes/${encodeURIComponent(classWorkspaceItemId)}/attendance/marks`,
    { json: payload },
  );
}

export async function putClassAttendanceFormulaConfig(
  orgId: string,
  schoolId: string,
  classWorkspaceItemId: string,
  payload: AttendanceFormulaConfigDto,
): Promise<ClassAttendanceStateDto> {
  return apiClient.put<ClassAttendanceStateDto>(
    `/v1/orgs/${orgId}/schools/${schoolId}/classes/${encodeURIComponent(classWorkspaceItemId)}/attendance/formula-config`,
    { json: payload },
  );
}

export async function putClassAttendanceRealtimeTrack(
  orgId: string,
  schoolId: string,
  classWorkspaceItemId: string,
  payload: AttendanceRealtimeTrackConfigDto,
): Promise<ClassAttendanceStateDto> {
  return apiClient.put<ClassAttendanceStateDto>(
    `/v1/orgs/${orgId}/schools/${schoolId}/classes/${encodeURIComponent(classWorkspaceItemId)}/attendance/realtime-track`,
    { json: payload },
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

export async function completeOrgMediaUpload(
  orgId: string,
  mediaId: string,
): Promise<
  Readonly<{
    mediaId: string;
    status: string;
    playbackUrl: string;
    publishToFeed: boolean;
    media_id?: string;
    playback_url?: string;
    publish_to_feed?: boolean;
  }>
> {
  return apiClient.post(`/v1/orgs/${encodeURIComponent(orgId)}/media/${encodeURIComponent(mediaId)}/complete`);
}

export type OrgMediaAssetDto = Readonly<{
  id: string;
  orgId?: string;
  status?: string;
  playbackUrl?: string | null;
  playback_url?: string | null;
  hlsUrl?: string | null;
  hls_url?: string | null;
  posterUrl?: string | null;
  uploadObjectKey?: string;
  sourceFilename?: string;
}>;

export async function fetchOrgMedia(orgId: string, mediaId: string): Promise<OrgMediaAssetDto> {
  return apiClient.get<OrgMediaAssetDto>(`/v1/orgs/${orgId}/media/${mediaId}`);
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
  /** Isolates specialized class tables (grades, parents, schedules, …) on the same workspace item. */
  tableKind?: string | null;
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
  /** Monday-style subitem: child rows nest under this parent row id. */
  parentRowId?: string | null;
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

export async function deleteManagementTableRow(
  orgId: string,
  schoolId: string,
  instanceId: string,
  rowId: string,
): Promise<void> {
  await apiClient.delete(
    `/v1/orgs/${encodeURIComponent(orgId)}/schools/${encodeURIComponent(schoolId)}/management-tables/instances/${encodeURIComponent(instanceId)}/rows/${encodeURIComponent(rowId)}`,
  );
}

export async function moveManagementTableRow(
  orgId: string,
  schoolId: string,
  instanceId: string,
  rowId: string,
  direction: "up" | "down",
): Promise<ManagementTableRowDto> {
  return apiClient.post<ManagementTableRowDto>(
    `/v1/orgs/${encodeURIComponent(orgId)}/schools/${encodeURIComponent(schoolId)}/management-tables/instances/${encodeURIComponent(instanceId)}/rows/${encodeURIComponent(rowId)}/move`,
    { json: { direction } },
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

export type SchoolMemberSearchPicker = "school_students" | "school_parents" | "school_teachers" | "class_students" | "platform";

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

export async function bootstrapLeaveRequestsTableWorkspaceItem(
  orgId: string,
  schoolId: string,
  classWorkspaceItemId: string,
): Promise<ManagementTableWorkspaceBootstrapDto> {
  return apiClient.post<ManagementTableWorkspaceBootstrapDto>(
    `/v1/orgs/${encodeURIComponent(orgId)}/schools/${encodeURIComponent(schoolId)}/workspace/items/${encodeURIComponent(classWorkspaceItemId)}/leave-requests-table/bootstrap`,
  );
}

export async function submitClassLeaveRequest(
  orgId: string,
  schoolId: string,
  classWorkspaceItemId: string,
  payload: Readonly<{ cells: Record<string, unknown> }>,
): Promise<ManagementTableRowDto> {
  return apiClient.post<ManagementTableRowDto>(
    `/v1/orgs/${encodeURIComponent(orgId)}/schools/${encodeURIComponent(schoolId)}/classes/${encodeURIComponent(classWorkspaceItemId)}/leave-requests/submit`,
    { json: payload },
  );
}

export async function bootstrapTeachersTableWorkspaceItem(
  orgId: string,
  schoolId: string,
  classWorkspaceItemId: string,
): Promise<ManagementTableWorkspaceBootstrapDto> {
  return apiClient.post<ManagementTableWorkspaceBootstrapDto>(
    `/v1/orgs/${encodeURIComponent(orgId)}/schools/${encodeURIComponent(schoolId)}/workspace/items/${encodeURIComponent(classWorkspaceItemId)}/teachers-table/bootstrap`,
  );
}

export async function bootstrapGradesTableWorkspaceItem(
  orgId: string,
  schoolId: string,
  classWorkspaceItemId: string,
): Promise<ManagementTableWorkspaceBootstrapDto> {
  return apiClient.post<ManagementTableWorkspaceBootstrapDto>(
    `/v1/orgs/${encodeURIComponent(orgId)}/schools/${encodeURIComponent(schoolId)}/workspace/items/${encodeURIComponent(classWorkspaceItemId)}/grades-table/bootstrap`,
  );
}

export async function bootstrapSchedulesTableWorkspaceItem(
  orgId: string,
  schoolId: string,
  classWorkspaceItemId: string,
): Promise<ManagementTableWorkspaceBootstrapDto> {
  return apiClient.post<ManagementTableWorkspaceBootstrapDto>(
    `/v1/orgs/${encodeURIComponent(orgId)}/schools/${encodeURIComponent(schoolId)}/workspace/items/${encodeURIComponent(classWorkspaceItemId)}/schedules-table/bootstrap`,
  );
}

export async function bootstrapAssignmentsTableWorkspaceItem(
  orgId: string,
  schoolId: string,
  classWorkspaceItemId: string,
): Promise<ManagementTableWorkspaceBootstrapDto> {
  return apiClient.post<ManagementTableWorkspaceBootstrapDto>(
    `/v1/orgs/${encodeURIComponent(orgId)}/schools/${encodeURIComponent(schoolId)}/workspace/items/${encodeURIComponent(classWorkspaceItemId)}/assignments-table/bootstrap`,
  );
}

function isPlaceholderMediaUploadUrl(uploadUrl: string): boolean {
  return (
    uploadUrl.includes("replace-with-presigned-token") ||
    uploadUrl.includes("token=replace-with") ||
    (uploadUrl.includes("upload.example.com") && !uploadUrl.includes("/media/local-upload/"))
  );
}

function resolveMediaUploadIntent(intent: MediaUploadIntentResponseDto): Readonly<{
  mediaId: string;
  objectKey: string;
  uploadUrl: string;
}> {
  const mediaId = intent.mediaId || intent.media_id || "";
  const objectKey = intent.objectKey || intent.object_key || "";
  const uploadUrl = intent.uploadUrl || intent.upload_url || "";
  return { mediaId, objectKey, uploadUrl };
}

/**
 * Shared school media upload — same TikTok/feed pipeline (`upload-intent` → presigned PUT).
 * Used by documents and Course Intro videos.
 */
export async function uploadSchoolMediaFile(
  orgId: string,
  file: File,
  opts?: Readonly<{
    caption?: string;
    visibility?: "public" | "org" | "private";
    publishToFeed?: boolean;
  }>,
): Promise<
  Readonly<{ mediaId: string; objectKey: string; referenceUrl: string; playbackUrl: string }>
> {
  const contentType = file.type || "application/octet-stream";
  const intentRaw = await createOrgMediaUploadIntent(orgId, {
    filename: file.name,
    content_type: contentType,
    file_size_bytes: file.size,
    caption: opts?.caption ?? "School media",
    hashtags: [],
    visibility: opts?.visibility ?? "org",
    publish_to_feed: opts?.publishToFeed ?? false,
  });
  const intent = resolveMediaUploadIntent(intentRaw);

  if (!intent.mediaId || !intent.uploadUrl) {
    throw new Error("Upload intent response was missing mediaId or uploadUrl.");
  }
  if (isPlaceholderMediaUploadUrl(intent.uploadUrl)) {
    throw new Error(
      "Media storage is not configured. Use MEDIA_STORAGE_PROVIDER=local (restart API) or set MinIO/S3/R2 credentials.",
    );
  }

  let uploadRes: Response;
  try {
    uploadRes = await fetch(intent.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: file,
    });
  } catch {
    throw new Error(
      "Could not reach media storage (network/CORS). Check the presigned upload URL and bucket CORS for PUT from this origin.",
    );
  }
  if (!uploadRes.ok) {
    throw new Error(`Failed to upload file to storage (HTTP ${uploadRes.status}).`);
  }

  let playbackUrl = "";
  try {
    const completed = await completeOrgMediaUpload(orgId, intent.mediaId);
    playbackUrl = completed.playbackUrl || completed.playback_url || "";
  } catch {
    // Local PUT already auto-completes; resolve via media GET below if needed.
  }

  if (!playbackUrl) {
    try {
      const asset = await fetchOrgMedia(orgId, intent.mediaId);
      playbackUrl = asset.playbackUrl || asset.playback_url || asset.hlsUrl || asset.hls_url || "";
    } catch {
      /* keep empty — UI can still show placeholder */
    }
  }

  return {
    mediaId: intent.mediaId,
    objectKey: intent.objectKey,
    referenceUrl: `media://${intent.mediaId}`,
    playbackUrl,
  };
}

export async function uploadSchoolDocumentFile(
  orgId: string,
  file: File,
): Promise<Readonly<{ mediaId: string; objectKey: string; referenceUrl: string }>> {
  return uploadSchoolMediaFile(orgId, file, {
    caption: "School document",
    visibility: "org",
    publishToFeed: false,
  });
}

/* —— Course Q&A —— */

export type CourseQaAuthorDto = Readonly<{
  userId: string;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
}>;

export type CourseQaCommentDto = Readonly<{
  id: string;
  text: string;
  author: CourseQaAuthorDto;
  createdAt: string;
}>;

export type CourseQaAnswerDto = Readonly<{
  id: string;
  questionId: string;
  body: string;
  author: CourseQaAuthorDto;
  isAnonymous: boolean;
  voteScore: number;
  myVote: number;
  isAccepted: boolean;
  comments: readonly CourseQaCommentDto[];
  createdAt: string;
  updatedAt: string;
}>;

export type CourseQaQuestionDto = Readonly<{
  id: string;
  orgId: string;
  schoolId: string;
  courseWorkspaceItemId: string;
  title: string;
  body: string;
  tags: readonly string[];
  visibility: "public" | "private";
  pricing: "free" | "paid";
  status: "open" | "closed" | "trash";
  author: CourseQaAuthorDto;
  voteScore: number;
  myVote: number;
  viewCount: number;
  answerCount: number;
  acceptedAnswerId: string | null;
  bookmarkedByMe: boolean;
  createdAt: string;
  updatedAt: string;
}>;

export type CourseQaQuestionDetailDto = CourseQaQuestionDto &
  Readonly<{ answers: readonly CourseQaAnswerDto[] }>;

export type CourseQaQuestionListResponseDto = Readonly<{
  items: readonly CourseQaQuestionDto[];
  total: number;
}>;

function courseQaBase(orgId: string, schoolId: string, courseId: string): string {
  return `/v1/orgs/${encodeURIComponent(orgId)}/schools/${encodeURIComponent(schoolId)}/courses/${encodeURIComponent(courseId)}/qa`;
}

export async function fetchCourseQaQuestions(
  orgId: string,
  schoolId: string,
  courseId: string,
  opts?: Readonly<{ q?: string; tag?: string }>,
): Promise<CourseQaQuestionListResponseDto> {
  const searchParams: Record<string, string> = {};
  if (opts?.q?.trim()) searchParams.q = opts.q.trim();
  if (opts?.tag?.trim()) searchParams.tag = opts.tag.trim();
  return apiClient.get<CourseQaQuestionListResponseDto>(
    `${courseQaBase(orgId, schoolId, courseId)}/questions`,
    Object.keys(searchParams).length ? { searchParams } : undefined,
  );
}

export async function createCourseQaQuestion(
  orgId: string,
  schoolId: string,
  courseId: string,
  payload: Readonly<{
    title: string;
    body: string;
    tags?: readonly string[];
    visibility?: "public" | "private";
    pricing?: "free" | "paid";
  }>,
): Promise<CourseQaQuestionDto> {
  return apiClient.post<CourseQaQuestionDto>(
    `${courseQaBase(orgId, schoolId, courseId)}/questions`,
    { json: payload },
  );
}

export async function fetchCourseQaQuestion(
  orgId: string,
  schoolId: string,
  courseId: string,
  questionId: string,
): Promise<CourseQaQuestionDetailDto> {
  return apiClient.get<CourseQaQuestionDetailDto>(
    `${courseQaBase(orgId, schoolId, courseId)}/questions/${encodeURIComponent(questionId)}`,
  );
}

export async function updateCourseQaQuestion(
  orgId: string,
  schoolId: string,
  courseId: string,
  questionId: string,
  payload: Readonly<{
    title?: string;
    body?: string;
    tags?: readonly string[];
    visibility?: "public" | "private";
    pricing?: "free" | "paid";
    status?: "open" | "closed" | "trash";
  }>,
): Promise<CourseQaQuestionDto> {
  return apiClient.patch<CourseQaQuestionDto>(
    `${courseQaBase(orgId, schoolId, courseId)}/questions/${encodeURIComponent(questionId)}`,
    { json: payload },
  );
}

export async function voteCourseQaQuestion(
  orgId: string,
  schoolId: string,
  courseId: string,
  questionId: string,
  value: 1 | -1,
): Promise<CourseQaQuestionDto> {
  return apiClient.post<CourseQaQuestionDto>(
    `${courseQaBase(orgId, schoolId, courseId)}/questions/${encodeURIComponent(questionId)}/vote`,
    { json: { value } },
  );
}

export async function bookmarkCourseQaQuestion(
  orgId: string,
  schoolId: string,
  courseId: string,
  questionId: string,
): Promise<CourseQaQuestionDto> {
  return apiClient.post<CourseQaQuestionDto>(
    `${courseQaBase(orgId, schoolId, courseId)}/questions/${encodeURIComponent(questionId)}/bookmark`,
  );
}

export async function createCourseQaAnswer(
  orgId: string,
  schoolId: string,
  courseId: string,
  questionId: string,
  payload: Readonly<{ body: string; isAnonymous?: boolean }>,
): Promise<CourseQaAnswerDto> {
  return apiClient.post<CourseQaAnswerDto>(
    `${courseQaBase(orgId, schoolId, courseId)}/questions/${encodeURIComponent(questionId)}/answers`,
    { json: payload },
  );
}

export async function voteCourseQaAnswer(
  orgId: string,
  schoolId: string,
  courseId: string,
  answerId: string,
  value: 1 | -1,
): Promise<CourseQaAnswerDto> {
  return apiClient.post<CourseQaAnswerDto>(
    `${courseQaBase(orgId, schoolId, courseId)}/answers/${encodeURIComponent(answerId)}/vote`,
    { json: { value } },
  );
}

export async function approveCourseQaAnswer(
  orgId: string,
  schoolId: string,
  courseId: string,
  questionId: string,
  answerId: string,
): Promise<CourseQaQuestionDetailDto> {
  return apiClient.post<CourseQaQuestionDetailDto>(
    `${courseQaBase(orgId, schoolId, courseId)}/questions/${encodeURIComponent(questionId)}/answers/${encodeURIComponent(answerId)}/approve`,
  );
}

export async function commentCourseQaAnswer(
  orgId: string,
  schoolId: string,
  courseId: string,
  answerId: string,
  text: string,
): Promise<CourseQaAnswerDto> {
  return apiClient.post<CourseQaAnswerDto>(
    `${courseQaBase(orgId, schoolId, courseId)}/answers/${encodeURIComponent(answerId)}/comments`,
    { json: { text } },
  );
}

/* —— Course Exercise & Test —— */

export type CourseExerciseAuthorDto = Readonly<{
  userId: string;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
}>;

export type ExerciseQuestionTypeDto =
  | "mcq"
  | "true_false"
  | "fill_blank"
  | "matching"
  | "writing"
  | "ordering";

export type ExerciseOptionDto = Readonly<{
  id: string;
  label: string;
  text: string;
  isCorrect?: boolean;
  ghosted?: boolean;
  /** Optional image from a dropped Resources item. */
  imageUrl?: string;
}>;

export type ExerciseMatchingItemDto = Readonly<{
  id: string;
  text: string;
}>;

export type ExerciseQuestionVariantDto = Readonly<{
  id: string;
  name: string;
  type: ExerciseQuestionTypeDto | null;
  stemHtml: string;
  stemGhosted?: boolean;
  options: readonly ExerciseOptionDto[];
  matchingDescription: string;
  columnA: readonly ExerciseMatchingItemDto[];
  columnB: readonly ExerciseMatchingItemDto[];
  blanks: readonly string[];
  orderingItems: readonly ExerciseMatchingItemDto[];
  writingPrompt: string;
}>;

export type ExerciseQuestionDto = Readonly<{
  id: string;
  order: number;
  activeVariantId: string;
  variants: readonly ExerciseQuestionVariantDto[];
}>;

export type CourseExerciseDto = Readonly<{
  id: string;
  orgId: string;
  schoolId: string;
  courseWorkspaceItemId: string;
  kind: "exercise" | "test";
  title: string;
  timeTaken: string;
  timeMinutes?: number | null;
  totalQuestions: number;
  totalMark?: number | null;
  takeWithFriend?: boolean;
  visibility?: "public" | "private" | "unlisted";
  status?: "draft" | "published" | "deleted";
  coverImageUrl: string;
  orgLabel: string;
  /** Set when this exercise was spawned from an Exercise/Test ghost work-order. */
  ghostId?: string | null;
  questions?: readonly ExerciseQuestionDto[];
  createdBy: CourseExerciseAuthorDto;
  createdAt: string;
  updatedAt: string;
}>;

export type CourseExerciseListResponseDto = Readonly<{
  items: readonly CourseExerciseDto[];
  total: number;
}>;

export type CourseExerciseWritePayload = Readonly<{
  title?: string;
  timeTaken?: string;
  timeMinutes?: number | null;
  totalQuestions?: number;
  totalMark?: number | null;
  takeWithFriend?: boolean;
  visibility?: "public" | "private" | "unlisted";
  status?: "draft" | "published";
  kind?: "exercise" | "test";
  coverImageUrl?: string;
  orgLabel?: string;
  questions?: readonly ExerciseQuestionDto[];
}>;

function courseExerciseBase(orgId: string, schoolId: string, courseId: string): string {
  return `/v1/orgs/${encodeURIComponent(orgId)}/schools/${encodeURIComponent(schoolId)}/courses/${encodeURIComponent(courseId)}/exercises`;
}

export async function fetchCourseExercises(
  orgId: string,
  schoolId: string,
  courseId: string,
  kind?: "exercise" | "test",
): Promise<CourseExerciseListResponseDto> {
  return apiClient.get<CourseExerciseListResponseDto>(courseExerciseBase(orgId, schoolId, courseId), {
    searchParams: kind ? { kind } : undefined,
  });
}

export async function fetchCourseExercise(
  orgId: string,
  schoolId: string,
  courseId: string,
  exerciseId: string,
): Promise<CourseExerciseDto> {
  return apiClient.get<CourseExerciseDto>(
    `${courseExerciseBase(orgId, schoolId, courseId)}/${encodeURIComponent(exerciseId)}`,
  );
}

export async function createCourseExercise(
  orgId: string,
  schoolId: string,
  courseId: string,
  payload: CourseExerciseWritePayload,
): Promise<CourseExerciseDto> {
  return apiClient.post<CourseExerciseDto>(courseExerciseBase(orgId, schoolId, courseId), {
    json: payload,
  });
}

export async function updateCourseExercise(
  orgId: string,
  schoolId: string,
  courseId: string,
  exerciseId: string,
  payload: CourseExerciseWritePayload,
): Promise<CourseExerciseDto> {
  return apiClient.patch<CourseExerciseDto>(
    `${courseExerciseBase(orgId, schoolId, courseId)}/${encodeURIComponent(exerciseId)}`,
    { json: payload },
  );
}

export async function deleteCourseExercise(
  orgId: string,
  schoolId: string,
  courseId: string,
  exerciseId: string,
): Promise<void> {
  await apiClient.delete(
    `${courseExerciseBase(orgId, schoolId, courseId)}/${encodeURIComponent(exerciseId)}`,
  );
}

/* —— Course Fast Summary —— */

export type CourseSummaryAuthorDto = Readonly<{
  userId: string;
  username: string;
  fullName?: string | null;
  avatarUrl?: string | null;
}>;

export type CourseSummaryDto = Readonly<{
  id: string;
  orgId: string;
  schoolId: string;
  courseWorkspaceItemId: string;
  title: string;
  summaryType: string;
  section: string;
  layout: "stack" | "split";
  bodyHtml: string;
  status?: "draft" | "published" | "deleted";
  orgLabel: string;
  readMinutes?: number | null;
  ghostId?: string | null;
  createdBy: CourseSummaryAuthorDto;
  createdAt: string;
  updatedAt: string;
}>;

export type CourseSummaryListResponseDto = Readonly<{
  items: readonly CourseSummaryDto[];
  total: number;
}>;

export type CourseSummaryWritePayload = Readonly<{
  title?: string;
  summaryType?: string;
  section?: string;
  layout?: "stack" | "split";
  bodyHtml?: string;
  status?: "draft" | "published";
  orgLabel?: string;
  readMinutes?: number | null;
}>;

function courseSummaryBase(orgId: string, schoolId: string, courseId: string): string {
  return `/v1/orgs/${encodeURIComponent(orgId)}/schools/${encodeURIComponent(schoolId)}/courses/${encodeURIComponent(courseId)}/summaries`;
}

export async function fetchCourseSummaries(
  orgId: string,
  schoolId: string,
  courseId: string,
): Promise<CourseSummaryListResponseDto> {
  return apiClient.get<CourseSummaryListResponseDto>(courseSummaryBase(orgId, schoolId, courseId));
}

export async function fetchCourseSummary(
  orgId: string,
  schoolId: string,
  courseId: string,
  summaryId: string,
): Promise<CourseSummaryDto> {
  return apiClient.get<CourseSummaryDto>(
    `${courseSummaryBase(orgId, schoolId, courseId)}/${encodeURIComponent(summaryId)}`,
  );
}

export async function createCourseSummary(
  orgId: string,
  schoolId: string,
  courseId: string,
  payload: CourseSummaryWritePayload,
): Promise<CourseSummaryDto> {
  return apiClient.post<CourseSummaryDto>(courseSummaryBase(orgId, schoolId, courseId), {
    json: payload,
  });
}

export async function updateCourseSummary(
  orgId: string,
  schoolId: string,
  courseId: string,
  summaryId: string,
  payload: CourseSummaryWritePayload,
): Promise<CourseSummaryDto> {
  return apiClient.patch<CourseSummaryDto>(
    `${courseSummaryBase(orgId, schoolId, courseId)}/${encodeURIComponent(summaryId)}`,
    { json: payload },
  );
}

export async function deleteCourseSummary(
  orgId: string,
  schoolId: string,
  courseId: string,
  summaryId: string,
): Promise<void> {
  await apiClient.delete(
    `${courseSummaryBase(orgId, schoolId, courseId)}/${encodeURIComponent(summaryId)}`,
  );
}

/* —— Course Score —— */

export type CourseScoreAssessmentDto = Readonly<{
  id: string;
  title: string;
  maxPoints: number;
}>;

export type CourseScoreLineDto = Readonly<{
  assessmentId: string;
  points: number | null;
  rank: number | null;
}>;

export type CourseScoreEntryDto = Readonly<{
  id: string;
  studentUserId?: string | null;
  displayName: string;
  subtitle: string;
  avatarUrl?: string | null;
  lines: readonly CourseScoreLineDto[];
  totalPoints: number;
  maxTotal: number;
  statusPercent: number;
  rank: number;
  updatedAt: string;
}>;

export type CourseScoreBoardDto = Readonly<{
  id: string;
  orgId: string;
  schoolId: string;
  courseWorkspaceItemId: string;
  assessments: readonly CourseScoreAssessmentDto[];
  entries: readonly CourseScoreEntryDto[];
  updatedAt: string;
}>;

export type CourseScoreBoardWritePayload = Readonly<{
  assessments: readonly Readonly<{
    id?: string;
    title: string;
    maxPoints: number;
  }>[];
  entries: readonly Readonly<{
    id?: string;
    studentUserId?: string | null;
    displayName: string;
    subtitle?: string;
    avatarUrl?: string | null;
    lines: readonly Readonly<{
      assessmentId: string;
      points: number | null;
    }>[];
    updatedAt?: string;
  }>[];
}>;

function courseScoreboardPath(orgId: string, schoolId: string, courseId: string): string {
  return `/v1/orgs/${encodeURIComponent(orgId)}/schools/${encodeURIComponent(schoolId)}/courses/${encodeURIComponent(courseId)}/scoreboard`;
}

export async function fetchCourseScoreboard(
  orgId: string,
  schoolId: string,
  courseId: string,
): Promise<CourseScoreBoardDto> {
  return apiClient.get<CourseScoreBoardDto>(courseScoreboardPath(orgId, schoolId, courseId));
}

export async function replaceCourseScoreboard(
  orgId: string,
  schoolId: string,
  courseId: string,
  payload: CourseScoreBoardWritePayload,
): Promise<CourseScoreBoardDto> {
  return apiClient.put<CourseScoreBoardDto>(courseScoreboardPath(orgId, schoolId, courseId), {
    json: payload,
  });
}

export async function seedCourseScoreboardDemo(
  orgId: string,
  schoolId: string,
  courseId: string,
): Promise<CourseScoreBoardDto> {
  return apiClient.post<CourseScoreBoardDto>(
    `${courseScoreboardPath(orgId, schoolId, courseId)}/seed-demo`,
  );
}

/* —— Course Supplements —— */

export type CourseSupplementKind = "pdf" | "slides" | "video" | "audio" | "other";
export type CourseSupplementSource = "upload" | "link";

export type CourseSupplementAuthorDto = Readonly<{
  userId: string;
  username: string;
  fullName?: string | null;
  avatarUrl?: string | null;
}>;

export type CourseSupplementDto = Readonly<{
  id: string;
  orgId: string;
  schoolId: string;
  courseWorkspaceItemId: string;
  title: string;
  description: string;
  kind: CourseSupplementKind;
  source: CourseSupplementSource;
  tags: readonly string[];
  mediaId?: string | null;
  playbackUrl: string;
  linkUrl: string;
  contentType: string;
  fileName: string;
  status?: "draft" | "published" | "deleted";
  ghostId?: string | null;
  createdBy: CourseSupplementAuthorDto;
  createdAt: string;
  updatedAt: string;
}>;

export type CourseSupplementListResponseDto = Readonly<{
  items: readonly CourseSupplementDto[];
  total: number;
}>;

export type CourseSupplementWritePayload = Readonly<{
  title: string;
  description?: string;
  kind?: CourseSupplementKind;
  source?: CourseSupplementSource;
  tags?: readonly string[];
  mediaId?: string | null;
  playbackUrl?: string;
  linkUrl?: string;
  contentType?: string;
  fileName?: string;
  status?: "draft" | "published";
}>;

function courseSupplementBase(orgId: string, schoolId: string, courseId: string): string {
  return `/v1/orgs/${encodeURIComponent(orgId)}/schools/${encodeURIComponent(schoolId)}/courses/${encodeURIComponent(courseId)}/supplements`;
}

export async function fetchCourseSupplements(
  orgId: string,
  schoolId: string,
  courseId: string,
  opts?: Readonly<{ kind?: CourseSupplementKind; ghostsOnly?: boolean }>,
): Promise<CourseSupplementListResponseDto> {
  const searchParams: Record<string, string> = {};
  if (opts?.kind) searchParams.kind = opts.kind;
  if (opts?.ghostsOnly) searchParams.ghostsOnly = "true";
  return apiClient.get<CourseSupplementListResponseDto>(courseSupplementBase(orgId, schoolId, courseId), {
    searchParams: Object.keys(searchParams).length ? searchParams : undefined,
  });
}

export async function createCourseSupplement(
  orgId: string,
  schoolId: string,
  courseId: string,
  payload: CourseSupplementWritePayload,
): Promise<CourseSupplementDto> {
  return apiClient.post<CourseSupplementDto>(courseSupplementBase(orgId, schoolId, courseId), {
    json: payload,
  });
}

export async function deleteCourseSupplement(
  orgId: string,
  schoolId: string,
  courseId: string,
  supplementId: string,
): Promise<void> {
  await apiClient.delete(
    `${courseSupplementBase(orgId, schoolId, courseId)}/${encodeURIComponent(supplementId)}`,
  );
}

/* —— Ghost Resources (host-agnostic) —— */

export type GhostHostType = "course" | "class" | "department" | "school";
export type GhostImplementationType = "same_base" | "branch_base";
export type GhostStatus = "open" | "in_progress" | "fulfilled" | "cancelled";
export type GhostNodeRole = "end" | "dependency" | "variant";
export type GhostNodeStatus =
  | "open"
  | "in_progress"
  | "stuck"
  | "submitted"
  | "changes_requested"
  | "approved"
  | "rejected"
  | "merged"
  | "abandoned";

export type GhostRequirementAttachmentDto = Readonly<{
  mediaId: string;
  fileName: string;
}>;

export type GhostNodeDto = Readonly<{
  id: string;
  ghostId: string;
  name: string;
  role: GhostNodeRole;
  isDefault: boolean;
  required: boolean;
  implementationType: GhostImplementationType;
  assigneeUserIds: readonly string[];
  status: GhostNodeStatus;
  blocked: boolean;
  blockedByVariantIds: readonly string[];
  availableInputs: readonly Readonly<Record<string, unknown>>[];
  submissionNote: string | null;
  forkedFromVariantId: string | null;
  workingHeadVersion: number;
  workingHead?: Readonly<Record<string, unknown>>;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}>;

export type GhostEdgeDto = Readonly<{
  id: string;
  ghostId: string;
  fromVariantId: string;
  toVariantId: string;
  createdAt: string;
}>;

export type GhostDto = Readonly<{
  id: string;
  orgId: string;
  schoolId: string;
  hostType: GhostHostType;
  hostWorkspaceItemId: string;
  title: string;
  description: string;
  requirementAttachments: readonly GhostRequirementAttachmentDto[];
  implementationType: GhostImplementationType;
  dueAt: string | null;
  resourceKind: string;
  slotKey: string;
  status: GhostStatus;
  defaultVariantId: string | null;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  promotedResource: Readonly<Record<string, unknown>> | null;
  canFulfill: boolean;
  nodes: readonly GhostNodeDto[];
  edges: readonly GhostEdgeDto[];
}>;

export type GhostListResponseDto = Readonly<{
  items: readonly GhostDto[];
  total: number;
}>;

export type GhostEventDto = Readonly<{
  id: string;
  ghostId: string;
  type: string;
  actorUserId: string;
  meta: Readonly<Record<string, unknown>>;
  createdAt: string;
}>;

export type GhostEventListResponseDto = Readonly<{
  items: readonly GhostEventDto[];
  total: number;
}>;

function ghostBase(orgId: string, schoolId: string): string {
  return `/v1/orgs/${encodeURIComponent(orgId)}/schools/${encodeURIComponent(schoolId)}/ghosts`;
}

export async function fetchSchoolGhosts(
  orgId: string,
  schoolId: string,
  opts?: Readonly<{ hostType?: GhostHostType; hostId?: string; status?: string }>,
): Promise<GhostListResponseDto> {
  const searchParams: Record<string, string> = {};
  if (opts?.hostType) searchParams.hostType = opts.hostType;
  if (opts?.hostId) searchParams.hostId = opts.hostId;
  if (opts?.status) searchParams.status = opts.status;
  return apiClient.get<GhostListResponseDto>(ghostBase(orgId, schoolId), {
    searchParams: Object.keys(searchParams).length ? searchParams : undefined,
  });
}

export async function fetchSchoolGhost(
  orgId: string,
  schoolId: string,
  ghostId: string,
): Promise<GhostDto> {
  return apiClient.get<GhostDto>(`${ghostBase(orgId, schoolId)}/${encodeURIComponent(ghostId)}`);
}

export async function createSchoolGhost(
  orgId: string,
  schoolId: string,
  payload: Readonly<{
    hostType: GhostHostType;
    hostWorkspaceItemId: string;
    title?: string;
    description?: string;
    implementationType?: GhostImplementationType;
    dueAt?: string | null;
    resourceKind?: string;
    slotKey?: string;
    defaultNodeName?: string;
  }>,
): Promise<GhostDto> {
  return apiClient.post<GhostDto>(ghostBase(orgId, schoolId), { json: payload });
}

export async function ensureSchoolGhostExerciseDraft(
  orgId: string,
  schoolId: string,
  ghostId: string,
  variantId?: string | null,
): Promise<GhostDto> {
  const qs =
    variantId && variantId.trim()
      ? `?variant_id=${encodeURIComponent(variantId.trim())}`
      : "";
  return apiClient.post<GhostDto>(
    `${ghostBase(orgId, schoolId)}/${encodeURIComponent(ghostId)}/ensure-exercise-draft${qs}`,
  );
}

export async function ensureSchoolGhostSummaryDraft(
  orgId: string,
  schoolId: string,
  ghostId: string,
  variantId?: string | null,
): Promise<GhostDto> {
  const qs =
    variantId && variantId.trim()
      ? `?variant_id=${encodeURIComponent(variantId.trim())}`
      : "";
  return apiClient.post<GhostDto>(
    `${ghostBase(orgId, schoolId)}/${encodeURIComponent(ghostId)}/ensure-summary-draft${qs}`,
  );
}

export async function updateSchoolGhost(
  orgId: string,
  schoolId: string,
  ghostId: string,
  payload: Readonly<{
    title?: string;
    description?: string;
    implementationType?: GhostImplementationType;
    dueAt?: string | null;
    requirementAttachments?: readonly GhostRequirementAttachmentDto[];
    status?: GhostStatus;
  }>,
): Promise<GhostDto> {
  return apiClient.patch<GhostDto>(`${ghostBase(orgId, schoolId)}/${encodeURIComponent(ghostId)}`, {
    json: payload,
  });
}

export async function createSchoolGhostVariant(
  orgId: string,
  schoolId: string,
  ghostId: string,
  payload: Readonly<{
    name: string;
    role?: GhostNodeRole;
    implementationType?: GhostImplementationType;
    required?: boolean;
    isDefault?: boolean;
    connectFromVariantId?: string | null;
  }>,
): Promise<GhostDto> {
  return apiClient.post<GhostDto>(
    `${ghostBase(orgId, schoolId)}/${encodeURIComponent(ghostId)}/variants`,
    { json: payload },
  );
}

export async function updateSchoolGhostVariant(
  orgId: string,
  schoolId: string,
  ghostId: string,
  variantId: string,
  payload: Readonly<{
    name?: string;
    implementationType?: GhostImplementationType;
    required?: boolean;
    status?: GhostNodeStatus;
    statusNote?: string;
    assigneeUserIds?: readonly string[];
    mediaId?: string;
    fileName?: string;
    previewUrl?: string;
  }>,
): Promise<GhostDto> {
  return apiClient.patch<GhostDto>(
    `${ghostBase(orgId, schoolId)}/${encodeURIComponent(ghostId)}/variants/${encodeURIComponent(variantId)}`,
    { json: payload },
  );
}

export async function submitSchoolGhostVariant(
  orgId: string,
  schoolId: string,
  ghostId: string,
  variantId: string,
  payload?: Readonly<{ note?: string; outputRefs?: readonly Record<string, unknown>[] }>,
): Promise<GhostDto> {
  return apiClient.post<GhostDto>(
    `${ghostBase(orgId, schoolId)}/${encodeURIComponent(ghostId)}/variants/${encodeURIComponent(variantId)}/submit`,
    { json: { note: payload?.note ?? "", outputRefs: payload?.outputRefs ?? [] } },
  );
}

export async function reviewSchoolGhostVariant(
  orgId: string,
  schoolId: string,
  ghostId: string,
  variantId: string,
  payload: Readonly<{
    decision: "approve" | "changes_requested" | "reject";
    note?: string;
  }>,
): Promise<GhostDto> {
  return apiClient.post<GhostDto>(
    `${ghostBase(orgId, schoolId)}/${encodeURIComponent(ghostId)}/variants/${encodeURIComponent(variantId)}/review`,
    { json: payload },
  );
}

export async function createSchoolGhostEdge(
  orgId: string,
  schoolId: string,
  ghostId: string,
  payload: Readonly<{ fromVariantId: string; toVariantId: string }>,
): Promise<GhostDto> {
  return apiClient.post<GhostDto>(
    `${ghostBase(orgId, schoolId)}/${encodeURIComponent(ghostId)}/edges`,
    { json: payload },
  );
}

export async function deleteSchoolGhostEdge(
  orgId: string,
  schoolId: string,
  ghostId: string,
  edgeId: string,
): Promise<GhostDto> {
  return apiClient.delete<GhostDto>(
    `${ghostBase(orgId, schoolId)}/${encodeURIComponent(ghostId)}/edges/${encodeURIComponent(edgeId)}`,
  );
}

export async function fetchSchoolGhostEvents(
  orgId: string,
  schoolId: string,
  ghostId: string,
): Promise<GhostEventListResponseDto> {
  return apiClient.get<GhostEventListResponseDto>(
    `${ghostBase(orgId, schoolId)}/${encodeURIComponent(ghostId)}/events`,
  );
}

export async function fulfillSchoolGhost(
  orgId: string,
  schoolId: string,
  ghostId: string,
  payload?: Readonly<{ endVariantId?: string | null }>,
): Promise<GhostDto> {
  return apiClient.post<GhostDto>(
    `${ghostBase(orgId, schoolId)}/${encodeURIComponent(ghostId)}/fulfill`,
    { json: { endVariantId: payload?.endVariantId ?? null } },
  );
}

export type GhostMyWorkItemDto = Readonly<{
  ghostId: string;
  ghostTitle: string;
  hostType: GhostHostType;
  hostWorkspaceItemId: string;
  variantId: string;
  variantName: string;
  status: GhostNodeStatus;
  blocked: boolean;
  implementationType: GhostImplementationType;
  dueAt: string | null;
}>;

export type GhostMyWorkResponseDto = Readonly<{
  items: readonly GhostMyWorkItemDto[];
  total: number;
}>;

export type GhostOpsTableBootstrapDto = Readonly<{
  instanceId: string;
  definitionId: string;
  alreadyLinked: boolean;
}>;

export async function fetchGhostMyWork(
  orgId: string,
  schoolId: string,
): Promise<GhostMyWorkResponseDto> {
  return apiClient.get<GhostMyWorkResponseDto>(`${ghostBase(orgId, schoolId)}/my-work`);
}

export async function bootstrapGhostOpsTable(
  orgId: string,
  schoolId: string,
  workspaceItemId: string,
): Promise<GhostOpsTableBootstrapDto> {
  return apiClient.post<GhostOpsTableBootstrapDto>(
    `/v1/orgs/${encodeURIComponent(orgId)}/schools/${encodeURIComponent(schoolId)}/workspace/items/${encodeURIComponent(workspaceItemId)}/ghost-ops-table/bootstrap`,
  );
}
/** ################################ /COMPONENT ############################# */
