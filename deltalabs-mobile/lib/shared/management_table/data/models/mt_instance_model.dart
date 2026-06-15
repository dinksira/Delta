import 'package:deltalabs_mobile/shared/management_table/data/models/mt_definition_model.dart';
import 'package:deltalabs_mobile/shared/management_table/data/models/mt_table_group_model.dart';

class MtInstanceModel {
  MtInstanceModel({
    required this.id,
    required this.orgId,
    required this.schoolId,
    required this.definitionId,
    required this.definitionVersion,
    required this.title,
    required this.tableGroups,
    required this.createdAt,
    required this.updatedAt,
    this.workspaceItemId,
  });

  factory MtInstanceModel.fromJson(Map<String, dynamic> json) {
    final rawGroups = json['tableGroups'] ?? json['table_groups'];
    var groups = rawGroups is List
        ? rawGroups
            .whereType<Map<String, dynamic>>()
            .map(MtTableGroupModel.fromJson)
            .toList()
        : <MtTableGroupModel>[];
    if (groups.isEmpty) {
      groups = [MtTableGroupModel.fallbackMain()];
    }
    groups.sort((a, b) => a.order.compareTo(b.order));

    return MtInstanceModel(
      id: (json['id'] ?? '').toString(),
      orgId: (json['orgId'] ?? json['org_id'] ?? '').toString(),
      schoolId: (json['schoolId'] ?? json['school_id'] ?? '').toString(),
      definitionId: (json['definitionId'] ?? json['definition_id'] ?? '').toString(),
      definitionVersion: json['definitionVersion'] is num
          ? (json['definitionVersion'] as num).toInt()
          : (json['definition_version'] is num
              ? (json['definition_version'] as num).toInt()
              : 1),
      workspaceItemId: json['workspaceItemId'] as String? ??
          json['workspace_item_id'] as String?,
      title: (json['title'] ?? '').toString(),
      tableGroups: groups,
      createdAt: (json['createdAt'] ?? json['created_at'] ?? '').toString(),
      updatedAt: (json['updatedAt'] ?? json['updated_at'] ?? '').toString(),
    );
  }

  final String id;
  final String orgId;
  final String schoolId;
  final String definitionId;
  final int definitionVersion;
  final String? workspaceItemId;
  final String title;
  final List<MtTableGroupModel> tableGroups;
  final String createdAt;
  final String updatedAt;
}

class MtInstanceBundleModel {
  MtInstanceBundleModel({
    required this.instance,
    required this.definition,
  });

  factory MtInstanceBundleModel.fromJson(Map<String, dynamic> json) {
    return MtInstanceBundleModel(
      instance: MtInstanceModel.fromJson(
        (json['instance'] as Map<String, dynamic>?) ?? {},
      ),
      definition: MtDefinitionModel.fromJson(
        (json['definition'] as Map<String, dynamic>?) ?? {},
      ),
    );
  }

  final MtInstanceModel instance;
  final MtDefinitionModel definition;
}
