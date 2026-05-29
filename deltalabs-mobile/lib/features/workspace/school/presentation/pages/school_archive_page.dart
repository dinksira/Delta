import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/workspace/data/models/my_school_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/providers/school_providers.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_confirm_dialog.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_entity_card.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_hub_search_bar.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_state_panel.dart';
import 'package:deltalabs_mobile/shared/widgets/loading/dl_loading_indicator.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

class SchoolArchivePage extends HookConsumerWidget {
  const SchoolArchivePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final search = useState('');
    final archivedAsync = ref.watch(myArchivedSchoolsProvider);

    return archivedAsync.when(
      loading: () => const Center(child: DlLoadingIndicator()),
      error: (e, _) => SchoolStatePanel(
        icon: Icons.error_outline_rounded,
        title: 'Could not load archive',
        message: 'Try again later.',
        actionLabel: 'Retry',
        onAction: () => ref.invalidate(myArchivedSchoolsProvider),
      ),
      data: (schools) {
        final q = search.value.trim().toLowerCase();
        final filtered = q.isEmpty
            ? schools
            : schools.where((s) => s.name.toLowerCase().contains(q)).toList();

        return Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
              child: SchoolHubSearchBar(
                hintText: 'Search archived schools',
                onChanged: (v) => search.value = v,
              ),
            ),
            const SizedBox(height: 12),
            Expanded(
              child: filtered.isEmpty
                  ? SchoolStatePanel(
                      icon: Icons.archive_outlined,
                      title: schools.isEmpty ? 'Archive is empty' : 'No matches',
                      message: schools.isEmpty
                          ? 'Schools you archive will appear here.'
                          : 'Try another search.',
                    )
                  : RefreshIndicator(
                      color: AppColors.primary,
                      onRefresh: () async {
                        ref.invalidate(myArchivedSchoolsProvider);
                        ref.invalidate(myActiveSchoolsProvider);
                        ref.invalidate(schoolHubSummaryProvider);
                      },
                      child: ListView.separated(
                        padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                        itemCount: filtered.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (context, index) {
                          final school = filtered[index];
                          return SchoolEntityCard(
                            school: school,
                            variant: SchoolEntityCardVariant.archive,
                            onPrimaryAction: () => _confirmRestore(context, ref, school),
                          );
                        },
                      ),
                    ),
            ),
          ],
        );
      },
    );
  }

  Future<void> _confirmRestore(
    BuildContext context,
    WidgetRef ref,
    MySchoolModel school,
  ) async {
    if (school.orgId.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Cannot restore: missing organization id.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    final ok = await SchoolConfirmDialog.show(
      context,
      title: 'Restore school?',
      description:
          '"${school.name}" will return to your active schools on the School home screen.',
      confirmLabel: 'Restore',
      confirmColor: AppColors.primary,
    );

    if (ok != true || !context.mounted) return;

    try {
      await ref.read(schoolRemoteDataSourceProvider).setSchoolArchived(
            orgId: school.orgId,
            schoolId: school.schoolId,
            archived: false,
          );
      ref.invalidate(myArchivedSchoolsProvider);
      ref.invalidate(myActiveSchoolsProvider);
      ref.invalidate(schoolHubSummaryProvider);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${school.name} restored'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (_) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Could not restore school'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }
}
