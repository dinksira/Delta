/// Optional query filters for `GET /v1/feed` (matches web custom / explorer filters).
class FeedQueryFilters {
  const FeedQueryFilters({
    this.contentType,
    this.hashtag,
    this.courseCategory,
    this.minDurationS,
    this.maxDurationS,
  });

  final String? contentType;
  final String? hashtag;
  final String? courseCategory;
  final int? minDurationS;
  final int? maxDurationS;

  static const empty = FeedQueryFilters();

  bool get isEmpty =>
      contentType == null &&
      hashtag == null &&
      courseCategory == null &&
      minDurationS == null &&
      maxDurationS == null;

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        other is FeedQueryFilters &&
            contentType == other.contentType &&
            hashtag == other.hashtag &&
            courseCategory == other.courseCategory &&
            minDurationS == other.minDurationS &&
            maxDurationS == other.maxDurationS;
  }

  @override
  int get hashCode => Object.hash(
        contentType,
        hashtag,
        courseCategory,
        minDurationS,
        maxDurationS,
      );

  Map<String, dynamic> toQueryParameters() {
    return {
      if (contentType != null && contentType!.isNotEmpty)
        'content_type': contentType,
      if (hashtag != null && hashtag!.trim().isNotEmpty) 'hashtag': hashtag!.trim(),
      if (courseCategory != null && courseCategory!.isNotEmpty)
        'course_category': courseCategory,
      if (minDurationS != null) 'min_duration_s': minDurationS,
      if (maxDurationS != null) 'max_duration_s': maxDurationS,
    };
  }
}
