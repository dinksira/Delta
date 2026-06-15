class SchoolClassEnrollmentUserModel {
  const SchoolClassEnrollmentUserModel({
    required this.userId,
    this.username,
    this.email,
    this.fullName,
  });

  factory SchoolClassEnrollmentUserModel.fromJson(Map<String, dynamic> json) {
    return SchoolClassEnrollmentUserModel(
      userId: (json['userId'] ?? json['user_id'] ?? '').toString(),
      username: json['username'] as String?,
      email: json['email'] as String?,
      fullName: json['fullName'] as String? ?? json['full_name'] as String?,
    );
  }

  final String userId;
  final String? username;
  final String? email;
  final String? fullName;

  String get displayName {
    final name = fullName?.trim();
    if (name != null && name.isNotEmpty) return name;
    final user = username?.trim();
    if (user != null && user.isNotEmpty) return user;
    final mail = email?.trim();
    if (mail != null && mail.isNotEmpty) return mail;
    return 'Student';
  }

  String? get displaySecondary {
    final mail = email?.trim();
    final name = fullName?.trim();
    if (mail != null && mail.isNotEmpty && name != null && name.isNotEmpty) {
      return mail;
    }
    if (mail != null && mail.isNotEmpty) return null;
    return username?.trim();
  }
}

class SchoolClassEnrollmentModel {
  const SchoolClassEnrollmentModel({
    required this.id,
    required this.orgId,
    required this.schoolId,
    required this.classWorkspaceItemId,
    required this.userId,
    required this.role,
    required this.status,
    required this.enrolledAt,
    required this.updatedAt,
    required this.user,
    this.enrolledByUserId,
  });

  factory SchoolClassEnrollmentModel.fromJson(Map<String, dynamic> json) {
    final userRaw = json['user'];
    return SchoolClassEnrollmentModel(
      id: (json['id'] ?? '').toString(),
      orgId: (json['orgId'] ?? json['org_id'] ?? '').toString(),
      schoolId: (json['schoolId'] ?? json['school_id'] ?? '').toString(),
      classWorkspaceItemId: (json['classWorkspaceItemId'] ??
              json['class_workspace_item_id'] ??
              '')
          .toString(),
      userId: (json['userId'] ?? json['user_id'] ?? '').toString(),
      role: (json['role'] ?? 'student').toString(),
      status: (json['status'] ?? 'active').toString(),
      enrolledAt: (json['enrolledAt'] ?? json['enrolled_at'] ?? '').toString(),
      updatedAt: (json['updatedAt'] ?? json['updated_at'] ?? '').toString(),
      enrolledByUserId:
          json['enrolledByUserId'] as String? ?? json['enrolled_by_user_id'] as String?,
      user: userRaw is Map<String, dynamic>
          ? SchoolClassEnrollmentUserModel.fromJson(userRaw)
          : const SchoolClassEnrollmentUserModel(userId: ''),
    );
  }

  final String id;
  final String orgId;
  final String schoolId;
  final String classWorkspaceItemId;
  final String userId;
  final String role;
  final String status;
  final String enrolledAt;
  final String updatedAt;
  final String? enrolledByUserId;
  final SchoolClassEnrollmentUserModel user;
}
