import 'package:deltalabs_mobile/features/features/domain/entities/feature_instance.dart';

class FeatureInstancesModel {
  FeatureInstancesModel({required this.instances});

  factory FeatureInstancesModel.fromJson(Map<String, dynamic> json) {
    final raw = json['instances'];
    if (raw is! List) return FeatureInstancesModel(instances: const []);
    return FeatureInstancesModel(
      instances: raw
          .whereType<Map<String, dynamic>>()
          .map(FeatureInstance.fromJson)
          .toList(),
    );
  }

  final List<FeatureInstance> instances;

  Map<String, dynamic> toJson() => {
        'instances': instances.map((i) => i.toJson()).toList(),
      };
}
