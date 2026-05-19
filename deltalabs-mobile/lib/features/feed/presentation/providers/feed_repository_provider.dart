import 'package:deltalabs_mobile/core/di/service_locator.dart';
import 'package:deltalabs_mobile/core/network/api_client.dart';
import 'package:deltalabs_mobile/features/feed/data/data_sources/feed_remote_data_source.dart';
import 'package:deltalabs_mobile/features/feed/data/repositories/feed_repository_impl.dart';
import 'package:deltalabs_mobile/features/feed/domain/repositories/feed_repository.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'feed_repository_provider.g.dart';

@riverpod
FeedRepository feedRepository(Ref ref) {
  return FeedRepositoryImpl(
    remoteDataSource: FeedRemoteDataSourceImpl(apiClient: sl<ApiClient>()),
  );
}
