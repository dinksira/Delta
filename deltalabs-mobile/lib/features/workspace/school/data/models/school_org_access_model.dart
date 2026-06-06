class SchoolOrgAccessModel {
  SchoolOrgAccessModel({
    required this.orgId,
    required this.roleKeys,
    required this.permissions,
    required this.membershipState,
  });

  factory SchoolOrgAccessModel.fromJson(Map<String, dynamic> json) {
    return SchoolOrgAccessModel(
      orgId: (json['orgId'] ?? json['org_id'] ?? '').toString(),
      roleKeys: _stringList(json['roleKeys'] ?? json['role_keys']),
      permissions: _stringList(json['permissions']),
      membershipState:
          (json['membershipState'] ?? json['membership_state'] ?? '').toString(),
    );
  }

  static List<String> _stringList(Object? raw) {
    if (raw is! List) return const [];
    return raw.map((e) => e.toString()).toList();
  }

  final String orgId;
  final List<String> roleKeys;
  final List<String> permissions;
  final String membershipState;

  bool get canManageSchoolWorkspace =>
      permissions.contains('*') || permissions.contains('school:manage');
}
