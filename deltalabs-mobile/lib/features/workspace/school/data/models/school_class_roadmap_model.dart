class SchoolClassRoadmapContentModel {
  const SchoolClassRoadmapContentModel({
    required this.id,
    required this.kind,
    required this.contentType,
    required this.title,
    required this.status,
    this.subtitle,
    this.sourceKey,
    this.tags = const [],
  });

  factory SchoolClassRoadmapContentModel.fromJson(Map<String, dynamic> json) {
    return SchoolClassRoadmapContentModel(
      id: (json['id'] ?? '').toString(),
      kind: (json['kind'] ?? 'session').toString(),
      contentType: (json['contentType'] ?? json['content_type'] ?? 'session').toString(),
      title: (json['title'] ?? '').toString(),
      subtitle: json['subtitle'] as String?,
      sourceKey: (json['sourceKey'] ?? json['source_key'])?.toString(),
      tags: (json['tags'] is List)
          ? (json['tags'] as List).map((e) => e.toString()).toList()
          : const [],
      status: (json['status'] ?? 'pending').toString(),
    );
  }

  final String id;
  final String kind;
  final String contentType;
  final String title;
  final String? subtitle;
  final String? sourceKey;
  final List<String> tags;
  final String status;

  Map<String, dynamic> toJson() => {
        'id': id,
        'kind': kind,
        'contentType': contentType,
        'title': title,
        if (subtitle != null) 'subtitle': subtitle,
        if (sourceKey != null) 'sourceKey': sourceKey,
        'tags': tags,
        'status': status,
      };

  SchoolClassRoadmapContentModel copyWith({
    String? status,
    String? title,
    String? subtitle,
  }) {
    return SchoolClassRoadmapContentModel(
      id: id,
      kind: kind,
      contentType: contentType,
      title: title ?? this.title,
      subtitle: subtitle ?? this.subtitle,
      sourceKey: sourceKey,
      tags: tags,
      status: status ?? this.status,
    );
  }
}

class SchoolClassRoadmapSectionModel {
  const SchoolClassRoadmapSectionModel({
    required this.id,
    required this.title,
    this.description = '',
    this.tags = const [],
    this.collapsed = false,
    this.contents = const [],
  });

  factory SchoolClassRoadmapSectionModel.fromJson(Map<String, dynamic> json) {
    final rawContents = json['contents'];
    return SchoolClassRoadmapSectionModel(
      id: (json['id'] ?? '').toString(),
      title: (json['title'] ?? '').toString(),
      description: (json['description'] ?? '').toString(),
      tags: (json['tags'] is List)
          ? (json['tags'] as List).map((e) => e.toString()).toList()
          : const [],
      collapsed: json['collapsed'] == true,
      contents: rawContents is List
          ? rawContents
              .whereType<Map<String, dynamic>>()
              .map(SchoolClassRoadmapContentModel.fromJson)
              .toList()
          : const [],
    );
  }

  final String id;
  final String title;
  final String description;
  final List<String> tags;
  final bool collapsed;
  final List<SchoolClassRoadmapContentModel> contents;

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'description': description,
        'tags': tags,
        'collapsed': collapsed,
        'contents': contents.map((c) => c.toJson()).toList(),
      };

  SchoolClassRoadmapSectionModel copyWith({
    String? title,
    String? description,
    bool? collapsed,
    List<SchoolClassRoadmapContentModel>? contents,
  }) {
    return SchoolClassRoadmapSectionModel(
      id: id,
      title: title ?? this.title,
      description: description ?? this.description,
      tags: tags,
      collapsed: collapsed ?? this.collapsed,
      contents: contents ?? this.contents,
    );
  }
}

class SchoolClassRoadmapModel {
  const SchoolClassRoadmapModel({
    required this.orgId,
    required this.schoolId,
    required this.classWorkspaceItemId,
    this.sections = const [],
    this.currentSectionId,
    this.currentContentId,
    this.createdAt,
    this.updatedAt,
  });

  factory SchoolClassRoadmapModel.empty({
    required String orgId,
    required String schoolId,
    required String classWorkspaceItemId,
  }) {
    return SchoolClassRoadmapModel(
      orgId: orgId,
      schoolId: schoolId,
      classWorkspaceItemId: classWorkspaceItemId,
    );
  }

  factory SchoolClassRoadmapModel.fromJson(Map<String, dynamic> json) {
    final rawSections = json['sections'];
    return SchoolClassRoadmapModel(
      orgId: (json['orgId'] ?? json['org_id'] ?? '').toString(),
      schoolId: (json['schoolId'] ?? json['school_id'] ?? '').toString(),
      classWorkspaceItemId: (json['classWorkspaceItemId'] ??
              json['class_workspace_item_id'] ??
              '')
          .toString(),
      sections: rawSections is List
          ? rawSections
              .whereType<Map<String, dynamic>>()
              .map(SchoolClassRoadmapSectionModel.fromJson)
              .toList()
          : const [],
      currentSectionId:
          (json['currentSectionId'] ?? json['current_section_id'])?.toString(),
      currentContentId:
          (json['currentContentId'] ?? json['current_content_id'])?.toString(),
      createdAt: (json['createdAt'] ?? json['created_at'])?.toString(),
      updatedAt: (json['updatedAt'] ?? json['updated_at'])?.toString(),
    );
  }

  final String orgId;
  final String schoolId;
  final String classWorkspaceItemId;
  final List<SchoolClassRoadmapSectionModel> sections;
  final String? currentSectionId;
  final String? currentContentId;
  final String? createdAt;
  final String? updatedAt;

  Map<String, dynamic> toPutJson() => {
        'sections': sections.map((s) => s.toJson()).toList(),
        'currentSectionId': currentSectionId,
        'currentContentId': currentContentId,
      };

  SchoolClassRoadmapModel copyWith({
    List<SchoolClassRoadmapSectionModel>? sections,
    String? currentSectionId,
    String? currentContentId,
  }) {
    return SchoolClassRoadmapModel(
      orgId: orgId,
      schoolId: schoolId,
      classWorkspaceItemId: classWorkspaceItemId,
      sections: sections ?? this.sections,
      currentSectionId: currentSectionId ?? this.currentSectionId,
      currentContentId: currentContentId ?? this.currentContentId,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }
}

class SchoolClassRoadmapSidebarResourceModel {
  const SchoolClassRoadmapSidebarResourceModel({
    required this.id,
    required this.kind,
    required this.contentType,
    required this.title,
    required this.sourceKey,
    this.subtitle,
  });

  factory SchoolClassRoadmapSidebarResourceModel.fromJson(Map<String, dynamic> json) {
    return SchoolClassRoadmapSidebarResourceModel(
      id: (json['id'] ?? '').toString(),
      kind: (json['kind'] ?? 'session').toString(),
      contentType: (json['contentType'] ?? json['content_type'] ?? 'session').toString(),
      title: (json['title'] ?? '').toString(),
      subtitle: json['subtitle'] as String?,
      sourceKey: (json['sourceKey'] ?? json['source_key'] ?? '').toString(),
    );
  }

  final String id;
  final String kind;
  final String contentType;
  final String title;
  final String? subtitle;
  final String sourceKey;

  SchoolClassRoadmapContentModel toContent({required String contentId}) {
    return SchoolClassRoadmapContentModel(
      id: contentId,
      kind: kind,
      contentType: contentType,
      title: title,
      subtitle: subtitle,
      sourceKey: sourceKey,
      status: 'pending',
    );
  }
}

class SchoolClassRoadmapResourcesModel {
  const SchoolClassRoadmapResourcesModel({
    this.sessions = const [],
    this.courses = const [],
    this.materials = const [],
  });

  factory SchoolClassRoadmapResourcesModel.fromJson(Map<String, dynamic> json) {
    List<SchoolClassRoadmapSidebarResourceModel> parse(String key) {
      final raw = json[key];
      if (raw is! List) return const [];
      return raw
          .whereType<Map<String, dynamic>>()
          .map(SchoolClassRoadmapSidebarResourceModel.fromJson)
          .toList();
    }

    return SchoolClassRoadmapResourcesModel(
      sessions: parse('sessions'),
      courses: parse('courses'),
      materials: parse('materials'),
    );
  }

  final List<SchoolClassRoadmapSidebarResourceModel> sessions;
  final List<SchoolClassRoadmapSidebarResourceModel> courses;
  final List<SchoolClassRoadmapSidebarResourceModel> materials;

  List<SchoolClassRoadmapSidebarResourceModel> get all => [
        ...sessions,
        ...courses,
        ...materials,
      ];
}
