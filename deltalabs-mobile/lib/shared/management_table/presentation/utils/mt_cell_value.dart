import 'package:deltalabs_mobile/shared/management_table/data/models/mt_column_type.dart';

Object? normalizeMtCellValue(MtColumnType type, Object? raw) {
  if (raw == null) return null;
  if (raw is String && raw.isEmpty) return null;

  switch (type) {
    case MtColumnType.number:
      if (raw is num) return raw;
      final parsed = num.tryParse(raw.toString());
      return parsed;
    case MtColumnType.checkbox:
      if (raw is bool) return raw;
      return raw.toString().toLowerCase() == 'true';
    case MtColumnType.date:
      final text = raw.toString();
      return text.length >= 10 ? text.substring(0, 10) : text;
    default:
      return raw;
  }
}

bool mtCellValuesEqual(MtColumnType type, Object? a, Object? b) {
  final left = normalizeMtCellValue(type, a);
  final right = normalizeMtCellValue(type, b);
  if (left is Map && right is Map) {
    if (left.length != right.length) return false;
    for (final key in left.keys) {
      if (!right.containsKey(key) || left[key] != right[key]) return false;
    }
    return true;
  }
  return left == right;
}
