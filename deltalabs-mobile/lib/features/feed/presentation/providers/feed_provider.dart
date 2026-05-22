import 'package:deltalabs_mobile/core/network/pagination/paginated_response.dart';
import 'package:deltalabs_mobile/features/feed/data/demo/demo_feed_items.dart';
import 'package:deltalabs_mobile/features/feed/domain/entities/feed_item.dart';
import 'package:deltalabs_mobile/features/feed/presentation/providers/feed_repository_provider.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'feed_provider.g.dart';

/// Feed state for vertical infinite scroll.
class FeedState {
  const FeedState({
    this.items = const [],
    this.nextCursor,
    this.isLoading = false,
    this.isLoadingMore = false,
    this.hasMore = true,
    this.error,
    this.usingDemoData = false,
  });

  final List<FeedItem> items;
  final String? nextCursor;
  final bool isLoading;
  final bool isLoadingMore;
  final bool hasMore;
  final Object? error;
  final bool usingDemoData;

  FeedState copyWith({
    List<FeedItem>? items,
    String? nextCursor,
    bool? isLoading,
    bool? isLoadingMore,
    bool? hasMore,
    Object? error,
    bool? usingDemoData,
  }) {
    return FeedState(
      items: items ?? this.items,
      nextCursor: nextCursor ?? this.nextCursor,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      hasMore: hasMore ?? this.hasMore,
      error: error,
      usingDemoData: usingDemoData ?? this.usingDemoData,
    );
  }
}

@riverpod
class FeedNotifier extends _$FeedNotifier {
  @override
  FeedState build() {
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
      items: state.items.map((item) {
        if (item.id != itemId) return item;
        return transform(item);
      }).toList(),
    );
  }

  Future<void> loadInitial() async {
    if (state.isLoading && state.items.isNotEmpty) return;
    state = state.copyWith(isLoading: true, error: null);

    final result = await ref.read(feedRepositoryProvider).getFeed(
          const CursorParams(limit: 12),
          defaultContentType: 'video',
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
        if (page.items.isEmpty) {
          state = state.copyWith(
            isLoading: false,
            items: demoFeedItems,
            hasMore: false,
            usingDemoData: true,
          );
          return;
        }
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
    if (state.isLoadingMore || !state.hasMore || state.usingDemoData) return;
    state = state.copyWith(isLoadingMore: true);

    final result = await ref.read(feedRepositoryProvider).getFeed(
          CursorParams(cursor: state.nextCursor, limit: 12),
          defaultContentType: 'video',
        );

    result.fold(
      (failure) => state = state.copyWith(isLoadingMore: false, error: failure.message),
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

  Future<void> refresh() async {
    state = const FeedState(isLoading: true);
    await loadInitial();
  }

  /// Optimistic like with API reconcile (TikTok-style instant UI).
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

  /// Optimistic save/bookmark toggle.
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

  /// Records a share on the server (after user picks a channel).
  Future<String?> recordShare(String itemId) async {
    if (state.usingDemoData) {
      _updateItem(
        itemId,
        (item) => item.copyWith(shareCount: item.shareCount + 1),
      );
      return null;
    }

    final result = await ref.read(feedRepositoryProvider).recordShare(itemId);
    return result.fold(
      (failure) => failure.message,
      (share) {
        _updateItem(itemId, (item) => item.copyWith(shareCount: share.count));
        return null;
      },
    );
  }

  void setCommentCount(String itemId, int count) {
    _updateItem(itemId, (item) => item.copyWith(commentCount: count));
  }

  FeedItem? itemById(String itemId) => _item(itemId);
}
