import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/providers/school_providers.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_state_panel.dart';
import 'package:deltalabs_mobile/shared/widgets/loading/dl_loading_indicator.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

class SchoolMarketplaceListingPage extends ConsumerWidget {
  const SchoolMarketplaceListingPage({required this.listingId, super.key});

  final String listingId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final listingAsync = ref.watch(schoolMarketplaceListingProvider(listingId));

    return Scaffold(
      backgroundColor: AppColors.surfaceGrey,
      appBar: AppBar(
        backgroundColor: AppColors.surfaceGrey,
        foregroundColor: AppColors.primary,
        title: const Text(
          'Listing',
          style: TextStyle(fontWeight: FontWeight.w700, color: AppColors.primary),
        ),
      ),
      body: listingAsync.when(
        loading: () => const Center(child: DlLoadingIndicator()),
        error: (e, _) => SchoolStatePanel(
          icon: Icons.error_outline_rounded,
          title: 'Listing unavailable',
          message: 'This listing could not be loaded.',
          actionLabel: 'Go back',
          onAction: () => context.pop(),
        ),
        data: (item) => ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Text(
              item.title,
              style: const TextStyle(
                color: AppColors.primary,
                fontSize: 22,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              item.schoolName,
              style: const TextStyle(color: AppColors.textSecondary),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                '${item.currency} ${item.price.toStringAsFixed(2)}',
                style: const TextStyle(
                  color: AppColors.primary,
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
            const SizedBox(height: 12),
            Text(
              item.status.toUpperCase(),
              style: const TextStyle(
                color: AppColors.textSecondary,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.6,
              ),
            ),
            const SizedBox(height: 20),
            Text(
              item.description,
              style: const TextStyle(
                color: AppColors.textPrimary,
                height: 1.45,
              ),
            ),
            const SizedBox(height: 32),
            const Text(
              'Buying and bidding on mobile are coming soon. Use the web app for full marketplace actions.',
              style: TextStyle(
                color: AppColors.textHint,
                fontSize: 13,
                height: 1.4,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
