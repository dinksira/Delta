import 'package:deltalabs_mobile/features/features/domain/entities/feature.dart';
import 'package:deltalabs_mobile/features/features/domain/entities/feature_instance.dart';
import 'package:deltalabs_mobile/features/features/presentation/constants/feature_visuals.dart';

/// View model for a saved feature instance row.
class FeatureInstanceUi {
  const FeatureInstanceUi({
    required this.instance,
    required this.feature,
    required this.displayTitle,
  });

  final FeatureInstance instance;
  final Feature feature;
  final String displayTitle;

  String get id => instance.id;
  String get featureKey => instance.featureKey;
  String get categoryId => instance.categoryId;
  String? get schoolId => instance.schoolId;

  FeatureVisuals get visuals => FeatureVisuals.forKey(featureKey);

  String get description => feature.description;

  bool get disabled => !feature.isAccessible;
}
