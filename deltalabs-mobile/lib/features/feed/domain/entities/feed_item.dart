import 'package:freezed_annotation/freezed_annotation.dart';

import '../../../../core/domain/entity.dart';

part 'feed_item.freezed.dart';

/// Domain entity for a TikTok-style feed item.
@freezed
abstract class FeedItem with _$FeedItem implements Entity {
  const factory FeedItem({
    required String id,
    required String title,
    required FeedItemType type,
    required String authorId,
    required String authorName,
    String? authorAvatarUrl,
    String? thumbnailUrl,
    String? mediaUrl,
    String? description,
    @Default(0) int viewCount,
    @Default(0) int likeCount,
    @Default(0) int commentCount,
    @Default(false) bool isLiked,
    @Default(false) bool isSaved,
    Duration? duration,
    DateTime? publishedAt,
  }) = _FeedItem;

  const FeedItem._();
}

enum FeedItemType {
  video,
  shortClip,
  article,
  quiz,
  announcement,
  liveClass,
}
