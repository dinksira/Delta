import 'package:deltalabs_mobile/core/routing/app_routes.dart';
import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/workspace/data/models/my_school_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/providers/school_providers.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_confirm_dialog.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_detail_sheet.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_entity_card.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_hub_search_bar.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_quick_action_card.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_state_panel.dart';
import 'package:deltalabs_mobile/shared/widgets/loading/dl_loading_indicator.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

class SchoolHomePage extends HookConsumerWidget {
  const SchoolHomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final search = useState('');
    final schoolsAsync = ref.watch(myActiveSchoolsProvider);
    final summaryAsync = ref.watch(schoolHubSummaryProvider);

    return schoolsAsync.when(
      loading: () => const Center(child: DlLoadingIndicator()),
      error: (e, _) => SchoolStatePanel(
        icon: Icons.error_outline_rounded,
        title: 'Could not load schools',
        message: 'Check your connection and try again.',
        actionLabel: 'Retry',
        onAction: () {
          ref.invalidate(myActiveSchoolsProvider);
          ref.invalidate(schoolHubSummaryProvider);
        },
      ),
      data: (schools) {
        final q = search.value.trim().toLowerCase();
        final filtered = q.isEmpty
            ? schools
            : schools
                .where(
                  (s) =>
                      s.name.toLowerCase().contains(q) ||
                      s.slug.toLowerCase().contains(q) ||
                      s.schoolType.toLowerCase().contains(q),
                )
                .toList();

        return RefreshIndicator(
          color: AppColors.primary,
          onRefresh: () async {
            ref.invalidate(myActiveSchoolsProvider);
            ref.invalidate(schoolHubSummaryProvider);
          },
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
            children: [
              SchoolHubSearchBar(
                hintText: 'Search schools',
                onChanged: (v) => search.value = v,
              ),
              const SizedBox(height: 16),
              summaryAsync.when(
                loading: () => const SizedBox(
                  height: 96,
                  child: Center(child: DlLoadingIndicator(size: DlLoadingSize.small)),
                ),
                error: (_, __) => const SizedBox.shrink(),
                data: (s) => SizedBox(
                  height: 96,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    children: [
                      SchoolQuickActionCard(
                        icon: Icons.school_outlined,
                        label: 'My schools',
                        value: '${s.activeSchools} active',
                        onTap: () {},
                      ),
                      const SizedBox(width: 10),
                      SchoolQuickActionCard(
                        icon: Icons.local_offer_outlined,
                        label: 'Pending offers',
                        value: '${s.pendingOffers} new',
                        onTap: () => context.go(AppRoutes.workspaceSchoolOffers),
                      ),
                      const SizedBox(width: 10),
                      SchoolQuickActionCard(
                        icon: Icons.storefront_outlined,
                        label: 'Marketplace',
                        value: '${s.marketplaceListings} listings',
                        onTap: () => context.go(AppRoutes.workspaceSchoolMarketplace),
                      ),
                      const SizedBox(width: 10),
                      SchoolQuickActionCard(
                        icon: Icons.archive_outlined,
                        label: 'Archived',
                        value: '${s.archivedSchools} schools',
                        onTap: () => context.go(AppRoutes.workspaceSchoolArchive),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Text(
                'My schools',
                style: const TextStyle(
                  color: AppColors.primary,
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 12),
              if (filtered.isEmpty)
                SchoolStatePanel(
                  icon: Icons.school_outlined,
                  title: schools.isEmpty ? 'No schools yet' : 'No matches',
                  message: schools.isEmpty
                      ? 'Create your first school to start managing classes, offers, and marketplace activity.'
                      : 'Try a different search term.',
                  actionLabel: schools.isEmpty ? 'Create school' : null,
                  onAction: schools.isEmpty
                      ? () => context.push(AppRoutes.workspaceSchoolCreate)
                      : null,
                )
              else
                ...filtered.map(
                  (school) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: SchoolEntityCard(
                      school: school,
                      onPrimaryAction: () => _openSchool(context, school),
                      onDetailsAction: () => _showDetails(context, school),
                      onEditAction: school.orgId.isEmpty
                          ? null
                          : () => context.push(
                                AppRoutes.workspaceSchoolEditPath(school.schoolId),
                                extra: school,
                              ),
                      onArchiveAction: school.orgId.isEmpty
                          ? null
                          : () => _confirmArchive(context, ref, school),
                    ),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }

  void _openSchool(BuildContext context, MySchoolModel school) {
    context.push(
      AppRoutes.workspaceSchoolDetailPath(school.schoolId),
      extra: school,
    );
  }

  void _showDetails(BuildContext context, MySchoolModel school) {
    SchoolDetailSheet.show(
      context,
      school: school,
      onOpenSchool: () => _openSchool(context, school),
      onEdit: school.orgId.isEmpty
          ? null
          : () => context.push(
                AppRoutes.workspaceSchoolEditPath(school.schoolId),
                extra: school,
              ),
    );
  }

  Future<void> _confirmArchive(
    BuildContext context,
    WidgetRef ref,
    MySchoolModel school,
  ) async {
    final ok = await SchoolConfirmDialog.show(
      context,
      title: 'Archive school?',
      description:
          '"${school.name}" will move to Archive. You can restore it anytime from the Archive tab.',
      confirmLabel: 'Archive',
      confirmColor: const Color(0xFFB4233C),
    );

    if (ok != true || !context.mounted) return;

    try {
      await ref.read(schoolRemoteDataSourceProvider).setSchoolArchived(
            orgId: school.orgId,
            schoolId: school.schoolId,
            archived: true,
          );
      ref.invalidate(myActiveSchoolsProvider);
      ref.invalidate(myArchivedSchoolsProvider);
      ref.invalidate(schoolHubSummaryProvider);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${school.name} archived'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (_) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Could not archive school'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }
}
