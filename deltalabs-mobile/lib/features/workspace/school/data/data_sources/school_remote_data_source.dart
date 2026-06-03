import 'dart:typed_data';

import 'package:deltalabs_mobile/core/network/api_client.dart';
import 'package:dio/dio.dart';
import 'package:deltalabs_mobile/features/workspace/data/models/my_school_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_detail_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_marketplace_item_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_marketplace_page_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_offer_model.dart';

class SchoolRemoteDataSource {
  SchoolRemoteDataSource({required ApiClient apiClient}) : _api = apiClient;

  final ApiClient _api;

  Future<List<MySchoolModel>> fetchMySchools() async {
    final response = await _api.get<Map<String, dynamic>>('/me/schools');
    final items = response.data?['items'];
    if (items is! List) return [];
    return items
        .whereType<Map<String, dynamic>>()
        .map(MySchoolModel.fromJson)
        .toList();
  }

  Future<SchoolDetailModel> fetchSchool({
    required String orgId,
    required String schoolId,
  }) async {
    final response = await _api.get<Map<String, dynamic>>(
      '/orgs/$orgId/schools/$schoolId',
    );
    return SchoolDetailModel.fromJson(response.data ?? {});
  }

  Future<SchoolDetailModel> updateSchool({
    required String orgId,
    required String schoolId,
    required Map<String, dynamic> payload,
  }) async {
    final response = await _api.patch<Map<String, dynamic>>(
      '/orgs/$orgId/schools/$schoolId',
      data: payload,
    );
    return SchoolDetailModel.fromJson(response.data ?? {});
  }

  Future<void> setSchoolArchived({
    required String orgId,
    required String schoolId,
    required bool archived,
  }) async {
    await _api.patch<Map<String, dynamic>>(
      '/orgs/$orgId/schools/$schoolId/archive',
      data: {'archived': archived},
    );
  }

  Future<List<SchoolOfferModel>> fetchOffers({
    required String status,
    required String view,
  }) async {
    final response = await _api.get<Map<String, dynamic>>(
      '/schools/offers',
      queryParameters: {'status': status, 'view': view},
    );
    final items = response.data?['items'];
    if (items is! List) return [];
    return items
        .whereType<Map<String, dynamic>>()
        .map(SchoolOfferModel.fromJson)
        .toList();
  }

  Future<SchoolOfferModel> updateOfferStatus({
    required String orgId,
    required String offerId,
    required String status,
    Map<String, dynamic>? amendmentData,
  }) async {
    final response = await _api.patch<Map<String, dynamic>>(
      '/orgs/$orgId/schools/offers/$offerId/status',
      data: {
        'status': status,
        if (amendmentData != null) 'amendmentData': amendmentData,
      },
    );
    return SchoolOfferModel.fromJson(response.data ?? {});
  }

  /// Same contract as web `fetchGlobalSchoolMarketplace`.
  Future<SchoolMarketplacePageModel> fetchMarketplace({
    required String view,
    String? query,
    String? status,
    int page = 1,
    int pageSize = 20,
    String sortBy = 'created_at',
    String sortDirection = 'desc',
  }) async {
    final response = await _api.get<Map<String, dynamic>>(
      '/schools/marketplace',
      queryParameters: {
        'view': view,
        if (query != null && query.isNotEmpty) 'q': query,
        if (status != null && status.isNotEmpty) 'status': status,
        'page': page,
        'pageSize': pageSize,
        'sortBy': sortBy,
        'sortDirection': sortDirection,
      },
    );
    return SchoolMarketplacePageModel.fromJson(response.data ?? {});
  }

  Future<SchoolMarketplaceItemModel> fetchMarketplaceListing(String listingId) async {
    final response = await _api.get<Map<String, dynamic>>(
      '/schools/marketplace/$listingId',
    );
    return SchoolMarketplaceItemModel.fromJson(response.data ?? {});
  }

  Future<SchoolMarketplaceItemModel> createMarketplaceListing({
    required String orgId,
    required String schoolId,
    required String title,
    required String description,
    required double price,
    String currency = 'USD',
  }) async {
    final response = await _api.post<Map<String, dynamic>>(
      '/orgs/$orgId/schools/marketplace',
      data: {
        'school_id': schoolId,
        'title': title,
        'description': description,
        'price': price,
        'currency': currency,
      },
    );
    return SchoolMarketplaceItemModel.fromJson(response.data ?? {});
  }

  Future<SchoolMarketplaceItemModel> updateMarketplaceListing({
    required String listingId,
    String? title,
    String? description,
    double? price,
    String? currency,
  }) async {
    final response = await _api.patch<Map<String, dynamic>>(
      '/schools/marketplace/$listingId',
      data: {
        if (title != null) 'title': title,
        if (description != null) 'description': description,
        if (price != null) 'price': price,
        if (currency != null) 'currency': currency,
      },
    );
    return SchoolMarketplaceItemModel.fromJson(response.data ?? {});
  }

  Future<SchoolMarketplaceItemModel> withdrawMarketplaceListing(String listingId) async {
    final response = await _api.post<Map<String, dynamic>>(
      '/schools/marketplace/$listingId/withdraw',
    );
    return SchoolMarketplaceItemModel.fromJson(response.data ?? {});
  }

  Future<void> deleteMarketplaceListing(String listingId) async {
    await _api.delete<Map<String, dynamic>>('/schools/marketplace/$listingId');
  }

  Future<SchoolOfferModel> placeMarketplaceBid({
    required String listingId,
    required double offeredPrice,
    String offeredCurrency = 'USD',
    String? note,
  }) async {
    final response = await _api.post<Map<String, dynamic>>(
      '/schools/marketplace/bid',
      data: {
        'listing_id': listingId,
        'offered_price': offeredPrice,
        'offered_currency': offeredCurrency,
        if (note != null && note.trim().isNotEmpty) 'note': note.trim(),
      },
    );
    return SchoolOfferModel.fromJson(response.data ?? {});
  }

  Future<SchoolOfferModel> buyMarketplaceListing(String listingId) async {
    final response = await _api.post<Map<String, dynamic>>(
      '/schools/marketplace/buy',
      data: {'listing_id': listingId},
    );
    return SchoolOfferModel.fromJson(response.data ?? {});
  }

  Future<SchoolOfferModel> withdrawMarketplaceBid(String offerId) async {
    final response = await _api.post<Map<String, dynamic>>(
      '/schools/marketplace/bids/$offerId/withdraw',
    );
    return SchoolOfferModel.fromJson(response.data ?? {});
  }

  Future<List<SchoolOfferModel>> fetchMarketplaceListingOffers({
    required String orgId,
    required String listingId,
  }) async {
    final response = await _api.get<Map<String, dynamic>>(
      '/orgs/$orgId/schools/marketplace/$listingId/offers',
    );
    final items = response.data?['items'];
    if (items is! List) return [];
    return items
        .whereType<Map<String, dynamic>>()
        .map(SchoolOfferModel.fromJson)
        .toList();
  }

  Future<SchoolOfferModel> shortlistOffer({
    required String orgId,
    required String offerId,
  }) async {
    final response = await _api.post<Map<String, dynamic>>(
      '/orgs/$orgId/schools/offers/$offerId/shortlist',
    );
    return SchoolOfferModel.fromJson(response.data ?? {});
  }

  Future<SchoolOfferModel> unshortlistOffer({
    required String orgId,
    required String offerId,
  }) async {
    final response = await _api.post<Map<String, dynamic>>(
      '/orgs/$orgId/schools/offers/$offerId/unshortlist',
    );
    return SchoolOfferModel.fromJson(response.data ?? {});
  }

  Future<String?> fetchFirstOrgId() async {
    final response = await _api.get<Map<String, dynamic>>('/orgs/me');
    final items = response.data?['items'];
    if (items is! List || items.isEmpty) return null;
    final first = items.first;
    if (first is Map<String, dynamic>) {
      return (first['id'] ?? '').toString();
    }
    return null;
  }

  Future<Map<String, dynamic>> createSchoolForMe(Map<String, dynamic> payload) async {
    final response = await _api.post<Map<String, dynamic>>(
      '/schools',
      data: payload,
    );
    return response.data ?? {};
  }

  Future<String> uploadSchoolDocumentFile({
    required String orgId,
    required String filename,
    required String contentType,
    required Uint8List bytes,
  }) async {
    final intentResponse = await _api.post<Map<String, dynamic>>(
      '/orgs/$orgId/media/upload-intent',
      data: {
        'filename': filename,
        'content_type': contentType,
        'file_size_bytes': bytes.length,
        'caption': 'School document',
        'hashtags': <String>[],
        'visibility': 'org',
        'publish_to_feed': false,
      },
    );
    final data = intentResponse.data ?? {};
    final uploadUrl = data['uploadUrl'] as String? ?? data['upload_url'] as String?;
    final mediaId = data['mediaId'] as String? ?? data['media_id'] as String?;
    if (uploadUrl == null || mediaId == null) {
      throw Exception('Invalid upload intent response');
    }

    final plainDio = Dio();
    final uploadRes = await plainDio.put<void>(
      uploadUrl,
      data: bytes,
      options: Options(
        headers: {'Content-Type': contentType},
        validateStatus: (s) => s != null && s >= 200 && s < 300,
      ),
    );
    if (uploadRes.statusCode == null || uploadRes.statusCode! >= 300) {
      throw Exception('Failed to upload document file');
    }
    return 'media://$mediaId';
  }
}
