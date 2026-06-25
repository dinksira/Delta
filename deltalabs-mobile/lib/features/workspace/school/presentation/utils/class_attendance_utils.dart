import 'package:deltalabs_mobile/features/workspace/school/data/models/school_class_attendance_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_workspace_item_model.dart';
import 'package:deltalabs_mobile/shared/management_table/data/models/mt_row_model.dart';

String? _studentLabelFromCell(Object? value) {
  if (value is! Map) return null;
  final fullName = (value['fullName'] ?? value['full_name'])?.toString().trim() ?? '';
  if (fullName.isNotEmpty) return fullName;
  final username = (value['username'] ?? '')?.toString().trim() ?? '';
  if (username.isNotEmpty) return username;
  final userId = (value['userId'] ?? value['user_id'])?.toString().trim() ?? '';
  return userId.isEmpty ? null : userId;
}

String _studentIdFromCell(Object? value, String fallbackRowId) {
  if (value is Map) {
    final userId = (value['userId'] ?? value['user_id'])?.toString().trim() ?? '';
    if (userId.isNotEmpty) return userId;
  }
  return fallbackRowId;
}

List<AttendanceStudentRowModel> attendanceStudentsFromRows({
  required SchoolWorkspaceItemModel classItem,
  required List<MtRowModel> rows,
}) {
  final columnId = classItem.studentsTableStudentColumnId;
  if (columnId == null || columnId.isEmpty) return const [];

  final students = <AttendanceStudentRowModel>[];
  for (final row in rows) {
    final cell = row.cells[columnId];
    final label = _studentLabelFromCell(cell);
    if (label == null || label.isEmpty) continue;
    students.add(
      AttendanceStudentRowModel(
        id: _studentIdFromCell(cell, row.id),
        label: label,
      ),
    );
  }
  return students;
}

const attendanceMarkCycle = <String?>[null, 'present', 'absent', 'late'];

String? nextAttendanceMark(String? current) {
  final index = attendanceMarkCycle.indexOf(current);
  if (index < 0) return attendanceMarkCycle[1];
  return attendanceMarkCycle[(index + 1) % attendanceMarkCycle.length];
}
