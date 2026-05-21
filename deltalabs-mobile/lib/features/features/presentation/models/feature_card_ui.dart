import 'package:deltalabs_mobile/features/features/domain/entities/feature.dart';
import 'package:deltalabs_mobile/features/features/presentation/constants/feature_visuals.dart';

/// View model for a single feature card on the hub grid.
class FeatureCardUi {
  const FeatureCardUi({
    required this.feature,
    required this.visuals,
    required this.displayTitle,
  });

  final Feature feature;
  final FeatureVisuals visuals;
  final String displayTitle;

  String get id => feature.featureKey;

  String get description => feature.description;

  bool get disabled => !feature.isAccessible;

  String get linkLabel =>
      disabled ? 'Not available' : 'Enter $displayTitle';
}
