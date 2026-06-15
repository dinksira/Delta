import 'package:deltalabs_mobile/shared/management_table/data/models/mt_column_model.dart';

class MtDefinitionModel {
  MtDefinitionModel({
    required this.id,
    required this.orgId,
    required this.schoolId,
    required this.title,
    required this.visibility,
    required this.version,
    required this.columns,
    required this.createdByUserId,
    required this.createdAt,
    required this.updatedAt,
    this.sourceDefinitionId,
  });

  factory MtDefinitionModel.fromJson(Map<String, dynamic> json) {
    final rawColumns = json['columns'];
    final columns = rawColumns is List
        ? rawColumns
            .whereType<Map<String, dynamic>>()
            .map(MtColumnModel.fromJson)
            .toList()
        : <MtColumnModel>[];
    columns.sort((a, b) => a.order.compareTo(b.order));

    return MtDefinitionModel(
      id: (json['id'] ?? '').toString(),
      orgId: (json['orgId'] ?? json['org_id'] ?? '').toString(),
      schoolId: (json['schoolId'] ?? json['school_id'] ?? '').toString(),
      title: (json['title'] ?? '').toString(),
      visibility: (json['visibility'] ?? 'self_owned').toString(),
      sourceDefinitionId: json['sourceDefinitionId'] as String? ??
          json['source_definition_id'] as String?,
      version: json['version'] is num ? (json['version'] as num).toInt() : 1,
      columns: columns,
      createdByUserId:
          (json['createdByUserId'] ?? json['created_by_user_id'] ?? '').toString(),
      createdAt: (json['createdAt'] ?? json['created_at'] ?? '').toString(),
      updatedAt: (json['updatedAt'] ?? json['updated_at'] ?? '').toString(),
    );
  }

  final String id;
  final String orgId;
  final String schoolId;
  final String title;
  final String visibility;
  final String? sourceDefinitionId;
  final int version;
  final List<MtColumnModel> columns;
  final String createdByUserId;
  final String createdAt;
  final String updatedAt;
}
