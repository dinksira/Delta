import 'package:deltalabs_mobile/core/di/service_locator.dart';
import 'package:deltalabs_mobile/core/network/api_client.dart';
import 'package:deltalabs_mobile/features/workspace/data/models/my_school_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/data_sources/school_remote_data_source.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_class_attendance_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_class_enrollment_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_class_roadmap_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_class_session_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_detail_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_marketplace_item_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_marketplace_page_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_offer_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_org_access_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_workspace_item_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/models/school_hub_summary.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final schoolRemoteDataSourceProvider = Provider<SchoolRemoteDataSource>((ref) {
  return SchoolRemoteDataSource(apiClient: sl<ApiClient>());
});

final myActiveSchoolsProvider = FutureProvider<List<MySchoolModel>>((ref) async {
  final all = await ref.watch(schoolRemoteDataSourceProvider).fetchMySchools();
  return all.where((s) => !s.archived).toList();
});

final myArchivedSchoolsProvider = FutureProvider<List<MySchoolModel>>((ref) async {
  final all = await ref.watch(schoolRemoteDataSourceProvider).fetchMySchools();
  return all.where((s) => s.archived).toList();
});

typedef SchoolOffersQuery = ({String status, String view});

final schoolOffersProvider =
    FutureProvider.family<List<SchoolOfferModel>, SchoolOffersQuery>((ref, query) {
  return ref.read(schoolRemoteDataSourceProvider).fetchOffers(
        status: query.status,
        view: query.view,
      );
});

typedef SchoolMarketplaceQuery = ({String view, String? search, String? status});

final schoolMarketplaceProvider =
    FutureProvider.family<SchoolMarketplacePageModel, SchoolMarketplaceQuery>(
  (ref, query) {
    return ref.read(schoolRemoteDataSourceProvider).fetchMarketplace(
          view: query.view,
          query: query.search,
          status: query.status,
        );
  },
);

/// Live dashboard counts (same APIs as deltalabs-frontend School home).
final schoolHubSummaryProvider = FutureProvider<SchoolHubSummary>((ref) async {
  final ds = ref.read(schoolRemoteDataSourceProvider);
  final schools = await ds.fetchMySchools();
  final active = schools.where((s) => !s.archived).length;
  final archived = schools.where((s) => s.archived).length;

  final pendingOffers = await ds.fetchOffers(status: 'requested', view: 'received');
  final marketplace = await ds.fetchMarketplace(view: 'community', pageSize: 1);

  return SchoolHubSummary(
    activeSchools: active,
    archivedSchools: archived,
    pendingOffers: pendingOffers.length,
    marketplaceListings: marketplace.total,
  );
});

final schoolMarketplaceListingProvider =
    FutureProvider.family<SchoolMarketplaceItemModel, String>((ref, listingId) {
  return ref.read(schoolRemoteDataSourceProvider).fetchMarketplaceListing(listingId);
});

typedef SchoolDealRoomQuery = ({String orgId, String listingId});

final schoolDealRoomOffersProvider =
    FutureProvider.family<List<SchoolOfferModel>, SchoolDealRoomQuery>((ref, query) {
  return ref.read(schoolRemoteDataSourceProvider).fetchMarketplaceListingOffers(
        orgId: query.orgId,
        listingId: query.listingId,
      );
});

typedef SchoolDetailQuery = ({String orgId, String schoolId});

final schoolDetailProvider =
    FutureProvider.family<SchoolDetailModel, SchoolDetailQuery>((ref, query) {
  return ref.read(schoolRemoteDataSourceProvider).fetchSchool(
        orgId: query.orgId,
        schoolId: query.schoolId,
      );
});

final schoolOrgAccessProvider =
    FutureProvider.family<SchoolOrgAccessModel, String>((ref, orgId) {
  return ref.read(schoolRemoteDataSourceProvider).fetchOrgAccess(orgId);
});

typedef SchoolWorkspaceItemsQuery = ({
  String orgId,
  String schoolId,
  String? type,
  String? parentId,
});

final schoolWorkspaceItemsProvider =
    FutureProvider.family<List<SchoolWorkspaceItemModel>, SchoolWorkspaceItemsQuery>(
  (ref, query) {
    return ref.read(schoolRemoteDataSourceProvider).fetchWorkspaceItems(
          orgId: query.orgId,
          schoolId: query.schoolId,
          type: query.type,
          parentId: query.parentId,
        );
  },
);

typedef SchoolWorkspaceItemQuery = ({
  String orgId,
  String schoolId,
  String itemId,
});

final schoolWorkspaceItemProvider =
    FutureProvider.family<SchoolWorkspaceItemModel, SchoolWorkspaceItemQuery>(
  (ref, query) {
    return ref.read(schoolRemoteDataSourceProvider).fetchWorkspaceItem(
          orgId: query.orgId,
          schoolId: query.schoolId,
          itemId: query.itemId,
        );
  },
);

typedef SchoolClassSessionsQuery = ({
  String orgId,
  String schoolId,
  String classWorkspaceItemId,
});

final schoolClassSessionsProvider =
    FutureProvider.family<List<SchoolClassSessionModel>, SchoolClassSessionsQuery>(
  (ref, query) {
    return ref.read(schoolRemoteDataSourceProvider).fetchClassSessions(
          orgId: query.orgId,
          schoolId: query.schoolId,
          classWorkspaceItemId: query.classWorkspaceItemId,
        );
  },
);

typedef SchoolClassEnrollmentsQuery = ({
  String orgId,
  String schoolId,
  String classWorkspaceItemId,
});

final schoolClassEnrollmentsProvider =
    FutureProvider.family<List<SchoolClassEnrollmentModel>, SchoolClassEnrollmentsQuery>(
  (ref, query) {
    return ref.read(schoolRemoteDataSourceProvider).fetchClassEnrollments(
          orgId: query.orgId,
          schoolId: query.schoolId,
          classWorkspaceItemId: query.classWorkspaceItemId,
        );
  },
);

typedef SchoolClassAttendanceQuery = ({
  String orgId,
  String schoolId,
  String classWorkspaceItemId,
});

final schoolClassAttendanceProvider =
    FutureProvider.family<SchoolClassAttendanceStateModel, SchoolClassAttendanceQuery>(
  (ref, query) {
    return ref.read(schoolRemoteDataSourceProvider).fetchClassAttendanceState(
          orgId: query.orgId,
          schoolId: query.schoolId,
          classWorkspaceItemId: query.classWorkspaceItemId,
        );
  },
);

typedef SchoolClassRoadmapQuery = ({
  String orgId,
  String schoolId,
  String classWorkspaceItemId,
});

final schoolClassRoadmapProvider =
    FutureProvider.family<SchoolClassRoadmapModel, SchoolClassRoadmapQuery>(
  (ref, query) {
    return ref.read(schoolRemoteDataSourceProvider).fetchClassRoadmap(
          orgId: query.orgId,
          schoolId: query.schoolId,
          classWorkspaceItemId: query.classWorkspaceItemId,
        );
  },
);

final schoolClassRoadmapResourcesProvider =
    FutureProvider.family<SchoolClassRoadmapResourcesModel, SchoolClassRoadmapQuery>(
  (ref, query) {
    return ref.read(schoolRemoteDataSourceProvider).fetchClassRoadmapResources(
          orgId: query.orgId,
          schoolId: query.schoolId,
          classWorkspaceItemId: query.classWorkspaceItemId,
        );
  },
);
