import 'package:deltalabs_mobile/features/workspace/school/data/models/school_class_attendance_model.dart';

int markNumericValue(String? status) {
  if (status == 'present' || status == 'late') return 1;
  return 0;
}

String formulaOperationLabel(String op) {
  switch (op) {
    case 'average':
      return 'AVERAGE';
    case 'count_present':
      return 'COUNT';
    default:
      return 'SUM';
  }
}

List<String> resolveFormulaSessionIds(
  AttendanceFormulaConfigModel config,
  List<SchoolAttendanceSessionModel> allSessions,
) {
  if (config.sessionIds.isNotEmpty) return config.sessionIds;
  return allSessions.map((s) => s.id).toList();
}

String formatFormulaExpression(
  AttendanceFormulaConfigModel config,
  List<SchoolAttendanceSessionModel> sessions,
) {
  if (config.mode == 'custom' && config.customExpression.trim().isNotEmpty) {
    return config.customExpression.trim();
  }
  final ids = resolveFormulaSessionIds(config, sessions);
  final labels = ids.map((id) {
    final match = sessions.where((s) => s.id == id);
    final title = match.isEmpty ? id : match.first.title;
    return '{$title}';
  }).toList();
  final fn = formulaOperationLabel(config.operation);
  if (labels.isEmpty) return '$fn()';
  return '$fn(${labels.join(', ')})';
}

num evaluateAttendanceFormula({
  required String studentId,
  required AttendanceFormulaConfigModel config,
  required List<SchoolAttendanceSessionModel> sessions,
  required Map<String, String> marks,
}) {
  // Custom expressions are persisted for parity with web; mobile evaluates presets only.
  if (config.mode == 'custom' && config.customExpression.trim().isNotEmpty) {
    return 0;
  }

  final sessionIds = resolveFormulaSessionIds(config, sessions);
  if (sessionIds.isEmpty) return 0;

  final values = sessionIds.map((sessionId) {
    final status = marks[SchoolClassAttendanceStateModel.markKey(studentId, sessionId)];
    return markNumericValue(status);
  }).toList();

  if (config.operation == 'count_present') {
    return values.where((v) => v > 0).length;
  }

  final sum = values.fold<int>(0, (a, b) => a + b);
  if (config.operation == 'average') {
    return (sum / sessionIds.length * 1000).round() / 1000;
  }
  return sum;
}
