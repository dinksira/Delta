import 'package:deltalabs_mobile/features/feed/data/models/feed_item_model.dart';
import 'package:deltalabs_mobile/features/feed/domain/entities/feed_item.dart';

/// Cursor-paginated feed response from `GET /feed`.
class FeedPageModel {
  const FeedPageModel({
    required this.items,
    required this.hasMore,
    this.nextCursor,
    this.total = 0,
  });

  final List<FeedItem> items;
  final bool hasMore;
  final String? nextCursor;
  final int total;

  factory FeedPageModel.fromJson(Map<String, dynamic> json) {
    final rawItems = json['items'] as List<dynamic>? ?? [];
    return FeedPageModel(
      items: rawItems
          .whereType<Map<String, dynamic>>()
          .map(FeedItemModel.fromJson)
          .toList(),
      hasMore: json['has_more'] as bool? ?? false,
      nextCursor: json['next_cursor'] as String?,
      total: json['total'] as int? ?? rawItems.length,
    );
  }
}
