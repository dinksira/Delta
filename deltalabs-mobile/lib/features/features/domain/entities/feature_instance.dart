/// A user-created shortcut to a feature workspace (like a Telegram chat/folder).
class FeatureInstance {
  const FeatureInstance({
    required this.id,
    required this.featureKey,
    required this.categoryId,
    required this.createdAt,
    this.label,
    this.schoolId,
    this.lastLocation,
  });

  factory FeatureInstance.fromJson(Map<String, dynamic> json) {
    return FeatureInstance(
      id: (json['id'] ?? '').toString(),
      featureKey: (json['featureKey'] ?? json['feature_key'] ?? '').toString(),
      categoryId: (json['categoryId'] ?? json['category_id'] ?? 'all').toString(),
      label: json['label'] as String?,
      schoolId: json['schoolId'] as String? ?? json['school_id'] as String?,
      lastLocation: json['lastLocation'] as String? ?? json['last_location'] as String?,
      createdAt: DateTime.tryParse((json['createdAt'] ?? json['created_at'] ?? '').toString()) ??
          DateTime.now(),
    );
  }

  final String id;
  final String featureKey;
  final String categoryId;
  final String? label;
  final String? schoolId;

  /// Last workspace URI (path + query) — restored when reopening this instance.
  final String? lastLocation;
  final DateTime createdAt;

  Map<String, dynamic> toJson() => {
        'id': id,
        'featureKey': featureKey,
        'categoryId': categoryId,
        if (label != null && label!.trim().isNotEmpty) 'label': label,
        if (schoolId != null && schoolId!.trim().isNotEmpty) 'schoolId': schoolId,
        if (lastLocation != null && lastLocation!.trim().isNotEmpty)
          'lastLocation': lastLocation,
        'createdAt': createdAt.toIso8601String(),
      };

  FeatureInstance copyWith({
    String? label,
    String? schoolId,
    String? lastLocation,
    bool clearLabel = false,
    bool clearSchoolId = false,
    bool clearLastLocation = false,
  }) {
    return FeatureInstance(
      id: id,
      featureKey: featureKey,
      categoryId: categoryId,
      label: clearLabel ? null : (label ?? this.label),
      schoolId: clearSchoolId ? null : (schoolId ?? this.schoolId),
      lastLocation: clearLastLocation ? null : (lastLocation ?? this.lastLocation),
      createdAt: createdAt,
    );
  }
}
