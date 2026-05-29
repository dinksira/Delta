import 'package:deltalabs_mobile/features/workspace/school/create/domain/school_create_models.dart';

/// Full school record from GET /orgs/{orgId}/schools/{schoolId}.
class SchoolDetailModel {
  const SchoolDetailModel({
    required this.id,
    required this.orgId,
    required this.name,
    required this.slug,
    required this.schoolType,
    this.email,
    this.logoUrl,
    this.customFields = const [],
    this.partners = const [],
    this.documents = const [],
    this.archived = false,
    this.onboardingStatus = 'active',
    this.createdAt,
    this.updatedAt,
  });

  factory SchoolDetailModel.fromJson(Map<String, dynamic> json) {
    final customFieldsRaw = json['customFields'] ?? json['custom_fields'];
    final partnersRaw = json['partners'];
    final documentsRaw = json['documents'];

    return SchoolDetailModel(
      id: (json['id'] ?? '').toString(),
      orgId: (json['orgId'] ?? json['org_id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      slug: (json['slug'] ?? '').toString(),
      schoolType: (json['schoolType'] ?? json['school_type'] ?? '').toString(),
      email: json['email'] as String?,
      logoUrl: json['logoUrl'] as String? ?? json['logo_url'] as String?,
      customFields: customFieldsRaw is List
          ? customFieldsRaw
              .whereType<Map>()
              .map((e) => SchoolCustomField.fromJson(Map<String, dynamic>.from(e)))
              .toList()
          : const [],
      partners: partnersRaw is List
          ? partnersRaw
              .whereType<Map>()
              .map((e) => SchoolPartner.fromJson(Map<String, dynamic>.from(e)))
              .toList()
          : const [],
      documents: documentsRaw is List
          ? documentsRaw
              .whereType<Map>()
              .map((e) => SchoolDocumentDraft.fromJson(Map<String, dynamic>.from(e)))
              .toList()
          : const [],
      archived: json['archived'] == true,
      onboardingStatus: (json['onboardingStatus'] ?? json['onboarding_status'] ?? 'active')
          .toString(),
      createdAt: _parseDate(json['createdAt'] ?? json['created_at']),
      updatedAt: _parseDate(json['updatedAt'] ?? json['updated_at']),
    );
  }

  static DateTime? _parseDate(Object? raw) {
    if (raw == null) return null;
    return DateTime.tryParse(raw.toString());
  }

  final String id;
  final String orgId;
  final String name;
  final String slug;
  final String schoolType;
  final String? email;
  final String? logoUrl;
  final List<SchoolCustomField> customFields;
  final List<SchoolPartner> partners;
  final List<SchoolDocumentDraft> documents;
  final bool archived;
  final String onboardingStatus;
  final DateTime? createdAt;
  final DateTime? updatedAt;
}
