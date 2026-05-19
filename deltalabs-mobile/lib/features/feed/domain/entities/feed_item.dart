import 'package:deltalabs_mobile/core/domain/entity.dart';

/// Domain entity for a TikTok-style feed item.
class FeedItem extends Entity {
  const FeedItem({
    required super.id,
    required this.title,
    required this.type,
    required this.authorId,
    required this.authorName,
    this.authorAvatarUrl,
    this.thumbnailUrl,
    this.mediaUrl,
    this.description,
    this.soundLabel,
    this.hashtags = const [],
    this.viewCount = 0,
    this.shareCount = 0,
    this.likeCount = 0,
    this.commentCount = 0,
    this.isLiked = false,
    this.isSaved = false,
    this.duration,
    this.publishedAt,
  });

  final String title;
  final FeedItemType type;
  final String authorId;
  final String authorName;
  final String? authorAvatarUrl;
  final String? thumbnailUrl;
  final String? mediaUrl;
  final String? description;
  /// TikTok-style audio row (from hashtags or track name).
  final String? soundLabel;
  final List<String> hashtags;
  final int viewCount;
  final int shareCount;
  final int likeCount;
  final int commentCount;
  final bool isLiked;
  final bool isSaved;
  final Duration? duration;
  final DateTime? publishedAt;

  @override
  List<Object?> get props => [
        id,
        title,
        type,
        authorId,
        authorName,
        mediaUrl,
        likeCount,
        isLiked,
      ];

  FeedItem copyWith({
    String? id,
    String? title,
    FeedItemType? type,
    String? authorId,
    String? authorName,
    String? authorAvatarUrl,
    String? thumbnailUrl,
    String? mediaUrl,
    String? description,
    String? soundLabel,
    List<String>? hashtags,
    int? viewCount,
    int? shareCount,
    int? likeCount,
    int? commentCount,
    bool? isLiked,
    bool? isSaved,
    Duration? duration,
    DateTime? publishedAt,
  }) {
    return FeedItem(
      id: id ?? this.id,
      title: title ?? this.title,
      type: type ?? this.type,
      authorId: authorId ?? this.authorId,
      authorName: authorName ?? this.authorName,
      authorAvatarUrl: authorAvatarUrl ?? this.authorAvatarUrl,
      thumbnailUrl: thumbnailUrl ?? this.thumbnailUrl,
      mediaUrl: mediaUrl ?? this.mediaUrl,
      description: description ?? this.description,
      soundLabel: soundLabel ?? this.soundLabel,
      hashtags: hashtags ?? this.hashtags,
      viewCount: viewCount ?? this.viewCount,
      shareCount: shareCount ?? this.shareCount,
      likeCount: likeCount ?? this.likeCount,
      commentCount: commentCount ?? this.commentCount,
      isLiked: isLiked ?? this.isLiked,
      isSaved: isSaved ?? this.isSaved,
      duration: duration ?? this.duration,
      publishedAt: publishedAt ?? this.publishedAt,
    );
  }
}

enum FeedItemType {
  video,
  shortClip,
  article,
  quiz,
  announcement,
  liveClass,
}
