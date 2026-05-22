import 'package:deltalabs_mobile/core/di/service_locator.dart';
import 'package:deltalabs_mobile/core/network/api_client.dart';
import 'package:deltalabs_mobile/features/feed/data/data_sources/feed_custom_tab_remote_data_source.dart';
import 'package:deltalabs_mobile/features/feed/domain/entities/feed_custom_tab.dart';
import 'package:deltalabs_mobile/features/feed/domain/entities/feed_query_filters.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final feedCustomTabDataSourceProvider = Provider<FeedCustomTabRemoteDataSource>(
  (ref) => FeedCustomTabRemoteDataSource(apiClient: sl<ApiClient>()),
);

final customFeedTabProvider = FutureProvider<FeedCustomTab?>((ref) async {
  final model = await ref.read(feedCustomTabDataSourceProvider).fetch();
  return model?.toEntity();
});

final customFeedTabLabelProvider = Provider<String?>((ref) {
  return ref.watch(customFeedTabProvider).value?.label;
});

class CustomFeedTabNotifier extends Notifier<AsyncValue<FeedCustomTab?>> {
  FeedCustomTabRemoteDataSource get _remote =>
      ref.read(feedCustomTabDataSourceProvider);

  @override
  AsyncValue<FeedCustomTab?> build() {
    Future.microtask(_load);
    return const AsyncValue.loading();
  }

  Future<void> _load() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final model = await _remote.fetch();
      return model?.toEntity();
    });
  }

  Future<void> reload() => _load();

  Future<void> save({
    required String label,
    required FeedQueryFilters filters,
  }) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final model = await _remote.upsert(label: label, filters: filters);
      return model.toEntity();
    });
    ref.invalidate(customFeedTabProvider);
  }
}

final customFeedTabNotifierProvider =
    NotifierProvider<CustomFeedTabNotifier, AsyncValue<FeedCustomTab?>>(
  CustomFeedTabNotifier.new,
);
