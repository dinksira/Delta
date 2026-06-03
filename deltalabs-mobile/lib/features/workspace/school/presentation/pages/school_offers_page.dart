import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_offer_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/providers/school_providers.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_amend_offer_sheet.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_hub_table_controls.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_offer_confirm_dialog.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_offer_detail_sheet.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_offers_table.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_state_panel.dart';
import 'package:deltalabs_mobile/shared/widgets/loading/dl_loading_indicator.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

class SchoolOffersPage extends HookConsumerWidget {
  const SchoolOffersPage({super.key});

  static const _statuses = ['requested', 'approved', 'amendment', 'rejected'];
  static const _views = ['received', 'sent'];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statusIndex = useState(0);
    final viewIndex = useState(0);
    final actionLoading = useState(false);

    final status = _statuses[statusIndex.value];
    final view = _views[viewIndex.value];
    final query = (status: status, view: view);
    final offersAsync = ref.watch(schoolOffersProvider(query));

    Future<void> submitStatus(
      SchoolOfferModel offer,
      String nextStatus, {
      Map<String, dynamic>? amendmentData,
    }) async {
      if (actionLoading.value) return;
      actionLoading.value = true;
      try {
        await ref.read(schoolRemoteDataSourceProvider).updateOfferStatus(
              orgId: offer.orgId,
              offerId: offer.id,
              status: nextStatus,
              amendmentData: amendmentData,
            );
        ref.invalidate(schoolOffersProvider(query));
        ref.invalidate(schoolHubSummaryProvider);
        if (context.mounted) {
          final label = nextStatus == 'approved'
              ? 'accepted'
              : nextStatus == 'rejected'
                  ? 'rejected'
                  : nextStatus;
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Offer $label')),
          );
        }
      } catch (_) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Could not update offer status')),
          );
        }
      } finally {
        actionLoading.value = false;
      }
    }

    Future<void> onChangeStatus(SchoolOfferModel offer, String nextStatus) async {
      if (actionLoading.value) return;

      if (nextStatus == 'amendment') {
        final payload = await SchoolAmendOfferSheet.show(context, offer);
        if (payload == null || !context.mounted) return;
        await submitStatus(offer, 'amendment', amendmentData: payload.toJson());
        return;
      }

      if (nextStatus == 'approved') {
        final confirmed = await SchoolOfferConfirmDialog.showApprove(context, offer);
        if (!confirmed || !context.mounted) return;
        await submitStatus(offer, 'approved');
        return;
      }

      if (nextStatus == 'rejected') {
        final confirmed = await SchoolOfferConfirmDialog.showReject(context, offer);
        if (!confirmed || !context.mounted) return;
        await submitStatus(offer, 'rejected');
      }
    }

    void showDetails(SchoolOfferModel offer) {
      SchoolOfferDetailSheet.show(context, offer);
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
          child: Row(
            children: [
              for (var i = 0; i < _views.length; i++)
                Expanded(
                  child: Padding(
                    padding: EdgeInsets.only(right: i == 0 ? 8 : 0),
                    child: SchoolHubSegmentButton(
                      label: _views[i] == 'received' ? 'Received' : 'Sent',
                      selected: viewIndex.value == i,
                      onTap: () => viewIndex.value = i,
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
            itemCount: _statuses.length,
            separatorBuilder: (_, __) => const SizedBox(width: 8),
            itemBuilder: (context, index) {
              final label = _statuses[index][0].toUpperCase() +
                  _statuses[index].substring(1);
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
          child: offersAsync.when(
            loading: () => const Center(child: DlLoadingIndicator()),
            error: (e, _) => SchoolStatePanel(
              icon: Icons.error_outline_rounded,
              title: 'Could not load offers',
              message: 'Pull to refresh or try again later.',
              actionLabel: 'Retry',
              onAction: () => ref.invalidate(schoolOffersProvider(query)),
            ),
            data: (offers) {
              if (offers.isEmpty) {
                return SchoolStatePanel(
                  icon: Icons.local_offer_outlined,
                  title: 'No offers',
                  message: 'No $status offers in your $view queue.',
                );
              }
              return RefreshIndicator(
                color: AppColors.primary,
                onRefresh: () async => ref.invalidate(schoolOffersProvider(query)),
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                  children: [
                    Text(
                      'Offer queue',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: AppColors.primary,
                      ),
                    ),
                    const SizedBox(height: 10),
                    SchoolOffersTable(
                      offers: offers,
                      view: view,
                      onShowDetails: showDetails,
                      onChangeStatus: onChangeStatus,
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
