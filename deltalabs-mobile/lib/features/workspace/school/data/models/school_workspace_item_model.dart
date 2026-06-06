enum SchoolWorkspaceItemType {
  folder,
  department,
  classItem,
  course,
  managementTable,
  resource,
  student,
  service,
  staff;

  static SchoolWorkspaceItemType fromApi(String raw) {
    switch (raw.trim()) {
      case 'folder':
        return SchoolWorkspaceItemType.folder;
      case 'department':
        return SchoolWorkspaceItemType.department;
      case 'class':
        return SchoolWorkspaceItemType.classItem;
      case 'course':
        return SchoolWorkspaceItemType.course;
      case 'management-table':
        return SchoolWorkspaceItemType.managementTable;
      case 'resource':
        return SchoolWorkspaceItemType.resource;
      case 'student':
        return SchoolWorkspaceItemType.student;
      case 'service':
        return SchoolWorkspaceItemType.service;
      case 'staff':
        return SchoolWorkspaceItemType.staff;
      default:
        return SchoolWorkspaceItemType.folder;
    }
  }

  String get apiValue {
    switch (this) {
      case SchoolWorkspaceItemType.classItem:
        return 'class';
      case SchoolWorkspaceItemType.managementTable:
        return 'management-table';
      default:
        return name;
    }
  }

  String get label {
    switch (this) {
      case SchoolWorkspaceItemType.classItem:
        return 'Class';
      case SchoolWorkspaceItemType.managementTable:
        return 'Management Table';
      default:
        return '${name[0].toUpperCase()}${name.substring(1)}'.replaceAll('_', ' ');
    }
  }
}

class SchoolWorkspaceItemModel {
  SchoolWorkspaceItemModel({
    required this.id,
    required this.orgId,
    required this.schoolId,
    required this.type,
    required this.title,
    required this.metadata,
    required this.isRoot,
    required this.createdAt,
    required this.updatedAt,
    this.parentId,
    this.description,
  });

  factory SchoolWorkspaceItemModel.fromJson(Map<String, dynamic> json) {
    final typeRaw = (json['type'] ?? '').toString();
    return SchoolWorkspaceItemModel(
      id: (json['id'] ?? '').toString(),
      orgId: (json['orgId'] ?? json['org_id'] ?? '').toString(),
      schoolId: (json['schoolId'] ?? json['school_id'] ?? '').toString(),
      parentId: json['parentId'] as String? ?? json['parent_id'] as String?,
      type: SchoolWorkspaceItemType.fromApi(typeRaw),
      title: (json['title'] ?? '').toString(),
      description: json['description'] as String?,
      metadata: _parseMetadata(json['metadata']),
      isRoot: json['isRoot'] as bool? ?? json['is_root'] as bool? ?? false,
      createdAt: (json['createdAt'] ?? json['created_at'] ?? '').toString(),
      updatedAt: (json['updatedAt'] ?? json['updated_at'] ?? '').toString(),
    );
  }

  static Map<String, dynamic> _parseMetadata(Object? raw) {
    if (raw is Map<String, dynamic>) return Map<String, dynamic>.from(raw);
    if (raw is Map) return raw.map((k, v) => MapEntry(k.toString(), v));
    return const {};
  }

  final String id;
  final String orgId;
  final String schoolId;
  final String? parentId;
  final SchoolWorkspaceItemType type;
  final String title;
  final String? description;
  final Map<String, dynamic> metadata;
  final bool isRoot;
  final String createdAt;
  final String updatedAt;

  String? get managementTableInstanceId {
    final value = metadata['managementTableInstanceId'] ?? metadata['management_table_instance_id'];
    if (value == null) return null;
    final text = value.toString().trim();
    return text.isEmpty ? null : text;
  }

  bool get opensAsFolder => type == SchoolWorkspaceItemType.folder;

  bool get opensAsDepartment => type == SchoolWorkspaceItemType.department;

  bool get opensAsClass => type == SchoolWorkspaceItemType.classItem;

  bool get opensAsManagementTable => type == SchoolWorkspaceItemType.managementTable;

  bool get hasPrimaryOpen =>
      opensAsFolder || opensAsDepartment || opensAsClass || opensAsManagementTable;
}
