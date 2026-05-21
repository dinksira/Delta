import 'package:deltalabs_mobile/features/features/domain/entities/feature.dart';
import 'package:deltalabs_mobile/features/features/domain/entities/features_layout.dart';

abstract class FeaturesRepository {
  Future<List<Feature>> fetchFeatures();

  Future<FeaturesLayout> fetchLayout();

  Future<FeaturesLayout> saveLayout({
    required List<String> orderKeys,
    required List<String> hiddenKeys,
    required Map<String, String> labels,
  });
}
