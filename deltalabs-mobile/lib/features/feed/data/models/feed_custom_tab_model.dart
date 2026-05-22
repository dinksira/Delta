import 'package:deltalabs_mobile/features/feed/domain/entities/feed_custom_tab.dart';
import 'package:deltalabs_mobile/features/feed/domain/entities/feed_query_filters.dart';

class FeedCustomTabModel {
  FeedCustomTabModel({
    required this.label,
    required this.filters,
  });

  factory FeedCustomTabModel.fromJson(Map<String, dynamic> json) {
    final rawFilters = json['filters'];
    final filtersMap = rawFilters is Map<String, dynamic> ? rawFilters : <String, dynamic>{};

    return FeedCustomTabModel(
      label: (json['label'] ?? 'Custom').toString(),
      filters: FeedQueryFilters(
        contentType: filtersMap['content_type']?.toString() ??
            filtersMap['contentType']?.toString(),
        hashtag: filtersMap['hashtag']?.toString(),
        courseCategory: filtersMap['course_category']?.toString() ??
            filtersMap['courseCategory']?.toString(),
        minDurationS: _asInt(filtersMap['min_duration_s'] ?? filtersMap['minDurationS']),
        maxDurationS: _asInt(filtersMap['max_duration_s'] ?? filtersMap['maxDurationS']),
      ),
    );
  }

  final String label;
  final FeedQueryFilters filters;

  Map<String, dynamic> toUpsertJson(String label, FeedQueryFilters filters) {
    return {
      'label': label,
      'filters': {
        if (filters.contentType != null) 'content_type': filters.contentType,
        if (filters.hashtag != null) 'hashtag': filters.hashtag,
        if (filters.courseCategory != null) 'course_category': filters.courseCategory,
        if (filters.minDurationS != null) 'min_duration_s': filters.minDurationS,
        if (filters.maxDurationS != null) 'max_duration_s': filters.maxDurationS,
      },
    };
  }

  FeedCustomTab toEntity() => FeedCustomTab(label: label, filters: filters);

  static int? _asInt(Object? value) {
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value?.toString() ?? '');
  }
}
