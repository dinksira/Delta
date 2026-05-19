import 'package:dartz/dartz.dart';
import 'package:deltalabs_mobile/core/error/exceptions.dart';
import 'package:deltalabs_mobile/core/error/failures.dart';
import 'package:deltalabs_mobile/core/network/pagination/paginated_response.dart';
import 'package:deltalabs_mobile/features/feed/data/data_sources/feed_remote_data_source.dart';
import 'package:deltalabs_mobile/features/feed/domain/entities/engagement_result.dart';
import 'package:deltalabs_mobile/features/feed/domain/entities/feed_comment.dart';
import 'package:deltalabs_mobile/features/feed/domain/entities/feed_page.dart';
import 'package:deltalabs_mobile/features/feed/domain/repositories/feed_repository.dart';
import 'package:dio/dio.dart';

class FeedRepositoryImpl implements FeedRepository {
  FeedRepositoryImpl({required this.remoteDataSource});

  final FeedRemoteDataSource remoteDataSource;

  @override
  Future<Either<Failure, FeedPage>> getFeed(CursorParams params) async {
    try {
      final page = await remoteDataSource.fetchFeed(
        limit: params.limit,
        cursor: params.cursor,
        contentType: 'video',
      );

      return Right(
        FeedPage(
          items: page.items,
          hasMore: page.hasMore,
          nextCursor: page.nextCursor,
          total: page.total,
        ),
      );
    } catch (e) {
      return Left(_mapError(e));
    }
  }

  @override
  Future<Either<Failure, EngagementResult>> toggleLike(String itemId) async {
    try {
      return Right(await remoteDataSource.toggleLike(itemId));
    } catch (e) {
      return Left(_mapError(e));
    }
  }

  @override
  Future<Either<Failure, EngagementResult>> toggleSave(String itemId) async {
    try {
      return Right(await remoteDataSource.toggleSave(itemId));
    } catch (e) {
      return Left(_mapError(e));
    }
  }

  @override
  Future<Either<Failure, ShareResult>> recordShare(String itemId) async {
    try {
      return Right(await remoteDataSource.recordShare(itemId));
    } catch (e) {
      return Left(_mapError(e));
    }
  }

  @override
  Future<Either<Failure, List<FeedComment>>> getComments(
    String itemId, {
    int limit = 50,
  }) async {
    try {
      return Right(await remoteDataSource.fetchComments(itemId, limit: limit));
    } catch (e) {
      return Left(_mapError(e));
    }
  }

  @override
  Future<Either<Failure, CommentPostResult>> postComment(
    String itemId,
    String body,
  ) async {
    try {
      return Right(await remoteDataSource.postComment(itemId, body));
    } catch (e) {
      return Left(_mapError(e));
    }
  }

  @override
  Future<Either<Failure, void>> recordView(String itemId) async {
    return const Right(null);
  }

  Failure _mapError(Object e) {
    if (e is DioException) {
      final status = e.response?.statusCode;
      final data = e.response?.data;
      String message = e.message ?? 'Request failed';
      String? code;
      if (data is Map<String, dynamic>) {
        message = data['message'] as String? ?? message;
        code = data['code'] as String?;
      }
      if (status == 401) {
        return UnauthorizedFailure(message: message, code: code);
      }
      return ServerFailure(message: message, statusCode: status, code: code);
    }
    if (e is AppException) {
      return ServerFailure(message: e.message, code: e.code);
    }
    return ServerFailure(message: e.toString());
  }
}
