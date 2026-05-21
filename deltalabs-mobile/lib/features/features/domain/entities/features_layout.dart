/// Per-user layout from `GET/PUT /v1/features/layout`.
class FeaturesLayout {
  const FeaturesLayout({
    required this.orderKeys,
    required this.hiddenKeys,
    required this.labels,
  });

  final List<String> orderKeys;
  final List<String> hiddenKeys;
  final Map<String, String> labels;

  static const empty = FeaturesLayout(
    orderKeys: [],
    hiddenKeys: [],
    labels: {},
  );
}
