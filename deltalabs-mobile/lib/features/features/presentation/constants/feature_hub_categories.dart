import 'package:flutter/material.dart';

class FeatureHubCategory {
  const FeatureHubCategory({
    required this.id,
    required this.label,
    required this.icon,
    required this.featureKeys,
  });

  final String id;
  final String label;
  final IconData icon;

  /// Empty means "all features" (handled by [FeatureHubCategories.matches]).
  final List<String> featureKeys;
}

abstract class FeatureHubCategories {
  static const all = FeatureHubCategory(
    id: 'all',
    label: 'All',
    icon: Icons.grid_view_rounded,
    featureKeys: [],
  );

  static const school = FeatureHubCategory(
    id: 'school',
    label: 'School',
    icon: Icons.school_outlined,
    featureKeys: ['school'],
  );

  static const course = FeatureHubCategory(
    id: 'course',
    label: 'Course',
    icon: Icons.menu_book_outlined,
    featureKeys: ['course', 'tutorials', 'specialization'],
  );

  static const community = FeatureHubCategory(
    id: 'community',
    label: 'Community',
    icon: Icons.groups_outlined,
    featureKeys: ['competitions', 'chatroom'],
  );

  static const lab = FeatureHubCategory(
    id: 'lab',
    label: 'Lab',
    icon: Icons.science_outlined,
    featureKeys: ['research', 'rent_lab'],
  );

  static const tools = FeatureHubCategory(
    id: 'tools',
    label: 'Tools',
    icon: Icons.widgets_outlined,
    featureKeys: ['planner', 'certification'],
  );

  static const tabs = [all, school, course, community, lab, tools];

  static FeatureHubCategory categoryForFeatureKey(String featureKey) {
    final key = featureKey.toLowerCase();
    for (final tab in tabs) {
      if (tab.id == all.id) continue;
      if (tab.featureKeys.contains(key)) return tab;
    }
    return tools;
  }

  static String categoryIdForFeatureKey(String featureKey) {
    return categoryForFeatureKey(featureKey).id;
  }

  static String? primaryFeatureKeyForCategory(String categoryId) {
    if (categoryId == all.id) return null;
    final tab = tabs.firstWhere(
      (t) => t.id == categoryId,
      orElse: () => tools,
    );
    if (tab.featureKeys.isEmpty) return null;
    return tab.featureKeys.first;
  }

  static bool matches(FeatureHubCategory category, String featureKey) {
    if (category.id == all.id) return true;
    return category.featureKeys.contains(featureKey.toLowerCase());
  }

  static bool matchesCategory(String categoryId, String featureKey) {
    final category = tabs.firstWhere(
      (t) => t.id == categoryId,
      orElse: () => all,
    );
    return matches(category, featureKey);
  }

  static int countInstancesFor(
    Iterable<FeatureInstanceCount> items,
    FeatureHubCategory category,
  ) {
    if (category.id == all.id) return items.length;
    return items.where((i) => matches(category, i.featureKey)).length;
  }
}

/// Lightweight type for tab badge counts.
class FeatureInstanceCount {
  const FeatureInstanceCount({required this.featureKey});
  final String featureKey;
}
