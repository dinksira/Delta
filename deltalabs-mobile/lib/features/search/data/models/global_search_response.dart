import 'package:deltalabs_mobile/features/feed/domain/entities/feed_item.dart';
import 'package:deltalabs_mobile/features/search/domain/entities/search_user_hit.dart';

class GlobalSearchResponse {
  const GlobalSearchResponse({
    required this.q,
    required this.tab,
    required this.users,
    required this.clips,
  });

  final String q;
  final String tab;
  final List<SearchUserHit> users;
  final List<FeedItem> clips;
}
