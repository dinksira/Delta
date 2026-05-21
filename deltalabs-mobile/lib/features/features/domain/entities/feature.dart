/// Catalog feature from `GET /v1/features`.
class Feature {
  const Feature({
    required this.featureKey,
    required this.title,
    required this.description,
    required this.enabled,
    required this.canView,
    this.routePath,
  });

  final String featureKey;
  final String title;
  final String description;
  final bool enabled;
  final bool canView;
  final String? routePath;

  bool get isAccessible => enabled && canView;
}
