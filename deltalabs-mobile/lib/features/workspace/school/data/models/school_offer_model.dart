import 'package:deltalabs_mobile/features/workspace/school/create/domain/school_create_models.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/offer_amendment_payload.dart';

class SchoolOfferModel {
  SchoolOfferModel({
    required this.id,
    required this.orgId,
    required this.schoolId,
    required this.schoolName,
    required this.status,
    required this.requestedAt,
    this.updatedAt,
    this.listingId,
    this.offeredPrice,
    this.offeredCurrency,
    this.note,
    this.recipientEmail,
    this.senderEmail,
    this.negotiationTurn,
    this.partyFullName,
    this.partyEmail,
    this.ownershipPercentage,
    this.offerKind,
    this.shortlisted,
    this.shareAccesses,
    this.amendmentData,
  });

  factory SchoolOfferModel.fromJson(Map<String, dynamic> json) {
    return SchoolOfferModel(
      id: (json['id'] ?? '').toString(),
      orgId: (json['orgId'] ?? json['org_id'] ?? '').toString(),
      schoolId: (json['schoolId'] ?? json['school_id'] ?? '').toString(),
      schoolName: (json['schoolName'] ?? json['school_name'] ?? '').toString(),
      status: (json['status'] ?? '').toString(),
      requestedAt: (json['requestedAt'] ?? json['requested_at'] ?? '').toString(),
      updatedAt: (json['updatedAt'] ?? json['updated_at'])?.toString(),
      listingId: json['listingId'] as String? ?? json['listing_id'] as String?,
      offeredPrice: (json['offeredPrice'] ?? json['offered_price']) as num?,
      offeredCurrency:
          json['offeredCurrency'] as String? ?? json['offered_currency'] as String?,
      note: json['note'] as String?,
      recipientEmail: json['recipientEmail'] as String? ?? json['recipient_email'] as String?,
      senderEmail: json['senderEmail'] as String? ?? json['sender_email'] as String?,
      negotiationTurn:
          json['negotiationTurn'] as String? ?? json['negotiation_turn'] as String?,
      partyFullName: json['partyFullName'] as String? ?? json['party_full_name'] as String?,
      partyEmail: json['partyEmail'] as String? ?? json['party_email'] as String?,
      ownershipPercentage: (json['ownershipPercentage'] ?? json['ownership_percentage']) as num?,
      offerKind: json['offerKind'] as String? ?? json['offer_kind'] as String?,
      shortlisted: json['shortlisted'] as bool?,
      shareAccesses: _parseShareAccesses(json['shareAccesses'] ?? json['share_accesses']),
      amendmentData: _parseAmendmentData(json['amendmentData'] ?? json['amendment_data']),
    );
  }

  static List<SchoolShareAccess>? _parseShareAccesses(Object? raw) {
    if (raw is! List) return null;
    return raw
        .whereType<Map>()
        .map((e) => SchoolShareAccess.fromJson(Map<String, dynamic>.from(e)))
        .toList();
  }

  static OfferAmendmentData? _parseAmendmentData(Object? raw) {
    if (raw is! Map) return null;
    return OfferAmendmentData.fromJson(Map<String, dynamic>.from(raw));
  }

  final String id;
  final String orgId;
  final String schoolId;
  final String schoolName;
  final String status;
  final String requestedAt;
  final String? updatedAt;
  final String? listingId;
  final num? offeredPrice;
  final String? offeredCurrency;
  final String? note;
  final String? recipientEmail;
  final String? senderEmail;
  final String? negotiationTurn;
  final String? partyFullName;
  final String? partyEmail;
  final num? ownershipPercentage;
  final String? offerKind;
  final bool? shortlisted;
  final List<SchoolShareAccess>? shareAccesses;
  final OfferAmendmentData? amendmentData;
}
