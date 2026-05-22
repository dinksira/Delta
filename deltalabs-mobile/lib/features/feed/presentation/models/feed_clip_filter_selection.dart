import 'package:deltalabs_mobile/features/feed/domain/entities/feed_query_filters.dart';

/// UI filter chips for the custom feed tab (mirrors web `FeedClipFilterSelection`).
class FeedClipFilterSelection {
  const FeedClipFilterSelection({
    this.modality,
    this.hashtag,
    this.courseCategory,
    this.duration,
  });

  final String? modality;
  final String? hashtag;
  final String? courseCategory;
  final String? duration;

  static const empty = FeedClipFilterSelection();

  bool get hasActiveFilters =>
      (modality != null && modality != 'all') ||
      (hashtag != null && hashtag!.trim().isNotEmpty) ||
      (courseCategory != null && courseCategory != 'all') ||
      (duration != null && duration != 'any');

  FeedQueryFilters toQueryFilters() {
    var minDurationS = switch (duration) {
      'short' => 0,
      'medium' => 90,
      'long' => 300,
      _ => null,
    };
    var maxDurationS = switch (duration) {
      'short' => 90,
      'medium' => 300,
      'long' => 86400,
      _ => null,
    };

    return FeedQueryFilters(
      contentType: modality == null || modality == 'all' ? null : modality,
      hashtag: hashtag?.trim().isEmpty ?? true ? null : hashtag!.trim(),
      courseCategory:
          courseCategory == null || courseCategory == 'all' ? null : courseCategory,
      minDurationS: minDurationS,
      maxDurationS: maxDurationS,
    );
  }

  factory FeedClipFilterSelection.fromQueryFilters(FeedQueryFilters filters) {
    String? duration;
    if (filters.minDurationS == 0 && filters.maxDurationS == 90) {
      duration = 'short';
    } else if (filters.minDurationS == 90 && filters.maxDurationS == 300) {
      duration = 'medium';
    } else if (filters.minDurationS == 300 && filters.maxDurationS == 86400) {
      duration = 'long';
    }

    return FeedClipFilterSelection(
      modality: filters.contentType,
      hashtag: filters.hashtag,
      courseCategory: filters.courseCategory,
      duration: duration,
    );
  }
}
