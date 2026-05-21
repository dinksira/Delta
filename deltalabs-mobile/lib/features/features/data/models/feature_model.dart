import 'package:deltalabs_mobile/features/features/domain/entities/feature.dart';

class FeatureModel {
  FeatureModel({
    required this.featureKey,
    required this.title,
    required this.description,
    required this.enabled,
    required this.canView,
    this.routePath,
  });

  factory FeatureModel.fromJson(Map<String, dynamic> json) {
    final caps = json['capabilities'];
    final canView = caps is Map ? (caps['canView'] ?? caps['can_view']) == true : false;

    return FeatureModel(
      featureKey: (json['featureKey'] ?? json['feature_key'] ?? '').toString(),
      title: (json['title'] ?? '').toString(),
      description: (json['description'] ?? '').toString(),
      enabled: json['enabled'] == true,
      canView: canView,
      routePath: json['routePath']?.toString() ?? json['route_path']?.toString(),
    );
  }

  final String featureKey;
  final String title;
  final String description;
  final bool enabled;
  final bool canView;
  final String? routePath;

  Feature toEntity() => Feature(
        featureKey: featureKey,
        title: title,
        description: description.isNotEmpty ? description : 'Feature workspace',
        enabled: enabled,
        canView: canView,
        routePath: routePath,
      );
}
