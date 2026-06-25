class SchoolAttendanceSessionModel {
  SchoolAttendanceSessionModel({
    required this.id,
    required this.title,
    required this.hidden,
    required this.trackingMode,
    required this.createdAt,
    this.scheduledAt,
  });

  factory SchoolAttendanceSessionModel.fromJson(Map<String, dynamic> json) {
    return SchoolAttendanceSessionModel(
      id: (json['id'] ?? '').toString(),
      title: (json['title'] ?? '').toString(),
      scheduledAt: json['scheduledAt'] as String? ?? json['scheduled_at'] as String?,
      hidden: json['hidden'] as bool? ?? false,
      trackingMode: (json['trackingMode'] ?? json['tracking_mode'] ?? 'manual').toString(),
      createdAt: (json['createdAt'] ?? json['created_at'] ?? '').toString(),
    );
  }

  final String id;
  final String title;
  final String? scheduledAt;
  final bool hidden;
  final String trackingMode;
  final String createdAt;

  bool get isDeviceTracking => trackingMode == 'device';
}

class SchoolAttendanceDeviceModel {
  SchoolAttendanceDeviceModel({
    required this.id,
    required this.name,
    required this.deviceType,
    required this.attendanceSessionLabel,
    required this.status,
    required this.createdAt,
    this.lastSyncedAt,
  });

  factory SchoolAttendanceDeviceModel.fromJson(Map<String, dynamic> json) {
    return SchoolAttendanceDeviceModel(
      id: (json['id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      deviceType: (json['deviceType'] ?? json['device_type'] ?? 'other').toString(),
      attendanceSessionLabel: (json['attendanceSessionLabel'] ??
              json['attendance_session_label'] ??
              'Class Attendance')
          .toString(),
      status: (json['status'] ?? 'online').toString(),
      lastSyncedAt: json['lastSyncedAt'] as String? ?? json['last_synced_at'] as String?,
      createdAt: (json['createdAt'] ?? json['created_at'] ?? '').toString(),
    );
  }

  final String id;
  final String name;
  final String deviceType;
  final String attendanceSessionLabel;
  final String status;
  final String? lastSyncedAt;
  final String createdAt;
}

class SchoolClassAttendanceStateModel {
  SchoolClassAttendanceStateModel({
    required this.sessions,
    required this.devices,
    required this.marks,
  });

  factory SchoolClassAttendanceStateModel.fromJson(Map<String, dynamic> json) {
    final sessionsRaw = json['sessions'];
    final devicesRaw = json['devices'];
    final marksRaw = json['marks'];

    return SchoolClassAttendanceStateModel(
      sessions: sessionsRaw is List
          ? sessionsRaw
              .whereType<Map<String, dynamic>>()
              .map(SchoolAttendanceSessionModel.fromJson)
              .toList()
          : const [],
      devices: devicesRaw is List
          ? devicesRaw
              .whereType<Map<String, dynamic>>()
              .map(SchoolAttendanceDeviceModel.fromJson)
              .toList()
          : const [],
      marks: marksRaw is Map
          ? marksRaw.map((k, v) => MapEntry(k.toString(), v.toString()))
          : const {},
    );
  }

  final List<SchoolAttendanceSessionModel> sessions;
  final List<SchoolAttendanceDeviceModel> devices;
  final Map<String, String> marks;

  static String markKey(String studentId, String sessionId) => '$studentId:$sessionId';

  String? markFor(String studentId, String sessionId) => marks[markKey(studentId, sessionId)];
}

class AttendanceStudentRowModel {
  const AttendanceStudentRowModel({required this.id, required this.label});

  final String id;
  final String label;
}
