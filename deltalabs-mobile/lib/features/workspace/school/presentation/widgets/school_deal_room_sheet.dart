import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_marketplace_item_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_offer_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/providers/school_providers.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_deal_room_table.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_offer_detail_sheet.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_state_panel.dart';
import 'package:deltalabs_mobile/shared/widgets/loading/dl_loading_indicator.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

/// Listing deal room — seller manages incoming bids (web parity).
class SchoolDealRoomSheet extends ConsumerWidget {
  const SchoolDealRoomSheet({
    required this.listing,
    required this.onOfferAction,
    this.onWithdrawListing,
    super.key,
  });

  final SchoolMarketplaceItemModel listing;
  final Future<void> Function(SchoolOfferModel offer, String action) onOfferAction;
  final Future<void> Function()? onWithdrawListing;

  static Future<void> show(
    BuildContext context, {
    required SchoolMarketplaceItemModel listing,
    required Future<void> Function(SchoolOfferModel offer, String action) onOfferAction,
    Future<void> Function()? onWithdrawListing,
  }) {
    final maxH = MediaQuery.sizeOf(context).height * 0.92;
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
          child: SchoolDealRoomSheet(
            listing: listing,
            onOfferAction: onOfferAction,
            onWithdrawListing: onWithdrawListing,
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bottom = MediaQuery.paddingOf(context).bottom;
    final query = (orgId: listing.orgId, listingId: listing.id);
    final offersAsync = ref.watch(schoolDealRoomOffersProvider(query));

    return Material(
      color: Colors.transparent,
      child: Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 10),
            Container(
              width: 44,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.divider,
                borderRadius: BorderRadius.circular(999),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 12, 8),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Listing deal room',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                            color: AppColors.primary,
                          ),
                        ),
                        Text(
                          listing.title,
                          style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close_rounded, color: AppColors.textSecondary),
                  ),
                ],
              ),
            ),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 20),
              child: Text(
                'Shortlist a preferred bidder, then accept the final offer. Other bids stay active until you accept.',
                style: TextStyle(fontSize: 12, color: AppColors.textSecondary, height: 1.4),
              ),
            ),
            const SizedBox(height: 12),
            Flexible(
              child: offersAsync.when(
                loading: () => const Center(child: DlLoadingIndicator()),
                error: (e, _) => SchoolStatePanel(
                  icon: Icons.error_outline_rounded,
                  title: 'Could not load offers',
                  message: 'Only the listing owner can open deal room.',
                  actionLabel: 'Retry',
                  onAction: () => ref.invalidate(schoolDealRoomOffersProvider(query)),
                ),
                data: (offers) => SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                  child: SchoolDealRoomTable(
                    offers: offers,
                    onShowDetails: (offer) => SchoolOfferDetailSheet.show(context, offer),
                    onAction: (offer, action) async {
                      await onOfferAction(offer, action);
                      ref.invalidate(schoolDealRoomOffersProvider(query));
                    },
                  ),
                ),
              ),
            ),
            Padding(
              padding: EdgeInsets.fromLTRB(20, 8, 20, 12 + bottom),
              child: Row(
                children: [
                  if (!listing.isTerminal && onWithdrawListing != null)
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () async {
                          await onWithdrawListing!();
                          if (context.mounted) Navigator.of(context).pop();
                        },
                        child: const Text('Withdraw listing'),
                      ),
                    ),
                  if (!listing.isTerminal && onWithdrawListing != null) const SizedBox(width: 10),
                  Expanded(
                    child: FilledButton(
                      onPressed: () => Navigator.of(context).pop(),
                      style: FilledButton.styleFrom(backgroundColor: AppColors.primary),
                      child: const Text('Close'),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
