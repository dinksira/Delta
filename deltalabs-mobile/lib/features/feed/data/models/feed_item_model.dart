import 'package:deltalabs_mobile/features/feed/data/utils/feed_media_url.dart';
import 'package:deltalabs_mobile/features/feed/domain/entities/feed_item.dart';

/// Maps API `FeedItemPublic` payloads to [FeedItem].
class FeedItemModel {
  FeedItemModel._();

  static FeedItem fromJson(Map<String, dynamic> json) {
    final durationS = json['durationS'] as int? ?? json['duration_s'] as int? ?? 0;
    final contentType = (json['contentType'] as String? ?? json['content_type'] as String? ?? 'video')
        .toLowerCase();
    final type = contentType == 'audio'
        ? FeedItemType.shortClip
        : FeedItemType.video;

    return FeedItem(
      id: json['id'] as String,
      title: _caption(json),
      type: type,
      authorId: '',
      authorName: 'Delta Labs',
      mediaUrl: resolveFeedMediaUrl(json['videoSrc'] as String? ?? json['video_src'] as String?),
      soundLabel: _soundLabel(json),
      description: _caption(json),
      likeCount: json['likeCount'] as int? ?? 0,
      commentCount: json['commentCount'] as int? ?? 0,
      viewCount: json['viewCount'] as int? ?? 0,
      shareCount: json['shareCount'] as int? ?? 0,
      isLiked: json['likedByMe'] as bool? ?? false,
      isSaved: json['savedByMe'] as bool? ?? false,
      duration: durationS > 0 ? Duration(seconds: durationS) : null,
      hashtags: _hashtags(json),
    );
  }

  static String _caption(Map<String, dynamic> json) {
    final caption = json['caption'] as String?;
    if (caption != null && caption.trim().isNotEmpty) return caption.trim();
    return 'Delta Labs';
  }

  static List<String> _hashtags(Map<String, dynamic> json) {
    final raw = json['hashtags'];
    if (raw is! List) return const [];
    return raw.whereType<String>().toList();
  }

  static String? _soundLabel(Map<String, dynamic> json) {
    final tags = _hashtags(json);
    if (tags.isEmpty) return null;
    return tags.map((t) => t.replaceFirst(RegExp(r'^#'), '')).join(' ');
  }
}
