import 'package:deltalabs_mobile/features/workspace/school/data/models/school_workspace_item_model.dart';

/// Class workspace item metadata — aligned with web `SchoolWorkspaceDetailView`.
class ClassWorkspaceMeta {
  const ClassWorkspaceMeta({
    required this.grade,
    required this.homeRoomTeacher,
    required this.studentCount,
  });

  final String? grade;
  final String? homeRoomTeacher;
  final String? studentCount;

  factory ClassWorkspaceMeta.fromItem(SchoolWorkspaceItemModel item) {
    final meta = item.metadata;
    String? read(String key) {
      final value = meta[key];
      if (value == null) return null;
      final text = value.toString().trim();
      return text.isEmpty ? null : text;
    }

    return ClassWorkspaceMeta(
      grade: read('grade'),
      homeRoomTeacher: read('homeRoomTeacher') ?? read('home_room_teacher'),
      studentCount: read('studentCount') ?? read('student_count'),
    );
  }

  List<String> get summaryParts {
    final parts = <String>[];
    if (grade != null) parts.add(grade!);
    if (homeRoomTeacher != null) parts.add(homeRoomTeacher!);
    if (studentCount != null) {
      parts.add('$studentCount students');
    }
    return parts;
  }

  bool get hasSummary => summaryParts.isNotEmpty;
}
