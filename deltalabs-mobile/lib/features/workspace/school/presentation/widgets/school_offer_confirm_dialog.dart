import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_offer_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_confirm_dialog.dart';
import 'package:flutter/material.dart';

/// Confirmation dialog for approve / reject offer actions.
class SchoolOfferConfirmDialog {
  SchoolOfferConfirmDialog._();

  static Future<bool> showApprove(BuildContext context, SchoolOfferModel offer) {
    return SchoolConfirmDialog.show(
      context,
      title: 'Confirm acceptance',
      description:
          'Accepting this offer for ${offer.schoolName} will confirm the request '
          'and notify Delta Labs. The offer will move to Approved status.',
      confirmLabel: 'Accept offer',
      confirmColor: AppColors.primary,
    );
  }

  static Future<bool> showReject(BuildContext context, SchoolOfferModel offer) {
    return SchoolConfirmDialog.show(
      context,
      title: 'Confirm rejection',
      description:
          'Rejecting this offer for ${offer.schoolName} will decline the proposed '
          'allocation and send a Delta Labs confirmation to the provider.',
      confirmLabel: 'Reject offer',
      confirmColor: const Color(0xFFB4233C),
    );
  }
}
