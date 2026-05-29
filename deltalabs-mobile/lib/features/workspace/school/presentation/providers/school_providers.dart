import 'package:deltalabs_mobile/core/di/service_locator.dart';
import 'package:deltalabs_mobile/core/network/api_client.dart';
import 'package:deltalabs_mobile/features/workspace/data/models/my_school_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/data_sources/school_remote_data_source.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_detail_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_marketplace_item_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_marketplace_page_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_offer_model.dart';
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

typedef SchoolMarketplaceQuery = ({String view, String? search});

final schoolMarketplaceProvider =
    FutureProvider.family<SchoolMarketplacePageModel, SchoolMarketplaceQuery>(
  (ref, query) {
    return ref.read(schoolRemoteDataSourceProvider).fetchMarketplace(
          view: query.view,
          query: query.search,
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

typedef SchoolDetailQuery = ({String orgId, String schoolId});

final schoolDetailProvider =
    FutureProvider.family<SchoolDetailModel, SchoolDetailQuery>((ref, query) {
  return ref.read(schoolRemoteDataSourceProvider).fetchSchool(
        orgId: query.orgId,
        schoolId: query.schoolId,
      );
});
