import 'package:deltalabs_mobile/features/features/domain/entities/features_layout.dart';

class FeaturesLayoutModel {
  FeaturesLayoutModel({
    required this.orderKeys,
    required this.hiddenKeys,
    required this.labels,
  });

  factory FeaturesLayoutModel.fromJson(Map<String, dynamic> json) {
    return FeaturesLayoutModel(
      orderKeys: _stringList(json['orderKeys'] ?? json['order_keys']),
      hiddenKeys: _stringList(json['hiddenKeys'] ?? json['hidden_keys']),
      labels: _labels(json['labels']),
    );
  }

  final List<String> orderKeys;
  final List<String> hiddenKeys;
  final Map<String, String> labels;

  Map<String, dynamic> toUpsertJson() => {
        'order_keys': orderKeys,
        'hidden_keys': hiddenKeys,
        'labels': labels,
      };

  FeaturesLayout toEntity() => FeaturesLayout(
        orderKeys: orderKeys,
        hiddenKeys: hiddenKeys,
        labels: labels,
      );

  static List<String> _stringList(Object? value) {
    if (value is! List) return [];
    return value.map((e) => e.toString()).toList();
  }

  static Map<String, String> _labels(Object? value) {
    if (value is! Map) return {};
    return value.map((k, v) => MapEntry(k.toString(), v.toString()));
  }
}
