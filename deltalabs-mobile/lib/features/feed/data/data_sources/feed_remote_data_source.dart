import 'package:deltalabs_mobile/core/network/api_client.dart';
import 'package:deltalabs_mobile/features/feed/data/models/engagement_response_model.dart';
import 'package:deltalabs_mobile/features/feed/data/models/feed_comment_model.dart';
import 'package:deltalabs_mobile/features/feed/data/models/feed_page_model.dart';
import 'package:deltalabs_mobile/features/feed/domain/entities/engagement_result.dart';
import 'package:deltalabs_mobile/features/feed/domain/entities/feed_comment.dart';
import 'package:dio/dio.dart';

abstract class FeedRemoteDataSource {
  Future<FeedPageModel> fetchFeed({
    int limit = 12,
    String? cursor,
    String? contentType,
  });

  Future<EngagementResult> toggleLike(String itemId);

  Future<EngagementResult> toggleSave(String itemId);

  Future<ShareResult> recordShare(String itemId);

  Future<List<FeedComment>> fetchComments(String itemId, {int limit = 50});

  Future<CommentPostResult> postComment(String itemId, String body);
}

class FeedRemoteDataSourceImpl implements FeedRemoteDataSource {
  FeedRemoteDataSourceImpl({required this.apiClient});

  final ApiClient apiClient;

  Options _idempotentPost(String action, String itemId) => Options(
        headers: {
          'Idempotency-Key': '$action-$itemId-${DateTime.now().millisecondsSinceEpoch}',
        },
      );

  @override
  Future<FeedPageModel> fetchFeed({
    int limit = 12,
    String? cursor,
    String? contentType,
  }) async {
    final response = await apiClient.get<Map<String, dynamic>>(
      '/feed',
      queryParameters: {
        'limit': limit,
        if (cursor != null) 'cursor': cursor,
        if (contentType != null) 'content_type': contentType,
      },
    );

    return FeedPageModel.fromJson(response.data ?? {});
  }

  @override
  Future<EngagementResult> toggleLike(String itemId) async {
    final response = await apiClient.post<Map<String, dynamic>>(
      '/feed/$itemId/like',
      options: _idempotentPost('like', itemId),
    );
    return EngagementResponseModel.fromJson(response.data ?? {});
  }

  @override
  Future<EngagementResult> toggleSave(String itemId) async {
    final response = await apiClient.post<Map<String, dynamic>>(
      '/feed/$itemId/save',
      options: _idempotentPost('save', itemId),
    );
    return EngagementResponseModel.fromJson(response.data ?? {});
  }

  @override
  Future<ShareResult> recordShare(String itemId) async {
    final response = await apiClient.post<Map<String, dynamic>>(
      '/feed/$itemId/share',
      options: _idempotentPost('share', itemId),
    );
    return ShareResponseModel.fromJson(response.data ?? {});
  }

  @override
  Future<List<FeedComment>> fetchComments(String itemId, {int limit = 50}) async {
    final response = await apiClient.get<Map<String, dynamic>>(
      '/feed/$itemId/comments',
      queryParameters: {'limit': limit},
    );
    return FeedCommentModel.listFromJson(response.data ?? {});
  }

  @override
  Future<CommentPostResult> postComment(String itemId, String body) async {
    final response = await apiClient.post<Map<String, dynamic>>(
      '/feed/$itemId/comment',
      data: {'body': body},
      options: _idempotentPost('comment', itemId),
    );
    return CommentPostResponseModel.fromJson(response.data ?? {});
  }
}
