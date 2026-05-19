import 'package:deltalabs_mobile/features/feed/domain/entities/feed_item.dart';

/// One page of feed results with cursor metadata.
class FeedPage {
  const FeedPage({
    required this.items,
    required this.hasMore,
    this.nextCursor,
    this.total = 0,
  });

  final List<FeedItem> items;
  final bool hasMore;
  final String? nextCursor;
  final int total;
}
