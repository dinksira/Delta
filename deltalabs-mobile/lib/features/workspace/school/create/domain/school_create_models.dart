import 'package:deltalabs_mobile/features/workspace/school/create/domain/school_create_constants.dart';

class SchoolCustomField {
  const SchoolCustomField({required this.key, required this.value});

  final String key;
  final String value;

  SchoolCustomField copyWith({String? key, String? value}) {
    return SchoolCustomField(
      key: key ?? this.key,
      value: value ?? this.value,
    );
  }

  Map<String, dynamic> toJson() => {'key': key, 'value': value};

  factory SchoolCustomField.fromJson(Map<String, dynamic> json) {
    return SchoolCustomField(
      key: (json['key'] ?? '').toString(),
      value: (json['value'] ?? '').toString(),
    );
  }
}

class SchoolShareAccess {
  const SchoolShareAccess({required this.accessName, required this.status});

  final String accessName;
  final String status;

  SchoolShareAccess copyWith({String? status}) {
    return SchoolShareAccess(
      accessName: accessName,
      status: status ?? this.status,
    );
  }

  Map<String, dynamic> toJson() => {
        'access_name': accessName,
        'status': status,
      };

  factory SchoolShareAccess.fromJson(Map<String, dynamic> json) {
    return SchoolShareAccess(
      accessName: (json['accessName'] ?? json['access_name'] ?? '').toString(),
      status: (json['status'] ?? 'can_view').toString(),
    );
  }
}

class SchoolPartner {
  const SchoolPartner({
    required this.fullName,
    required this.email,
    required this.ownershipPercentage,
    required this.shareAccesses,
  });

  final String fullName;
  final String email;
  final String ownershipPercentage;
  final List<SchoolShareAccess> shareAccesses;

  SchoolPartner copyWith({List<SchoolShareAccess>? shareAccesses}) {
    return SchoolPartner(
      fullName: fullName,
      email: email,
      ownershipPercentage: ownershipPercentage,
      shareAccesses: shareAccesses ?? this.shareAccesses,
    );
  }

  Map<String, dynamic> toJson() => {
        'full_name': fullName,
        if (email.isNotEmpty) 'email': email,
        'ownership_percentage': double.tryParse(ownershipPercentage) ?? 0,
        'share_accesses': shareAccesses.map((e) => e.toJson()).toList(),
      };

  factory SchoolPartner.fromJson(Map<String, dynamic> json) {
    final shares = json['shareAccesses'] ?? json['share_accesses'];
    final ownershipRaw = json['ownershipPercentage'] ?? json['ownership_percentage'];
    final ownershipPercentage = ownershipRaw is num
        ? ownershipRaw.toString()
        : (ownershipRaw ?? '').toString();
    return SchoolPartner(
      fullName: (json['fullName'] ?? json['full_name'] ?? '').toString(),
      email: (json['email'] ?? '').toString(),
      ownershipPercentage: ownershipPercentage,
      shareAccesses: shares is List
          ? shares
              .whereType<Map>()
              .map((e) => SchoolShareAccess.fromJson(Map<String, dynamic>.from(e)))
              .toList()
          : const [],
    );
  }
}

class PartnerDraft {
  const PartnerDraft({
    this.fullName = '',
    this.email = '',
    this.ownershipPercentage = '',
  });

  final String fullName;
  final String email;
  final String ownershipPercentage;

  PartnerDraft copyWith({
    String? fullName,
    String? email,
    String? ownershipPercentage,
  }) {
    return PartnerDraft(
      fullName: fullName ?? this.fullName,
      email: email ?? this.email,
      ownershipPercentage: ownershipPercentage ?? this.ownershipPercentage,
    );
  }

  Map<String, dynamic> toJson() => {
        'fullName': fullName,
        'email': email,
        'ownershipPercentage': ownershipPercentage,
      };

  factory PartnerDraft.fromJson(Map<String, dynamic> json) {
    return PartnerDraft(
      fullName: (json['fullName'] ?? '').toString(),
      email: (json['email'] ?? '').toString(),
      ownershipPercentage: (json['ownershipPercentage'] ?? '').toString(),
    );
  }
}

enum DocumentUploadState { idle, uploading, uploaded, error }

class SchoolDocumentDraft {
  const SchoolDocumentDraft({
    this.title = '',
    this.url = '',
    this.uploadState = DocumentUploadState.idle,
  });

  final String title;
  final String url;
  final DocumentUploadState uploadState;

  SchoolDocumentDraft copyWith({
    String? title,
    String? url,
    DocumentUploadState? uploadState,
  }) {
    return SchoolDocumentDraft(
      title: title ?? this.title,
      url: url ?? this.url,
      uploadState: uploadState ?? this.uploadState,
    );
  }

  Map<String, dynamic> toJson() => {'title': title, 'url': url};

  factory SchoolDocumentDraft.fromJson(Map<String, dynamic> json) {
    return SchoolDocumentDraft(
      title: (json['title'] ?? '').toString(),
      url: (json['url'] ?? '').toString(),
    );
  }
}

List<SchoolShareAccess> defaultShareAccesses() {
  return SchoolCreateConstants.shareAccessNames
      .map((name) => SchoolShareAccess(accessName: name, status: 'can_view'))
      .toList();
}
