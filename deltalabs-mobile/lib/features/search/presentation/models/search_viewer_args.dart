import 'package:deltalabs_mobile/features/feed/domain/entities/feed_item.dart';

/// Arguments for opening a clip from search results (vertical viewer).
class SearchViewerArgs {
  const SearchViewerArgs({
    required this.clips,
    required this.initialIndex,
  });

  final List<FeedItem> clips;
  final int initialIndex;
}
