import 'dart:async';

import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/auth/presentation/providers/auth_provider.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_marketplace_item_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_marketplace_page_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_offer_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/providers/school_providers.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_amend_offer_sheet.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_bid_review_sheet.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_confirm_dialog.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_deal_room_sheet.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_deal_room_table.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_hub_search_bar.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_hub_table_controls.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_marketplace_listing_detail_sheet.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_marketplace_sheets.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_marketplace_table.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_offer_confirm_dialog.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_offer_detail_sheet.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_state_panel.dart';
import 'package:deltalabs_mobile/shared/widgets/loading/dl_loading_indicator.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

class SchoolMarketplacePage extends HookConsumerWidget {
  const SchoolMarketplacePage({super.key});

  static const _views = ['community', 'bids', 'listings'];
  static const _viewLabels = ['Community', 'My bids', 'My listings'];
  static const _listingStatuses = ['', 'active', 'under_offer', 'sold', 'withdrawn'];
  static const _listingStatusLabels = ['All', 'Active', 'Under offer', 'Sold', 'Withdrawn'];
  static const _bidStatuses = ['requested', 'approved', 'amendment', 'rejected'];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final viewIndex = useState(0);
    final statusIndex = useState(0);
    final search = useState('');
    final debouncedSearch = useState('');
    final actionLoading = useState(false);

    final view = _views[viewIndex.value];
    final isBidsView = view == 'bids';
    final sessionUserId = ref.watch(authProvider).value?.userId;

    useEffect(() {
      final timer = Timer(const Duration(milliseconds: 350), () {
        debouncedSearch.value = search.value.trim();
      });
      return timer.cancel;
    }, [search.value]);

    final listingStatus = _listingStatuses[statusIndex.value];
    final marketplaceQuery = (
      view: view,
      search: debouncedSearch.value.isEmpty ? null : debouncedSearch.value,
      status: isBidsView ? null : (listingStatus.isEmpty ? null : listingStatus),
    );
    final listingsAsync = ref.watch(schoolMarketplaceProvider(marketplaceQuery));
    final schoolsAsync = ref.watch(myActiveSchoolsProvider);

    final bidStatus = _bidStatuses[statusIndex.value];
    final bidOffersQuery = (status: bidStatus, view: 'sent');
    final bidOffersAsync = ref.watch(schoolOffersProvider(bidOffersQuery));

    final ds = ref.read(schoolRemoteDataSourceProvider);

    void refreshAll() {
      ref.invalidate(schoolMarketplaceProvider(marketplaceQuery));
      ref.invalidate(schoolOffersProvider(bidOffersQuery));
      ref.invalidate(schoolHubSummaryProvider);
    }

    Future<void> runAction(Future<void> Function() action, {String? success}) async {
      if (actionLoading.value) return;
      actionLoading.value = true;
      try {
        await action();
        refreshAll();
        if (context.mounted && success != null) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(success)));
        }
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(_friendlyError(e))),
          );
        }
      } finally {
        actionLoading.value = false;
      }
    }

    Future<void> submitOfferStatus(
      SchoolOfferModel offer,
      String nextStatus, {
      Map<String, dynamic>? amendmentData,
    }) async {
      await runAction(() async {
        await ds.updateOfferStatus(
          orgId: offer.orgId,
          offerId: offer.id,
          status: nextStatus,
          amendmentData: amendmentData,
        );
      }, success: 'Offer updated');
    }

    Future<void> onDealRoomAction(SchoolOfferModel offer, String action) async {
      if (action == 'shortlist') {
        await runAction(
          () => ds.shortlistOffer(orgId: offer.orgId, offerId: offer.id),
          success: 'Bid shortlisted',
        );
        return;
      }
      if (action == 'unshortlist') {
        await runAction(
          () => ds.unshortlistOffer(orgId: offer.orgId, offerId: offer.id),
          success: 'Bid unshortlisted',
        );
        return;
      }
      if (action == 'amendment') {
        final payload = await SchoolAmendOfferSheet.show(context, offer);
        if (payload == null || !context.mounted) return;
        await submitOfferStatus(offer, 'amendment', amendmentData: payload.toJson());
        return;
      }
      if (action == 'approved') {
        final confirmed = await SchoolOfferConfirmDialog.showApprove(context, offer);
        if (!confirmed || !context.mounted) return;
        await submitOfferStatus(offer, 'approved');
        return;
      }
      if (action == 'rejected') {
        final confirmed = await SchoolOfferConfirmDialog.showReject(context, offer);
        if (!confirmed || !context.mounted) return;
        await submitOfferStatus(offer, 'rejected');
      }
    }

    Future<void> openBidSheet(SchoolMarketplaceItemModel item) async {
      if (item.isOwnedBy(sessionUserId)) return;
      final result = await SchoolPlaceBidSheet.show(context, item);
      if (result == null || !context.mounted) return;
      if (result.isBuyNow) {
        await runAction(
          () => ds.buyMarketplaceListing(item.id),
          success: 'Buy now offer submitted',
        );
      } else {
        await runAction(
          () => ds.placeMarketplaceBid(
            listingId: item.id,
            offeredPrice: result.price,
            offeredCurrency: item.currency,
            note: result.note,
          ),
          success: 'Bid submitted',
        );
      }
    }

    Future<void> openDealRoom(SchoolMarketplaceItemModel item) async {
      await SchoolDealRoomSheet.show(
        context,
        listing: item,
        onOfferAction: onDealRoomAction,
        onWithdrawListing: item.isTerminal
            ? null
            : () async {
                final ok = await SchoolConfirmDialog.show(
                  context,
                  title: 'Withdraw listing?',
                  description: 'This hides the listing from the marketplace.',
                  confirmLabel: 'Withdraw',
                  confirmColor: const Color(0xFFB4233C),
                );
                if (!ok || !context.mounted) return;
                await runAction(
                  () => ds.withdrawMarketplaceListing(item.id),
                  success: 'Listing withdrawn',
                );
              },
      );
    }

    Future<void> createListing() async {
      final schools = schoolsAsync.value ?? [];
      if (schools.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Create a school before listing on the marketplace.')),
        );
        return;
      }
      final form = await SchoolCreateListingSheet.show(context, schools: schools);
      if (form == null || !context.mounted) return;
      await runAction(
        () => ds.createMarketplaceListing(
          orgId: form.orgId,
          schoolId: form.schoolId,
          title: form.title,
          description: form.description,
          price: form.price,
          currency: form.currency,
        ),
        success: 'Listing created',
      );
    }

    Future<void> editListing(SchoolMarketplaceItemModel item) async {
      final form = await SchoolEditListingSheet.show(context, item);
      if (form == null || !context.mounted) return;
      await runAction(
        () => ds.updateMarketplaceListing(
          listingId: item.id,
          title: form.title,
          description: form.description,
          price: form.price,
          currency: form.currency,
        ),
        success: 'Listing updated',
      );
    }

    Future<void> deleteListing(SchoolMarketplaceItemModel item) async {
      final ok = await SchoolConfirmDialog.show(
        context,
        title: 'Delete listing?',
        description: 'This permanently removes the listing. It only works when no bids exist.',
        confirmLabel: 'Delete',
        confirmColor: const Color(0xFFB4233C),
      );
      if (!ok || !context.mounted) return;
      await runAction(
        () => ds.deleteMarketplaceListing(item.id),
        success: 'Listing deleted',
      );
    }

    Future<void> withdrawBid(SchoolOfferModel offer) async {
      final ok = await SchoolConfirmDialog.show(
        context,
        title: 'Withdraw bid?',
        description: 'This removes your active bid. You can submit a new bid later.',
        confirmLabel: 'Withdraw bid',
        confirmColor: const Color(0xFFB4233C),
      );
      if (!ok || !context.mounted) return;
      await runAction(
        () => ds.withdrawMarketplaceBid(offer.id),
        success: 'Bid withdrawn',
      );
    }

    void reviewCounter(SchoolOfferModel offer) {
      SchoolBidReviewSheet.show(
        context,
        offer: offer,
        onCounter: () async {
          final payload = await SchoolAmendOfferSheet.show(context, offer);
          if (payload == null || !context.mounted) return;
          await submitOfferStatus(offer, 'amendment', amendmentData: payload.toJson());
        },
        onReject: () async {
          final ok = await SchoolConfirmDialog.show(
            context,
            title: 'Reject counter offer',
            description: 'This rejects the seller counter for your marketplace bid.',
            confirmLabel: 'Reject',
            confirmColor: const Color(0xFFB4233C),
          );
          if (!ok || !context.mounted) return;
          await submitOfferStatus(offer, 'rejected');
        },
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
          child: Row(
            children: [
              Expanded(
                child: SchoolHubSearchBar(
                  hintText: 'Search marketplace',
                  onChanged: (v) => search.value = v,
                ),
              ),
              const SizedBox(width: 8),
              FilledButton.icon(
                onPressed: actionLoading.value ? null : createListing,
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                ),
                icon: const Icon(Icons.add_rounded, size: 18),
                label: const Text('List'),
              ),
            ],
          ),
        ),
        const SizedBox(height: 10),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: [
              for (var i = 0; i < _views.length; i++)
                Expanded(
                  child: Padding(
                    padding: EdgeInsets.only(right: i < _views.length - 1 ? 8 : 0),
                    child: SchoolHubSegmentButton(
                      label: _viewLabels[i],
                      selected: viewIndex.value == i,
                      onTap: () {
                        viewIndex.value = i;
                        statusIndex.value = 0;
                      },
                    ),
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 10),
        SizedBox(
          height: 40,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: isBidsView ? _bidStatuses.length : _listingStatuses.length,
            separatorBuilder: (_, __) => const SizedBox(width: 8),
            itemBuilder: (context, index) {
              final label = isBidsView
                  ? _bidStatuses[index][0].toUpperCase() + _bidStatuses[index].substring(1)
                  : _listingStatusLabels[index];
              return SchoolHubStatusFilterChip(
                label: label,
                selected: statusIndex.value == index,
                onTap: () => statusIndex.value = index,
              );
            },
          ),
        ),
        const SizedBox(height: 8),
        if (actionLoading.value)
          const LinearProgressIndicator(
            minHeight: 2,
            color: AppColors.primary,
            backgroundColor: Colors.transparent,
          ),
        Expanded(
          child: isBidsView
              ? _BidsTableBody(
                  offersAsync: bidOffersAsync,
                  query: bidOffersQuery,
                  onShowDetails: (o) => SchoolOfferDetailSheet.show(context, o),
                  onReviewCounter: reviewCounter,
                  onWithdraw: withdrawBid,
                )
              : _ListingsTableBody(
                  listingsAsync: listingsAsync,
                  query: marketplaceQuery,
                  sessionUserId: sessionUserId,
                  onShowDetails: (item) => SchoolMarketplaceListingDetailSheet.show(context, item),
                  onBid: openBidSheet,
                  onDealRoom: openDealRoom,
                  onEdit: editListing,
                  onDelete: deleteListing,
                ),
        ),
      ],
    );
  }

  String _friendlyError(Object e) {
    final msg = e.toString();
    if (msg.contains('marketplace_bid_already_exists')) {
      return 'You already have an active bid on this listing. Check My bids.';
    }
    if (msg.contains('marketplace_approve_requires_shortlist')) {
      return 'Shortlist this bid before accepting.';
    }
    return 'Could not complete marketplace action. Try again.';
  }
}

class _ListingsTableBody extends ConsumerWidget {
  const _ListingsTableBody({
    required this.listingsAsync,
    required this.query,
    required this.sessionUserId,
    required this.onShowDetails,
    required this.onBid,
    required this.onDealRoom,
    required this.onEdit,
    required this.onDelete,
  });

  final AsyncValue<SchoolMarketplacePageModel> listingsAsync;
  final SchoolMarketplaceQuery query;
  final String? sessionUserId;
  final void Function(SchoolMarketplaceItemModel item) onShowDetails;
  final Future<void> Function(SchoolMarketplaceItemModel item) onBid;
  final Future<void> Function(SchoolMarketplaceItemModel item) onDealRoom;
  final Future<void> Function(SchoolMarketplaceItemModel item) onEdit;
  final Future<void> Function(SchoolMarketplaceItemModel item) onDelete;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return listingsAsync.when(
      loading: () => const Center(child: DlLoadingIndicator()),
      error: (e, _) => SchoolStatePanel(
        icon: Icons.error_outline_rounded,
        title: 'Could not load marketplace',
        message: 'Pull to refresh or try again later.',
        actionLabel: 'Retry',
        onAction: () => ref.invalidate(schoolMarketplaceProvider(query)),
      ),
      data: (page) {
        if (page.items.isEmpty) {
          return SchoolStatePanel(
            icon: Icons.storefront_outlined,
            title: 'No listings',
            message: query.view == 'community'
                ? 'No community listings match your filters.'
                : 'No items in this tab.',
          );
        }
        return RefreshIndicator(
          color: AppColors.primary,
          onRefresh: () async => ref.invalidate(schoolMarketplaceProvider(query)),
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
            children: [
              const Text(
                'Marketplace queue',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                '${page.total} listing${page.total == 1 ? '' : 's'}',
                style: const TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 10),
              SchoolMarketplaceTable(
                items: page.items,
                view: query.view,
                sessionUserId: sessionUserId,
                onShowDetails: onShowDetails,
                onBid: (item) => onBid(item),
                onDealRoom: (item) => onDealRoom(item),
                onEdit: (item) => onEdit(item),
                onDelete: (item) => onDelete(item),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _BidsTableBody extends ConsumerWidget {
  const _BidsTableBody({
    required this.offersAsync,
    required this.query,
    required this.onShowDetails,
    required this.onReviewCounter,
    required this.onWithdraw,
  });

  final AsyncValue<List<SchoolOfferModel>> offersAsync;
  final SchoolOffersQuery query;
  final void Function(SchoolOfferModel offer) onShowDetails;
  final void Function(SchoolOfferModel offer) onReviewCounter;
  final Future<void> Function(SchoolOfferModel offer) onWithdraw;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return offersAsync.when(
      loading: () => const Center(child: DlLoadingIndicator()),
      error: (e, _) => SchoolStatePanel(
        icon: Icons.error_outline_rounded,
        title: 'Could not load bids',
        message: 'Pull to refresh or try again later.',
        actionLabel: 'Retry',
        onAction: () => ref.invalidate(schoolOffersProvider(query)),
      ),
      data: (offers) {
        final marketplaceOffers = offers
            .where((o) => o.offerKind == 'marketplace_transfer')
            .toList();
        if (marketplaceOffers.isEmpty) {
          return SchoolStatePanel(
            icon: Icons.local_offer_outlined,
            title: 'No bids',
            message: 'No ${query.status} marketplace bids in your sent queue.',
          );
        }
        return RefreshIndicator(
          color: AppColors.primary,
          onRefresh: () async => ref.invalidate(schoolOffersProvider(query)),
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
            children: [
              const Text(
                'Bid queue',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(height: 10),
              SchoolMarketplaceBidsTable(
                offers: marketplaceOffers,
                onShowDetails: onShowDetails,
                onReviewCounter: onReviewCounter,
                onWithdraw: (offer) => onWithdraw(offer),
              ),
            ],
          ),
        );
      },
    );
  }
}
