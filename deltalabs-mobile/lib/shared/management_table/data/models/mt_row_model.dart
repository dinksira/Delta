class MtRowModel {
  MtRowModel({
    required this.id,
    required this.instanceId,
    required this.position,
    required this.cells,
    required this.createdAt,
    required this.updatedAt,
    this.groupId,
  });

  factory MtRowModel.fromJson(Map<String, dynamic> json) {
    return MtRowModel(
      id: (json['id'] ?? '').toString(),
      instanceId: (json['instanceId'] ?? json['instance_id'] ?? '').toString(),
      groupId: json['groupId'] as String? ?? json['group_id'] as String?,
      position: json['position'] is num ? (json['position'] as num).toInt() : 0,
      cells: _parseCells(json['cells']),
      createdAt: (json['createdAt'] ?? json['created_at'] ?? '').toString(),
      updatedAt: (json['updatedAt'] ?? json['updated_at'] ?? '').toString(),
    );
  }

  static Map<String, dynamic> _parseCells(Object? raw) {
    if (raw is Map<String, dynamic>) return Map<String, dynamic>.from(raw);
    if (raw is Map) return raw.map((k, v) => MapEntry(k.toString(), v));
    return const {};
  }

  final String id;
  final String instanceId;
  final String? groupId;
  final int position;
  final Map<String, dynamic> cells;
  final String createdAt;
  final String updatedAt;

  Object? cellValue(String columnId) => cells[columnId];

  MtRowModel copyWithCells(Map<String, dynamic> patch) {
    return MtRowModel(
      id: id,
      instanceId: instanceId,
      groupId: groupId,
      position: position,
      cells: {...cells, ...patch},
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }
}

class MtRowListModel {
  MtRowListModel({
    required this.items,
    required this.total,
  });

  factory MtRowListModel.fromJson(Map<String, dynamic> json) {
    final rawItems = json['items'];
    return MtRowListModel(
      items: rawItems is List
          ? rawItems
              .whereType<Map<String, dynamic>>()
              .map(MtRowModel.fromJson)
              .toList()
          : const [],
      total: json['total'] is num ? (json['total'] as num).toInt() : 0,
    );
  }

  final List<MtRowModel> items;
  final int total;
}
