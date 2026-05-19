/// Public user row from global search.
class SearchUserHit {
  const SearchUserHit({
    required this.id,
    required this.username,
    this.relevance = 0,
  });

  final String id;
  final String username;
  final double relevance;
}
