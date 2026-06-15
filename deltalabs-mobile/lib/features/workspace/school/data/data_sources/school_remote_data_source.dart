import 'dart:typed_data';

import 'package:deltalabs_mobile/core/network/api_client.dart';
import 'package:dio/dio.dart';
import 'package:deltalabs_mobile/features/workspace/data/models/my_school_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_class_enrollment_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_class_session_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_detail_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_marketplace_item_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_marketplace_page_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_offer_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_org_access_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_workspace_item_model.dart';

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
    return _withOrgMembership(orgId, () async {
      final response = await _api.get<Map<String, dynamic>>(
        '/orgs/$orgId/schools/$schoolId',
      );
      return SchoolDetailModel.fromJson(response.data ?? {});
    });
  }

  Future<SchoolDetailModel> updateSchool({
    required String orgId,
    required String schoolId,
    required Map<String, dynamic> payload,
  }) async {
    return _withOrgMembership(orgId, () async {
      final response = await _api.patch<Map<String, dynamic>>(
        '/orgs/$orgId/schools/$schoolId',
        data: payload,
      );
      return SchoolDetailModel.fromJson(response.data ?? {});
    });
  }

  Future<void> setSchoolArchived({
    required String orgId,
    required String schoolId,
    required bool archived,
  }) async {
    await _withOrgMembership(orgId, () async {
      await _api.patch<Map<String, dynamic>>(
        '/orgs/$orgId/schools/$schoolId/archive',
        data: {'archived': archived},
      );
    });
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

  Future<SchoolOrgAccessModel> fetchOrgAccess(String orgId) async {
    return _withOrgMembership(orgId, () async {
      final response = await _api.get<Map<String, dynamic>>('/orgs/$orgId/access');
      return SchoolOrgAccessModel.fromJson(response.data ?? {});
    });
  }

  Future<List<String>> fetchMyOrgIds() async {
    if (_cachedMyOrgIds != null) return _cachedMyOrgIds!;
    final response = await _api.get<Map<String, dynamic>>('/orgs/me');
    final items = response.data?['items'];
    if (items is! List) {
      _cachedMyOrgIds = const [];
      return _cachedMyOrgIds!;
    }
    _cachedMyOrgIds = items
        .whereType<Map<String, dynamic>>()
        .map((item) => (item['id'] ?? '').toString())
        .where((id) => id.isNotEmpty)
        .toList();
    return _cachedMyOrgIds!;
  }

  Future<void> joinOrg(String orgId) async {
    await _api.post<Map<String, dynamic>>('/orgs/$orgId/join');
    _cachedMyOrgIds = null;
  }

  /// School membership (`GET /me/schools`) can exist without org membership.
  /// Org-scoped routes require `POST /orgs/{orgId}/join` first.
  Future<void> ensureOrgMembership(String orgId) async {
    if (orgId.isEmpty) return;
    final orgIds = await fetchMyOrgIds();
    if (orgIds.contains(orgId)) return;
    await joinOrg(orgId);
  }

  Future<List<SchoolWorkspaceItemModel>> fetchWorkspaceItems({
    required String orgId,
    required String schoolId,
    String? type,
    String? parentId,
  }) async {
    return _withOrgMembership(orgId, () async {
      final response = await _api.get<Map<String, dynamic>>(
        '/orgs/$orgId/schools/$schoolId/workspace/items',
        queryParameters: {
          if (type != null && type.isNotEmpty) 'type': type,
          if (parentId != null && parentId.isNotEmpty) 'parentId': parentId,
        },
      );
      final items = response.data?['items'];
      if (items is! List) return [];
      return items
          .whereType<Map<String, dynamic>>()
          .map(SchoolWorkspaceItemModel.fromJson)
          .toList();
    });
  }

  Future<SchoolWorkspaceItemModel> fetchWorkspaceItem({
    required String orgId,
    required String schoolId,
    required String itemId,
  }) async {
    return _withOrgMembership(orgId, () async {
      final response = await _api.get<Map<String, dynamic>>(
        '/orgs/$orgId/schools/$schoolId/workspace/items/$itemId',
      );
      return SchoolWorkspaceItemModel.fromJson(response.data ?? {});
    });
  }

  Future<SchoolWorkspaceItemModel> createWorkspaceItem({
    required String orgId,
    required String schoolId,
    required String type,
    required String title,
    String? description,
    Map<String, dynamic>? metadata,
    String? parentId,
  }) async {
    return _withOrgMembership(orgId, () async {
      final response = await _api.post<Map<String, dynamic>>(
        '/orgs/$orgId/schools/$schoolId/workspace/items',
        data: {
          'type': type,
          'title': title,
          if (description != null && description.isNotEmpty) 'description': description,
          if (metadata != null && metadata.isNotEmpty) 'metadata': metadata,
          if (parentId != null && parentId.isNotEmpty) 'parentId': parentId,
        },
      );
      return SchoolWorkspaceItemModel.fromJson(response.data ?? {});
    });
  }

  Future<SchoolWorkspaceItemModel> updateWorkspaceItem({
    required String orgId,
    required String schoolId,
    required String itemId,
    String? title,
    String? description,
    Map<String, dynamic>? metadata,
  }) async {
    return _withOrgMembership(orgId, () async {
      final response = await _api.patch<Map<String, dynamic>>(
        '/orgs/$orgId/schools/$schoolId/workspace/items/$itemId',
        data: {
          if (title != null) 'title': title,
          if (description != null) 'description': description,
          if (metadata != null) 'metadata': metadata,
        },
      );
      return SchoolWorkspaceItemModel.fromJson(response.data ?? {});
    });
  }

  Future<void> deleteWorkspaceItem({
    required String orgId,
    required String schoolId,
    required String itemId,
  }) async {
    await _withOrgMembership(orgId, () async {
      await _api.delete<Map<String, dynamic>>(
        '/orgs/$orgId/schools/$schoolId/workspace/items/$itemId',
      );
    });
  }

  Future<List<SchoolClassSessionModel>> fetchClassSessions({
    required String orgId,
    required String schoolId,
    required String classWorkspaceItemId,
  }) async {
    return _withOrgMembership(orgId, () async {
      final response = await _api.get<Map<String, dynamic>>(
        '/orgs/$orgId/schools/$schoolId/classes/$classWorkspaceItemId/sessions',
      );
      final items = response.data?['items'];
      if (items is! List) return [];
      return items
          .whereType<Map<String, dynamic>>()
          .map(SchoolClassSessionModel.fromJson)
          .toList();
    });
  }

  Future<SchoolClassSessionModel> createClassSession({
    required String orgId,
    required String schoolId,
    required String classWorkspaceItemId,
    required String title,
    String? description,
    double? weight,
    int? durationMinutes,
    String sessionType = 'virtual',
    String? scheduledAt,
  }) async {
    return _withOrgMembership(orgId, () async {
      final response = await _api.post<Map<String, dynamic>>(
        '/orgs/$orgId/schools/$schoolId/classes/$classWorkspaceItemId/sessions',
        data: {
          'title': title,
          if (description != null && description.isNotEmpty) 'description': description,
          if (weight != null) 'weight': weight,
          if (durationMinutes != null) 'durationMinutes': durationMinutes,
          'sessionType': sessionType,
          if (scheduledAt != null && scheduledAt.isNotEmpty) 'scheduledAt': scheduledAt,
        },
      );
      return SchoolClassSessionModel.fromJson(response.data ?? {});
    });
  }

  Future<SchoolClassSessionModel> updateClassSession({
    required String orgId,
    required String schoolId,
    required String classWorkspaceItemId,
    required String sessionId,
    String? title,
    String? description,
    double? weight,
    int? durationMinutes,
    String? sessionType,
    String? scheduledAt,
    String? status,
  }) async {
    return _withOrgMembership(orgId, () async {
      final response = await _api.patch<Map<String, dynamic>>(
        '/orgs/$orgId/schools/$schoolId/classes/$classWorkspaceItemId/sessions/$sessionId',
        data: {
          if (title != null) 'title': title,
          if (description != null) 'description': description,
          if (weight != null) 'weight': weight,
          if (durationMinutes != null) 'durationMinutes': durationMinutes,
          if (sessionType != null) 'sessionType': sessionType,
          if (scheduledAt != null) 'scheduledAt': scheduledAt,
          if (status != null) 'status': status,
        },
      );
      return SchoolClassSessionModel.fromJson(response.data ?? {});
    });
  }

  Future<void> deleteClassSession({
    required String orgId,
    required String schoolId,
    required String classWorkspaceItemId,
    required String sessionId,
  }) async {
    await _withOrgMembership(orgId, () async {
      await _api.delete<void>(
        '/orgs/$orgId/schools/$schoolId/classes/$classWorkspaceItemId/sessions/$sessionId',
      );
    });
  }

  Future<List<SchoolClassEnrollmentModel>> fetchClassEnrollments({
    required String orgId,
    required String schoolId,
    required String classWorkspaceItemId,
  }) async {
    return _withOrgMembership(orgId, () async {
      final response = await _api.get<Map<String, dynamic>>(
        '/orgs/$orgId/schools/$schoolId/classes/$classWorkspaceItemId/enrollments',
      );
      final items = response.data?['items'];
      if (items is! List) return [];
      return items
          .whereType<Map<String, dynamic>>()
          .map(SchoolClassEnrollmentModel.fromJson)
          .toList();
    });
  }

  Future<SchoolClassEnrollmentModel> enrollClassStudent({
    required String orgId,
    required String schoolId,
    required String classWorkspaceItemId,
    String? userId,
    String? email,
  }) async {
    return _withOrgMembership(orgId, () async {
      final response = await _api.post<Map<String, dynamic>>(
        '/orgs/$orgId/schools/$schoolId/classes/$classWorkspaceItemId/enrollments',
        data: {
          if (userId != null && userId.isNotEmpty) 'userId': userId,
          if (email != null && email.isNotEmpty) 'email': email,
        },
      );
      return SchoolClassEnrollmentModel.fromJson(response.data ?? {});
    });
  }

  Future<void> withdrawClassEnrollment({
    required String orgId,
    required String schoolId,
    required String classWorkspaceItemId,
    required String enrollmentId,
  }) async {
    await _withOrgMembership(orgId, () async {
      await _api.delete<void>(
        '/orgs/$orgId/schools/$schoolId/classes/$classWorkspaceItemId/enrollments/$enrollmentId',
      );
    });
  }

  Future<String> bootstrapClassStudentsTable({
    required String orgId,
    required String schoolId,
    required String classWorkspaceItemId,
  }) async {
    return _withOrgMembership(orgId, () async {
      final response = await _api.post<Map<String, dynamic>>(
        '/orgs/$orgId/schools/$schoolId/classes/$classWorkspaceItemId/students-table/bootstrap',
      );
      final instance = response.data?['instance'];
      if (instance is Map<String, dynamic>) {
        final id = (instance['id'] ?? '').toString();
        if (id.isNotEmpty) return id;
      }
      throw StateError('Students table bootstrap did not return an instance id.');
    });
  }

  List<String>? _cachedMyOrgIds;

  Future<T> _withOrgMembership<T>(String orgId, Future<T> Function() action) async {
    await ensureOrgMembership(orgId);
    try {
      return await action();
    } on DioException catch (error) {
      if (!_isOrgMembershipRequired(error)) rethrow;
      await joinOrg(orgId);
      return action();
    }
  }

  bool _isOrgMembershipRequired(DioException error) {
    if (error.response?.statusCode != 403) return false;
    final data = error.response?.data;
    if (data is Map<String, dynamic>) {
      return data['code'] == 'org_membership_required';
    }
    if (data is Map) {
      return data['code']?.toString() == 'org_membership_required';
    }
    return false;
  }

  Future<String?> fetchFirstOrgId() async {
    final orgIds = await fetchMyOrgIds();
    if (orgIds.isEmpty) return null;
    return orgIds.first;
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
