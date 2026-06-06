/// Persisted order of category tabs pinned to the Plus bar (excludes [all]).
class FeatureShellTabsModel {
  const FeatureShellTabsModel({this.pinnedCategoryIds = const []});

  final List<String> pinnedCategoryIds;

  Map<String, dynamic> toJson() => {
        'pinnedCategoryIds': pinnedCategoryIds,
      };

  factory FeatureShellTabsModel.fromJson(Map<String, dynamic> json) {
    final raw = json['pinnedCategoryIds'];
    if (raw is! List) return const FeatureShellTabsModel();
    return FeatureShellTabsModel(
      pinnedCategoryIds: raw.whereType<String>().toList(growable: false),
    );
  }
}
