class SchoolClassSessionModel {
  SchoolClassSessionModel({
    required this.id,
    required this.orgId,
    required this.schoolId,
    required this.classWorkspaceItemId,
    required this.title,
    required this.sessionType,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
    this.description,
    this.weight,
    this.durationMinutes,
    this.scheduledAt,
  });

  factory SchoolClassSessionModel.fromJson(Map<String, dynamic> json) {
    return SchoolClassSessionModel(
      id: (json['id'] ?? '').toString(),
      orgId: (json['orgId'] ?? json['org_id'] ?? '').toString(),
      schoolId: (json['schoolId'] ?? json['school_id'] ?? '').toString(),
      classWorkspaceItemId: (json['classWorkspaceItemId'] ??
              json['class_workspace_item_id'] ??
              '')
          .toString(),
      title: (json['title'] ?? '').toString(),
      description: json['description'] as String?,
      weight: (json['weight'] as num?)?.toDouble(),
      durationMinutes: json['durationMinutes'] as int? ?? json['duration_minutes'] as int?,
      sessionType: (json['sessionType'] ?? json['session_type'] ?? 'virtual').toString(),
      status: (json['status'] ?? 'draft').toString(),
      scheduledAt: json['scheduledAt'] as String? ?? json['scheduled_at'] as String?,
      createdAt: (json['createdAt'] ?? json['created_at'] ?? '').toString(),
      updatedAt: (json['updatedAt'] ?? json['updated_at'] ?? '').toString(),
    );
  }

  final String id;
  final String orgId;
  final String schoolId;
  final String classWorkspaceItemId;
  final String title;
  final String? description;
  final double? weight;
  final int? durationMinutes;
  final String sessionType;
  final String status;
  final String? scheduledAt;
  final String createdAt;
  final String updatedAt;
}
