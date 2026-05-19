import 'package:deltalabs_mobile/features/feed/domain/entities/engagement_result.dart';

abstract final class EngagementResponseModel {
  static EngagementResult fromJson(Map<String, dynamic> json) {
    return EngagementResult(
      count: json['count'] as int? ?? 0,
      active: json['active'] as bool? ?? false,
    );
  }
}

abstract final class ShareResponseModel {
  static ShareResult fromJson(Map<String, dynamic> json) {
    return ShareResult(count: json['count'] as int? ?? 0);
  }
}

abstract final class CommentPostResponseModel {
  static CommentPostResult fromJson(Map<String, dynamic> json) {
    return CommentPostResult(
      commentId: json['comment_id'] as String? ?? json['commentId'] as String? ?? '',
      count: json['count'] as int? ?? 0,
    );
  }
}
