import 'package:deltalabs_mobile/features/feed/domain/entities/feed_comment.dart';

abstract final class FeedCommentModel {
  static FeedComment fromJson(Map<String, dynamic> json) {
    return FeedComment(
      id: json['id'] as String,
      userId: json['userId'] as String? ?? json['user_id'] as String? ?? '',
      userName: json['userName'] as String? ?? json['user_name'] as String? ?? 'User',
      body: json['body'] as String? ?? '',
      createdAt: DateTime.tryParse(json['createdAt'] as String? ?? json['created_at'] as String? ?? '') ??
          DateTime.now(),
    );
  }

  static List<FeedComment> listFromJson(Map<String, dynamic> json) {
    final raw = json['items'];
    if (raw is! List) return const [];
    return raw
        .whereType<Map<String, dynamic>>()
        .map(FeedCommentModel.fromJson)
        .toList();
  }
}
