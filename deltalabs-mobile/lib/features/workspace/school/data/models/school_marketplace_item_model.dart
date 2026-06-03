class SchoolMarketplaceItemModel {
  SchoolMarketplaceItemModel({
    required this.id,
    required this.orgId,
    required this.schoolId,
    required this.schoolName,
    required this.title,
    required this.description,
    required this.price,
    required this.currency,
    required this.status,
    required this.createdAt,
    required this.ownerUserId,
    this.schoolType,
    this.bidderUserId,
  });

  factory SchoolMarketplaceItemModel.fromJson(Map<String, dynamic> json) {
    return SchoolMarketplaceItemModel(
      id: (json['id'] ?? '').toString(),
      orgId: (json['orgId'] ?? json['org_id'] ?? '').toString(),
      schoolId: (json['schoolId'] ?? json['school_id'] ?? '').toString(),
      schoolName: (json['schoolName'] ?? json['school_name'] ?? '').toString(),
      title: (json['title'] ?? '').toString(),
      description: (json['description'] ?? '').toString(),
      price: (json['price'] as num?)?.toDouble() ?? 0,
      currency: (json['currency'] ?? 'USD').toString(),
      status: (json['status'] ?? '').toString(),
      createdAt: (json['createdAt'] ?? json['created_at'] ?? '').toString(),
      ownerUserId: (json['ownerUserId'] ?? json['owner_user_id'] ?? '').toString(),
      schoolType: json['schoolType'] as String? ?? json['school_type'] as String?,
      bidderUserId: (json['bidderUserId'] ?? json['bidder_user_id'])?.toString(),
    );
  }

  final String id;
  final String orgId;
  final String schoolId;
  final String schoolName;
  final String title;
  final String description;
  final double price;
  final String currency;
  final String status;
  final String createdAt;
  final String ownerUserId;
  final String? schoolType;
  final String? bidderUserId;

  bool isOwnedBy(String? userId) =>
      userId != null && userId.isNotEmpty && ownerUserId == userId;

  bool get isTerminal => status == 'sold' || status == 'withdrawn';
}
