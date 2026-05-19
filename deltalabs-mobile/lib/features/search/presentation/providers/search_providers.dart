import 'package:deltalabs_mobile/core/di/service_locator.dart';
import 'package:deltalabs_mobile/core/network/api_client.dart';
import 'package:deltalabs_mobile/features/search/data/data_sources/search_remote_data_source.dart';
import 'package:deltalabs_mobile/features/search/data/models/global_search_response.dart';
import 'package:deltalabs_mobile/features/search/data/repositories/search_repository_impl.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'search_providers.g.dart';

enum SearchResultsTab { top, users }

@riverpod
SearchRepositoryImpl searchRepository(Ref ref) {
  return SearchRepositoryImpl(
    remoteDataSource: SearchRemoteDataSourceImpl(apiClient: sl<ApiClient>()),
  );
}

@Riverpod(keepAlive: true)
class SearchHistory extends _$SearchHistory {
  @override
  List<String> build() => [];

  void add(String raw) {
    final q = raw.trim();
    if (q.isEmpty) return;
    final next = [
      q,
      ...state.where((e) => e.toLowerCase() != q.toLowerCase()),
    ].take(12).toList();
    state = next;
  }

  void remove(String q) {
    state = state.where((e) => e != q).toList();
  }
}

@riverpod
class ActiveSearch extends _$ActiveSearch {
  @override
  ({String q, SearchResultsTab tab}) build() => (q: '', tab: SearchResultsTab.top);

  void setQuery(String q) => state = (q: q.trim(), tab: state.tab);

  void setTab(SearchResultsTab tab) => state = (q: state.q, tab: tab);
}

@riverpod
Future<GlobalSearchResponse?> searchResults(Ref ref) async {
  final active = ref.watch(activeSearchProvider);
  final q = active.q;
  if (q.isEmpty) return null;

  final tabKey = active.tab == SearchResultsTab.users ? 'users' : 'top';
  return ref.watch(searchRepositoryProvider).globalSearch(q: q, tab: tabKey);
}
