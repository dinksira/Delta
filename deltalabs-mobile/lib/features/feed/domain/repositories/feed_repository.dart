import 'package:dartz/dartz.dart';

import 'package:deltalabs_mobile/core/error/failures.dart';
import 'package:deltalabs_mobile/core/network/pagination/paginated_response.dart';
import 'package:deltalabs_mobile/features/feed/domain/entities/feed_item.dart';

abstract class FeedRepository {
  /// Fetch the next page of feed items using cursor-based pagination.
  Future<Either<Failure, PaginatedResponse<FeedItem>>> getFeed(
    CursorParams params,
  );

  /// Like or unlike a feed item (optimistic update).
  Future<Either<Failure, void>> toggleLike(String itemId);

  /// Save or unsave a feed item.
  Future<Either<Failure, void>> toggleSave(String itemId);

  /// Record a view event for analytics.
  Future<Either<Failure, void>> recordView(String itemId);
}
