import 'package:deltalabs_mobile/core/network/api_client.dart';
import 'package:deltalabs_mobile/features/features/data/models/feature_model.dart';
import 'package:deltalabs_mobile/features/features/data/models/features_layout_model.dart';
import 'package:dio/dio.dart';

abstract class FeaturesRemoteDataSource {
  Future<List<FeatureModel>> fetchFeatures();

  Future<FeaturesLayoutModel> fetchLayout();

  Future<FeaturesLayoutModel> upsertLayout({
    required List<String> orderKeys,
    required List<String> hiddenKeys,
    required Map<String, String> labels,
  });
}

class FeaturesRemoteDataSourceImpl implements FeaturesRemoteDataSource {
  FeaturesRemoteDataSourceImpl({required this.apiClient});

  final ApiClient apiClient;

  @override
  Future<List<FeatureModel>> fetchFeatures() async {
    final response = await apiClient.get<Map<String, dynamic>>('/features');
    final items = response.data?['items'];
    if (items is! List) return [];
    return items
        .whereType<Map<String, dynamic>>()
        .map(FeatureModel.fromJson)
        .toList();
  }

  @override
  Future<FeaturesLayoutModel> fetchLayout() async {
    final response = await apiClient.get<Map<String, dynamic>>('/features/layout');
    return FeaturesLayoutModel.fromJson(response.data ?? {});
  }

  @override
  Future<FeaturesLayoutModel> upsertLayout({
    required List<String> orderKeys,
    required List<String> hiddenKeys,
    required Map<String, String> labels,
  }) async {
    final body = <String, dynamic>{
      'order_keys': orderKeys,
      'hidden_keys': hiddenKeys,
      'labels': labels,
    };

    Response<Map<String, dynamic>> response;
    try {
      response = await apiClient.post<Map<String, dynamic>>(
        '/features/layout',
        data: body,
      );
    } on DioException catch (e) {
      if (e.response?.statusCode != 405) rethrow;
      response = await apiClient.put<Map<String, dynamic>>(
        '/features/layout',
        data: body,
      );
    }

    return FeaturesLayoutModel.fromJson(response.data ?? {});
  }
}
