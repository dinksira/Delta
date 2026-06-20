import 'package:deltalabs_mobile/shared/management_table/data/models/mt_column_type.dart';

class MtColumnOption {
  const MtColumnOption({required this.id, required this.label});

  final String id;
  final String label;
}

class MtColumnModel {
  MtColumnModel({
    required this.id,
    required this.title,
    required this.type,
    required this.order,
    required this.settings,
  });

  factory MtColumnModel.fromJson(Map<String, dynamic> json) {
    return MtColumnModel(
      id: (json['id'] ?? '').toString(),
      title: (json['title'] ?? '').toString(),
      type: MtColumnType.fromApi((json['type'] ?? 'text').toString()),
      order: json['order'] is num ? (json['order'] as num).toInt() : 0,
      settings: _parseSettings(json['settings']),
    );
  }

  static Map<String, dynamic> _parseSettings(Object? raw) {
    if (raw is Map<String, dynamic>) return Map<String, dynamic>.from(raw);
    if (raw is Map) return raw.map((k, v) => MapEntry(k.toString(), v));
    return const {};
  }

  final String id;
  final String title;
  final MtColumnType type;
  final int order;
  final Map<String, dynamic> settings;

  List<MtColumnOption> get options {
    final raw = settings['options'];
    if (raw is! List) return const [];
    final result = <MtColumnOption>[];
    for (final entry in raw) {
      if (entry is Map) {
        final id = (entry['id'] ?? entry['value'] ?? '').toString();
        final label = (entry['label'] ?? id).toString();
        if (id.isNotEmpty) {
          result.add(MtColumnOption(id: id, label: label));
        }
      } else {
        final text = entry.toString();
        if (text.isNotEmpty) {
          result.add(MtColumnOption(id: text, label: text));
        }
      }
    }
    return result;
  }

  List<String> get optionLabels => options.map((o) => o.label).toList();

  bool get usesPersonPicker =>
      settings['cellEditor']?.toString() == 'person' ||
      title.trim().toLowerCase() == 'student' ||
      title.trim().toLowerCase() == 'parent';

  String resolvePersonPicker(String tableDefault) {
    final normalizedTitle = title.trim().toLowerCase();
    if (normalizedTitle == 'parent') {
      return tableDefault == 'platform' ? 'platform' : 'school_parents';
    }
    if (normalizedTitle == 'student') {
      if (tableDefault == 'platform') return 'platform';
      if (tableDefault == 'school_parents') return 'class_students';
      return 'school_students';
    }
    return tableDefault;
  }
}
