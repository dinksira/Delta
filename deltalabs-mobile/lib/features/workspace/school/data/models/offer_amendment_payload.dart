import 'package:deltalabs_mobile/features/workspace/school/create/domain/school_create_constants.dart';
import 'package:deltalabs_mobile/features/workspace/school/create/domain/school_create_models.dart';

/// Amendment body sent with `PATCH .../offers/{id}/status` (matches web).
class OfferAmendmentPayload {
  const OfferAmendmentPayload({
    this.ownershipPercentage,
    this.shareAccesses,
    this.offeredPrice,
    this.offeredCurrency,
    this.note,
  });

  final double? ownershipPercentage;
  final List<SchoolShareAccess>? shareAccesses;
  final double? offeredPrice;
  final String? offeredCurrency;
  final String? note;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    if (ownershipPercentage != null) {
      map['ownership_percentage'] = ownershipPercentage;
    }
    if (shareAccesses != null && shareAccesses!.isNotEmpty) {
      map['share_accesses'] = shareAccesses!.map((e) => e.toJson()).toList();
    }
    if (offeredPrice != null) {
      map['offered_price'] = offeredPrice;
    }
    if (offeredCurrency != null && offeredCurrency!.trim().isNotEmpty) {
      map['offered_currency'] = offeredCurrency!.trim().toUpperCase();
    }
    if (note != null) {
      map['note'] = note!.trim().isEmpty ? null : note!.trim();
    }
    return map;
  }
}

/// Parsed amendment snapshot on an offer (for pre-filling the amend form).
class OfferAmendmentData {
  const OfferAmendmentData({
    this.ownershipPercentage,
    this.shareAccesses,
    this.offeredPrice,
    this.offeredCurrency,
    this.note,
  });

  factory OfferAmendmentData.fromJson(Map<String, dynamic> json) {
    final sharesRaw = json['shareAccesses'] ?? json['share_accesses'];
    List<SchoolShareAccess>? shares;
    if (sharesRaw is List) {
      shares = sharesRaw
          .whereType<Map>()
          .map((e) => SchoolShareAccess.fromJson(Map<String, dynamic>.from(e)))
          .toList();
    }

    return OfferAmendmentData(
      ownershipPercentage: _num(json['ownershipPercentage'] ?? json['ownership_percentage']),
      shareAccesses: shares,
      offeredPrice: _num(json['offeredPrice'] ?? json['offered_price']),
      offeredCurrency: (json['offeredCurrency'] ?? json['offered_currency'])?.toString(),
      note: json['note']?.toString(),
    );
  }

  final double? ownershipPercentage;
  final List<SchoolShareAccess>? shareAccesses;
  final double? offeredPrice;
  final String? offeredCurrency;
  final String? note;

  static double? _num(Object? value) {
    if (value == null) return null;
    if (value is num) return value.toDouble();
    return double.tryParse(value.toString());
  }
}

String shareAccessStatusLabel(String status) {
  return SchoolCreateConstants.shareStatusLabels[status] ??
      status.replaceAll('_', ' ');
}

String _normalizeShareStatus(String? status) {
  if (status != null && SchoolCreateConstants.shareStatuses.contains(status)) {
    return status;
  }
  return 'can_view';
}

/// Merges assigned partner access onto the full access list (web amend modal behavior).
List<SchoolShareAccess> mergeOfferShareAccesses({
  OfferAmendmentData? amendmentData,
  List<SchoolShareAccess>? offerShareAccesses,
}) {
  final assigned = amendmentData?.shareAccesses ?? offerShareAccesses ?? const [];
  final assignedMap = <String, String>{
    for (final access in assigned) access.accessName: _normalizeShareStatus(access.status),
  };

  final merged = SchoolCreateConstants.shareAccessNames
      .map(
        (name) => SchoolShareAccess(
          accessName: name,
          status: assignedMap[name] ?? 'can_view',
        ),
      )
      .toList();

  for (final access in assigned) {
    if (!SchoolCreateConstants.shareAccessNames.contains(access.accessName)) {
      merged.add(
        SchoolShareAccess(
          accessName: access.accessName,
          status: _normalizeShareStatus(access.status),
        ),
      );
    }
  }

  return merged;
}

bool offerHasShareAccessDataFrom({
  OfferAmendmentData? amendmentData,
  List<SchoolShareAccess>? offerShareAccesses,
}) {
  final assigned = amendmentData?.shareAccesses ?? offerShareAccesses;
  return assigned != null && assigned.isNotEmpty;
}
