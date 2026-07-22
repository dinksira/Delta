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

class AttendanceFormulaConfigModel {
  const AttendanceFormulaConfigModel({
    this.mode = 'preset',
    this.operation = 'sum',
    this.sessionIds = const [],
    this.customExpression = '',
  });

  factory AttendanceFormulaConfigModel.fromJson(Object? raw) {
    if (raw is! Map) return const AttendanceFormulaConfigModel();
    final sessionIdsRaw = raw['sessionIds'] ?? raw['session_ids'];
    return AttendanceFormulaConfigModel(
      mode: (raw['mode'] ?? 'preset').toString(),
      operation: (raw['operation'] ?? 'sum').toString(),
      sessionIds: sessionIdsRaw is List
          ? sessionIdsRaw.map((e) => e.toString()).where((e) => e.isNotEmpty).toList()
          : const [],
      customExpression:
          (raw['customExpression'] ?? raw['custom_expression'] ?? '').toString(),
    );
  }

  final String mode;
  final String operation;
  final List<String> sessionIds;
  final String customExpression;

  Map<String, dynamic> toJson() => {
        'mode': mode,
        'operation': operation,
        'sessionIds': sessionIds,
        'customExpression': customExpression,
      };

  AttendanceFormulaConfigModel copyWith({
    String? mode,
    String? operation,
    List<String>? sessionIds,
    String? customExpression,
  }) {
    return AttendanceFormulaConfigModel(
      mode: mode ?? this.mode,
      operation: operation ?? this.operation,
      sessionIds: sessionIds ?? this.sessionIds,
      customExpression: customExpression ?? this.customExpression,
    );
  }
}

class AttendanceFaceDetectionSettingsModel {
  const AttendanceFaceDetectionSettingsModel({
    this.section = 'all',
    this.trackOption = 'random_sampling',
    this.samplingIntervalMinutes = 5,
    this.presenceThresholdPercent = 80,
  });

  factory AttendanceFaceDetectionSettingsModel.fromJson(Object? raw) {
    if (raw is! Map) return const AttendanceFaceDetectionSettingsModel();
    return AttendanceFaceDetectionSettingsModel(
      section: (raw['section'] ?? 'all').toString(),
      trackOption: (raw['trackOption'] ?? raw['track_option'] ?? 'random_sampling').toString(),
      samplingIntervalMinutes:
          (raw['samplingIntervalMinutes'] as num?)?.toInt() ??
              (raw['sampling_interval_minutes'] as num?)?.toInt() ??
              5,
      presenceThresholdPercent:
          (raw['presenceThresholdPercent'] as num?)?.toInt() ??
              (raw['presence_threshold_percent'] as num?)?.toInt() ??
              80,
    );
  }

  final String section;
  final String trackOption;
  final int samplingIntervalMinutes;
  final int presenceThresholdPercent;

  Map<String, dynamic> toJson() => {
        'section': section,
        'trackOption': trackOption,
        'samplingIntervalMinutes': samplingIntervalMinutes,
        'presenceThresholdPercent': presenceThresholdPercent,
      };

  AttendanceFaceDetectionSettingsModel copyWith({
    String? section,
    String? trackOption,
    int? samplingIntervalMinutes,
    int? presenceThresholdPercent,
  }) {
    return AttendanceFaceDetectionSettingsModel(
      section: section ?? this.section,
      trackOption: trackOption ?? this.trackOption,
      samplingIntervalMinutes:
          samplingIntervalMinutes ?? this.samplingIntervalMinutes,
      presenceThresholdPercent:
          presenceThresholdPercent ?? this.presenceThresholdPercent,
    );
  }
}

class AttendanceRealtimeTrackConfigModel {
  const AttendanceRealtimeTrackConfigModel({
    this.enabled = false,
    this.faceDetection = false,
    this.voiceRecognition = false,
    this.recordVideo = false,
    this.recordAudio = false,
    this.faceDetectionSettings = const AttendanceFaceDetectionSettingsModel(),
  });

  factory AttendanceRealtimeTrackConfigModel.fromJson(Object? raw) {
    if (raw is! Map) return const AttendanceRealtimeTrackConfigModel();
    return AttendanceRealtimeTrackConfigModel(
      enabled: raw['enabled'] as bool? ?? false,
      faceDetection:
          raw['faceDetection'] as bool? ?? raw['face_detection'] as bool? ?? false,
      voiceRecognition: raw['voiceRecognition'] as bool? ??
          raw['voice_recognition'] as bool? ??
          false,
      recordVideo:
          raw['recordVideo'] as bool? ?? raw['record_video'] as bool? ?? false,
      recordAudio:
          raw['recordAudio'] as bool? ?? raw['record_audio'] as bool? ?? false,
      faceDetectionSettings: AttendanceFaceDetectionSettingsModel.fromJson(
        raw['faceDetectionSettings'] ?? raw['face_detection_settings'],
      ),
    );
  }

  final bool enabled;
  final bool faceDetection;
  final bool voiceRecognition;
  final bool recordVideo;
  final bool recordAudio;
  final AttendanceFaceDetectionSettingsModel faceDetectionSettings;

  Map<String, dynamic> toJson() => {
        'enabled': enabled,
        'faceDetection': faceDetection,
        'voiceRecognition': voiceRecognition,
        'recordVideo': recordVideo,
        'recordAudio': recordAudio,
        'faceDetectionSettings': faceDetectionSettings.toJson(),
      };

  AttendanceRealtimeTrackConfigModel copyWith({
    bool? enabled,
    bool? faceDetection,
    bool? voiceRecognition,
    bool? recordVideo,
    bool? recordAudio,
    AttendanceFaceDetectionSettingsModel? faceDetectionSettings,
  }) {
    return AttendanceRealtimeTrackConfigModel(
      enabled: enabled ?? this.enabled,
      faceDetection: faceDetection ?? this.faceDetection,
      voiceRecognition: voiceRecognition ?? this.voiceRecognition,
      recordVideo: recordVideo ?? this.recordVideo,
      recordAudio: recordAudio ?? this.recordAudio,
      faceDetectionSettings:
          faceDetectionSettings ?? this.faceDetectionSettings,
    );
  }
}

class SchoolClassAttendanceStateModel {
  SchoolClassAttendanceStateModel({
    required this.sessions,
    required this.devices,
    required this.marks,
    this.formulaConfig = const AttendanceFormulaConfigModel(),
    this.realtimeTrack = const AttendanceRealtimeTrackConfigModel(),
  });

  factory SchoolClassAttendanceStateModel.fromJson(Map<String, dynamic> json) {
    final sessionsRaw = json['sessions'];
    final devicesRaw = json['devices'];
    final marksRaw = json['marks'];

    return SchoolClassAttendanceStateModel(
      sessions: sessionsRaw is List
          ? sessionsRaw
              .whereType<Map<dynamic, dynamic>>()
              .map((e) => SchoolAttendanceSessionModel.fromJson(
                    Map<String, dynamic>.from(e),
                  ))
              .toList()
          : const [],
      devices: devicesRaw is List
          ? devicesRaw
              .whereType<Map<dynamic, dynamic>>()
              .map((e) => SchoolAttendanceDeviceModel.fromJson(
                    Map<String, dynamic>.from(e),
                  ))
              .toList()
          : const [],
      marks: marksRaw is Map
          ? marksRaw.map((k, v) => MapEntry(k.toString(), v.toString()))
          : const {},
      formulaConfig: AttendanceFormulaConfigModel.fromJson(
        json['formulaConfig'] ?? json['formula_config'],
      ),
      realtimeTrack: AttendanceRealtimeTrackConfigModel.fromJson(
        json['realtimeTrack'] ?? json['realtime_track'],
      ),
    );
  }

  final List<SchoolAttendanceSessionModel> sessions;
  final List<SchoolAttendanceDeviceModel> devices;
  final Map<String, String> marks;
  final AttendanceFormulaConfigModel formulaConfig;
  final AttendanceRealtimeTrackConfigModel realtimeTrack;

  static String markKey(String studentId, String sessionId) => '$studentId:$sessionId';

  String? markFor(String studentId, String sessionId) => marks[markKey(studentId, sessionId)];
}

class AttendanceStudentRowModel {
  const AttendanceStudentRowModel({required this.id, required this.label});

  final String id;
  final String label;
}
