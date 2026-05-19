import 'package:deltalabs_mobile/core/network/api_client.dart';
import 'package:deltalabs_mobile/features/feed/data/models/feed_item_model.dart';
import 'package:deltalabs_mobile/features/feed/domain/entities/feed_item.dart';
import 'package:deltalabs_mobile/features/search/data/models/global_search_response.dart';
import 'package:deltalabs_mobile/features/search/domain/entities/search_user_hit.dart';

abstract class SearchRemoteDataSource {
  Future<GlobalSearchResponse> globalSearch({
    required String q,
    String tab = 'top',
    int limit = 24,
  });
}

class SearchRemoteDataSourceImpl implements SearchRemoteDataSource {
  SearchRemoteDataSourceImpl({required this.apiClient});

  final ApiClient apiClient;

  @override
  Future<GlobalSearchResponse> globalSearch({
    required String q,
    String tab = 'top',
    int limit = 24,
  }) async {
    final response = await apiClient.get<Map<String, dynamic>>(
      '/search',
      queryParameters: {
        'q': q,
        'tab': tab,
        'limit': limit,
      },
    );

    final data = response.data ?? {};
    final usersRaw = data['users'] as List<dynamic>? ?? [];

    List<FeedItem> clipsFrom(String key) {
      final raw = data[key] as List<dynamic>? ?? [];
      return raw
          .whereType<Map<String, dynamic>>()
          .map(FeedItemModel.fromJson)
          .toList();
    }

    return GlobalSearchResponse(
      q: data['q'] as String? ?? q,
      tab: data['tab'] as String? ?? tab,
      users: usersRaw
          .whereType<Map<String, dynamic>>()
          .map(
            (u) => SearchUserHit(
              id: u['id'] as String,
              username: u['username'] as String,
              relevance: (u['relevance'] as num?)?.toDouble() ?? 0,
            ),
          )
          .toList(),
      clips: [
        ...clipsFrom('videos'),
        ...clipsFrom('audio'),
        ...clipsFrom('simulations'),
      ],
    );
  }
}
