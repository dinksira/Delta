import 'package:deltalabs_mobile/features/workspace/school/create/domain/school_create_models.dart';

double parseOwnership(String value) {
  final parsed = double.tryParse(value);
  return parsed != null && parsed.isFinite ? parsed : 0;
}

bool isValidEmail(String email) {
  final trimmed = email.trim();
  if (trimmed.isEmpty) return false;
  return RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(trimmed);
}

class SchoolCreateValidation {
  const SchoolCreateValidation({
    this.nameError,
    this.typeError,
    this.emailError,
    this.partnerNameError,
    this.partnerEmailError,
    this.partnerOwnershipError,
    this.continueHint,
    this.canContinue = true,
  });

  final String? nameError;
  final String? typeError;
  final String? emailError;
  final String? partnerNameError;
  final String? partnerEmailError;
  final String? partnerOwnershipError;
  final String? continueHint;
  final bool canContinue;

  static SchoolCreateValidation forStep({
    required int stepIndex,
    required String name,
    required String schoolType,
    required String email,
    required PartnerDraft partnerDraft,
    required List<SchoolPartner> partners,
    required String? creatorEmail,
  }) {
    final nameError =
        name.trim().isEmpty ? 'School name is required.' : null;
    final typeError =
        schoolType.trim().isEmpty ? 'School type is required.' : null;
    final emailError = email.trim().isNotEmpty && !isValidEmail(email)
        ? 'Enter a valid email.'
        : null;

    final ownershipTotal =
        partners.fold<double>(0, (s, p) => s + parseOwnership(p.ownershipPercentage));
    final ownershipRemaining = 100 - ownershipTotal;
    final remainingLabel = ownershipRemaining.toStringAsFixed(2).replaceAll(RegExp(r'\.00$'), '');

    final partnerNameError = partnerDraft.fullName.trim().isEmpty
        ? 'Partner full name is required.'
        : null;
    final partnerEmailError = partnerDraft.email.trim().isEmpty
        ? 'Partner email is required.'
        : !isValidEmail(partnerDraft.email)
            ? 'Enter a valid partner email.'
            : null;
    final partnerOwnershipValue = parseOwnership(partnerDraft.ownershipPercentage);
    final partnerOwnershipError = partnerDraft.ownershipPercentage.trim().isEmpty
        ? 'Ownership percentage is required.'
        : partnerOwnershipValue < 0 || partnerOwnershipValue > 100
            ? 'Ownership must be between 0 and 100.'
            : partnerOwnershipValue > ownershipRemaining
                ? 'Ownership exceeds remaining share ($remainingLabel%).'
                : null;

    final partnersMissingShare = partners.where((partner) {
      if (creatorEmail != null &&
          creatorEmail == partner.email.trim().toLowerCase()) {
        return false;
      }
      return partner.shareAccesses.isEmpty;
    }).toList();

    switch (stepIndex) {
      case 0:
        return SchoolCreateValidation(
          nameError: nameError,
          typeError: typeError,
          emailError: emailError,
          canContinue: nameError == null && typeError == null && emailError == null,
        );
      case 1:
        return SchoolCreateValidation(
          partnerNameError: partnerNameError,
          partnerEmailError: partnerEmailError,
          partnerOwnershipError: partnerOwnershipError,
          canContinue: partnerNameError == null &&
              partnerEmailError == null &&
              partnerOwnershipError == null,
        );
      case 2:
        final ok = partners.isEmpty || (ownershipTotal - 100).abs() < 0.001;
        return SchoolCreateValidation(
          canContinue: ok,
          continueHint: ok
              ? null
              : 'Adjust owner shares to total exactly 100% (current: ${ownershipTotal.toStringAsFixed(2).replaceAll(RegExp(r'\.00$'), '')}%).',
        );
      case 3:
        final ok = partners.isNotEmpty && partnersMissingShare.isEmpty;
        return SchoolCreateValidation(
          canContinue: ok,
          continueHint: ok
              ? null
              : partners.isEmpty
                  ? 'Add at least one partner before assigning school share.'
                  : 'Each partner must have school share permissions configured.',
        );
      default:
        return const SchoolCreateValidation();
    }
  }
}
