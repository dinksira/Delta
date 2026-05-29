class MySchoolModel {
  MySchoolModel({
    required this.schoolId,
    required this.orgId,
    required this.name,
    required this.slug,
    required this.schoolType,
    required this.archived,
    required this.roleKeys,
  });

  factory MySchoolModel.fromJson(Map<String, dynamic> json) {
    return MySchoolModel(
      schoolId: (json['schoolId'] ?? json['school_id'] ?? '').toString(),
      orgId: (json['orgId'] ?? json['org_id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      slug: (json['slug'] ?? '').toString(),
      schoolType: (json['schoolType'] ?? json['school_type'] ?? '').toString(),
      archived: json['archived'] == true,
      roleKeys: _stringList(json['roleKeys'] ?? json['role_keys']),
    );
  }

  final String schoolId;
  final String orgId;
  final String name;
  final String slug;
  final String schoolType;
  final bool archived;
  final List<String> roleKeys;

  static List<String> _stringList(Object? value) {
    if (value is! List) return [];
    return value.map((e) => e.toString()).toList();
  }
}
