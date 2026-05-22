import 'package:dartz/dartz.dart';

import 'package:deltalabs_mobile/core/error/failures.dart';
import 'package:deltalabs_mobile/core/network/pagination/paginated_response.dart';
import 'package:deltalabs_mobile/features/feed/domain/entities/engagement_result.dart';
import 'package:deltalabs_mobile/features/feed/domain/entities/feed_comment.dart';
import 'package:deltalabs_mobile/features/feed/domain/entities/feed_page.dart';
import 'package:deltalabs_mobile/features/feed/domain/entities/feed_query_filters.dart';

abstract class FeedRepository {
  Future<Either<Failure, FeedPage>> getFeed(
    CursorParams params, {
    FeedQueryFilters filters = FeedQueryFilters.empty,
    String? defaultContentType,
  });

  Future<Either<Failure, EngagementResult>> toggleLike(String itemId);

  Future<Either<Failure, EngagementResult>> toggleSave(String itemId);

  Future<Either<Failure, ShareResult>> recordShare(String itemId);

  Future<Either<Failure, List<FeedComment>>> getComments(
    String itemId, {
    int limit = 50,
  });

  Future<Either<Failure, CommentPostResult>> postComment(
    String itemId,
    String body,
  );

  Future<Either<Failure, void>> recordView(String itemId);
}
