import 'package:deltalabs_mobile/core/network/api_client.dart';
import 'package:deltalabs_mobile/features/feed/data/models/feed_custom_tab_model.dart';
import 'package:deltalabs_mobile/features/feed/domain/entities/feed_query_filters.dart';
import 'package:dio/dio.dart';

class FeedCustomTabRemoteDataSource {
  FeedCustomTabRemoteDataSource({required this.apiClient});

  final ApiClient apiClient;

  Future<FeedCustomTabModel?> fetch() async {
    try {
      final response = await apiClient.get<Map<String, dynamic>>('/me/feed/custom-tab');
      return FeedCustomTabModel.fromJson(response.data ?? {});
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) return null;
      rethrow;
    }
  }

  Future<FeedCustomTabModel> upsert({
    required String label,
    required FeedQueryFilters filters,
  }) async {
    final body = FeedCustomTabModel(
      label: label,
      filters: filters,
    ).toUpsertJson(label, filters);

    Response<Map<String, dynamic>> response;
    try {
      response = await apiClient.put<Map<String, dynamic>>(
        '/me/feed/custom-tab',
        data: body,
      );
    } on DioException catch (e) {
      if (e.response?.statusCode != 405) rethrow;
      response = await apiClient.post<Map<String, dynamic>>(
        '/me/feed/custom-tab',
        data: body,
      );
    }

    return FeedCustomTabModel.fromJson(response.data ?? {});
  }
}
