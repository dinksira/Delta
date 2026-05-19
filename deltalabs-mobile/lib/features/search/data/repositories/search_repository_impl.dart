import 'package:deltalabs_mobile/features/search/data/data_sources/search_remote_data_source.dart';
import 'package:deltalabs_mobile/features/search/data/models/global_search_response.dart';

class SearchRepositoryImpl {
  SearchRepositoryImpl({required this.remoteDataSource});

  final SearchRemoteDataSource remoteDataSource;

  Future<GlobalSearchResponse> globalSearch({
    required String q,
    String tab = 'top',
    int limit = 24,
  }) {
    return remoteDataSource.globalSearch(q: q, tab: tab, limit: limit);
  }
}
