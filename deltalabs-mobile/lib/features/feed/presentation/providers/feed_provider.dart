import 'package:deltalabs_mobile/features/feed/domain/entities/feed_item.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'feed_provider.g.dart';

/// Feed state for infinite scroll pagination.
class FeedState {
  const FeedState({
    this.items = const [],
    this.nextCursor,
    this.isLoading = false,
    this.isLoadingMore = false,
    this.hasMore = true,
    this.error,
  });

  final List<FeedItem> items;
  final String? nextCursor;
  final bool isLoading;
  final bool isLoadingMore;
  final bool hasMore;
  final Object? error;

  FeedState copyWith({
    List<FeedItem>? items,
    String? nextCursor,
    bool? isLoading,
    bool? isLoadingMore,
    bool? hasMore,
    Object? error,
  }) =>
      FeedState(
        items: items ?? this.items,
        nextCursor: nextCursor ?? this.nextCursor,
        isLoading: isLoading ?? this.isLoading,
        isLoadingMore: isLoadingMore ?? this.isLoadingMore,
        hasMore: hasMore ?? this.hasMore,
        error: error ?? this.error,
      );
}

/// Feed notifier — manages infinite scroll state with cursor pagination.
/// TODO: Wire up FeedRepository once data layer is implemented.
@riverpod
class FeedNotifier extends _$FeedNotifier {
  @override
  FeedState build() {
    return const FeedState();
  }

  Future<void> loadInitial() async {
    if (state.isLoading) return;
    state = state.copyWith(isLoading: true);

    // TODO: Call repository
    // final result = await ref.read(feedRepositoryProvider).getFeed(
    //   const CursorParams(),
    // );
    // result.fold(
    //   (failure) => state = state.copyWith(isLoading: false, error: failure),
    //   (page) => state = state.copyWith(
    //     isLoading: false,
    //     items: page.data,
    //     nextCursor: page.meta.hasNextPage ? 'next_cursor' : null,
    //     hasMore: page.meta.hasNextPage,
    //   ),
    // );

    // Placeholder
    await Future<void>.delayed(const Duration(milliseconds: 500));
    state = state.copyWith(isLoading: false, items: []);
  }

  Future<void> loadMore() async {
    if (state.isLoadingMore || !state.hasMore) return;
    state = state.copyWith(isLoadingMore: true);

    // TODO: Call repository with nextCursor
    await Future<void>.delayed(const Duration(milliseconds: 500));
    state = state.copyWith(isLoadingMore: false, hasMore: false);
  }

  Future<void> refresh() async {
    state = const FeedState();
    await loadInitial();
  }
}
