import 'package:deltalabs_mobile/features/workspace/school/data/models/school_marketplace_item_model.dart';

class SchoolMarketplacePageModel {
  const SchoolMarketplacePageModel({
    required this.items,
    required this.total,
    required this.page,
    required this.pageSize,
  });

  factory SchoolMarketplacePageModel.fromJson(Map<String, dynamic> json) {
    final rawItems = json['items'] as List<dynamic>? ?? [];
    return SchoolMarketplacePageModel(
      items: rawItems
          .whereType<Map<String, dynamic>>()
          .map(SchoolMarketplaceItemModel.fromJson)
          .toList(),
      total: json['total'] as int? ?? rawItems.length,
      page: json['page'] as int? ?? 1,
      pageSize: json['pageSize'] as int? ?? json['page_size'] as int? ?? 20,
    );
  }

  final List<SchoolMarketplaceItemModel> items;
  final int total;
  final int page;
  final int pageSize;
}
