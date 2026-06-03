import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_offer_model.dart';
import 'package:flutter/material.dart';

/// Buyer reviews a seller counter on their marketplace bid.
class SchoolBidReviewSheet extends StatelessWidget {
  const SchoolBidReviewSheet({
    required this.offer,
    required this.onCounter,
    required this.onReject,
    super.key,
  });

  final SchoolOfferModel offer;
  final VoidCallback onCounter;
  final VoidCallback onReject;

  static Future<void> show(
    BuildContext context, {
    required SchoolOfferModel offer,
    required VoidCallback onCounter,
    required VoidCallback onReject,
  }) {
    final maxH = MediaQuery.sizeOf(context).height * 0.55;
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useRootNavigator: true,
      backgroundColor: Colors.transparent,
      barrierColor: Colors.black.withValues(alpha: 0.45),
      builder: (ctx) => Align(
        alignment: Alignment.bottomCenter,
        child: ConstrainedBox(
          constraints: BoxConstraints(maxHeight: maxH),
          child: SchoolBidReviewSheet(
            offer: offer,
            onCounter: onCounter,
            onReject: onReject,
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.paddingOf(context).bottom;

    return Material(
      color: Colors.transparent,
      child: Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: EdgeInsets.fromLTRB(20, 16, 20, 16 + bottom),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Review counter offer',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.primary),
            ),
            const SizedBox(height: 8),
            Text(
              '${offer.schoolName} • Countered to ${offer.offeredCurrency ?? 'USD'} ${offer.offeredPrice ?? 0}',
              style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 8),
            const Text(
              'Respond with a counter or reject. The seller accepts from Deal Room after shortlist.',
              style: TextStyle(fontSize: 12, color: AppColors.textHint, height: 1.4),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.of(context).pop(),
                    child: const Text('Close'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {
                      Navigator.of(context).pop();
                      onCounter();
                    },
                    child: const Text('Counter'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: FilledButton(
                    onPressed: () {
                      Navigator.of(context).pop();
                      onReject();
                    },
                    style: FilledButton.styleFrom(backgroundColor: const Color(0xFFB4233C)),
                    child: const Text('Reject'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
