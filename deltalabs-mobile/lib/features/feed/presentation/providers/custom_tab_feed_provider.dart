import 'package:deltalabs_mobile/core/network/pagination/paginated_response.dart';
import 'package:deltalabs_mobile/features/feed/data/demo/demo_feed_items.dart';
import 'package:deltalabs_mobile/features/feed/domain/entities/feed_item.dart';
import 'package:deltalabs_mobile/features/feed/domain/entities/feed_query_filters.dart';
import 'package:deltalabs_mobile/features/feed/presentation/providers/custom_feed_tab_provider.dart';
import 'package:deltalabs_mobile/features/feed/presentation/providers/feed_provider.dart';
import 'package:deltalabs_mobile/features/feed/presentation/providers/feed_repository_provider.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'custom_tab_feed_provider.g.dart';

/// Vertical feed for the configured custom tab (filters from `/me/feed/custom-tab`).
@riverpod
class CustomTabFeed extends _$CustomTabFeed {
  FeedQueryFilters get _filters {
    final tab = ref.read(customFeedTabNotifierProvider).value;
    return tab?.filters ?? FeedQueryFilters.empty;
  }

  @override
  FeedState build() {
    ref.listen(customFeedTabNotifierProvider, (prev, next) {
      final prevFilters = prev?.value?.filters;
      final nextFilters = next.value?.filters;
      if (nextFilters != null && nextFilters != prevFilters) {
        Future.microtask(loadInitial);
      }
    });

    final tab = ref.watch(customFeedTabNotifierProvider).value;
    if (tab == null) return const FeedState();

    Future.microtask(loadInitial);
    return const FeedState(isLoading: true);
  }

  FeedItem? _item(String itemId) {
    for (final item in state.items) {
      if (item.id == itemId) return item;
    }
    return null;
  }

  void _updateItem(String itemId, FeedItem Function(FeedItem item) transform) {
    state = state.copyWith(
      items: state.items.map((FeedItem item) {
        if (item.id != itemId) return item;
        return transform(item);
      }).toList(),
    );
  }

  Future<void> loadInitial() async {
    final tab = ref.read(customFeedTabNotifierProvider).value;
    if (tab == null) return;

    state = state.copyWith(isLoading: true, error: null);

    final result = await ref.read(feedRepositoryProvider).getFeed(
          const CursorParams(limit: 12),
          filters: tab.filters,
        );

    result.fold(
      (failure) {
        state = state.copyWith(
          isLoading: false,
          items: demoFeedItems,
          hasMore: false,
          usingDemoData: true,
          error: failure.message,
        );
      },
      (page) {
        state = state.copyWith(
          isLoading: false,
          items: page.items,
          nextCursor: page.nextCursor,
          hasMore: page.hasMore,
          usingDemoData: false,
        );
      },
    );
  }

  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.hasMore || state.nextCursor == null) {
      return;
    }
    state = state.copyWith(isLoadingMore: true);

    final result = await ref.read(feedRepositoryProvider).getFeed(
          CursorParams(limit: 12, cursor: state.nextCursor),
          filters: _filters,
        );

    result.fold(
      (_) => state = state.copyWith(isLoadingMore: false),
      (page) {
        state = state.copyWith(
          isLoadingMore: false,
          items: [...state.items, ...page.items],
          nextCursor: page.nextCursor,
          hasMore: page.hasMore,
        );
      },
    );
  }

  Future<String?> toggleLike(String itemId) async {
    final previous = _item(itemId);
    if (previous == null) return 'Clip not found';

    final optimisticLiked = !previous.isLiked;
    _updateItem(
      itemId,
      (item) => item.copyWith(
        isLiked: optimisticLiked,
        likeCount: optimisticLiked
            ? item.likeCount + 1
            : (item.likeCount > 0 ? item.likeCount - 1 : 0),
      ),
    );

    if (state.usingDemoData) return null;

    final result = await ref.read(feedRepositoryProvider).toggleLike(itemId);
    return result.fold(
      (failure) {
        _updateItem(itemId, (_) => previous);
        return failure.message;
      },
      (engagement) {
        _updateItem(
          itemId,
          (item) => item.copyWith(
            isLiked: engagement.active,
            likeCount: engagement.count,
          ),
        );
        return null;
      },
    );
  }

  Future<String?> toggleSave(String itemId) async {
    final previous = _item(itemId);
    if (previous == null) return 'Clip not found';

    final optimisticSaved = !previous.isSaved;
    _updateItem(itemId, (item) => item.copyWith(isSaved: optimisticSaved));

    if (state.usingDemoData) return null;

    final result = await ref.read(feedRepositoryProvider).toggleSave(itemId);
    return result.fold(
      (failure) {
        _updateItem(itemId, (_) => previous);
        return failure.message;
      },
      (engagement) {
        _updateItem(
          itemId,
          (item) => item.copyWith(isSaved: engagement.active),
        );
        return null;
      },
    );
  }
}
