import 'package:deltalabs_mobile/features/feed/domain/entities/feed_query_filters.dart';

/// Saved custom feed tab (`GET/PUT /v1/me/feed/custom-tab`).
class FeedCustomTab {
  const FeedCustomTab({
    required this.label,
    required this.filters,
  });

  final String label;
  final FeedQueryFilters filters;
}
