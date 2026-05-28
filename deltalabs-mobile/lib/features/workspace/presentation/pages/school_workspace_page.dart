import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/workspace/data/models/my_school_model.dart';
import 'package:deltalabs_mobile/features/workspace/presentation/providers/my_schools_provider.dart';
import 'package:deltalabs_mobile/features/workspace/presentation/widgets/workspace_scaffold.dart';
import 'package:deltalabs_mobile/features/workspace/workspace_launch_args.dart';
import 'package:deltalabs_mobile/shared/widgets/loading/dl_loading_indicator.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Native School workspace entry — lists schools from `GET /v1/me/schools`.
class SchoolWorkspacePage extends ConsumerWidget {
  const SchoolWorkspacePage({
    required this.args,
    super.key,
  });

  final WorkspaceLaunchArgs args;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final schoolsAsync = ref.watch(mySchoolsProvider);

    return WorkspaceScaffold(
      title: args.displayTitle,
      body: schoolsAsync.when(
        loading: () => const Center(
          child: DlLoadingIndicator(),
        ),
        error: (e, _) => _ErrorState(
          message: 'Could not load your schools',
          onRetry: () => ref.invalidate(mySchoolsProvider),
        ),
        data: (schools) {
          if (schools.isEmpty) {
            return const _EmptySchoolsState();
          }
          return ListView.separated(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
            itemCount: schools.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (context, index) {
              return _SchoolTile(school: schools[index]);
            },
          );
        },
      ),
    );
  }
}

class _SchoolTile extends StatelessWidget {
  const _SchoolTile({required this.school});

  final MySchoolModel school;

  @override
  Widget build(BuildContext context) {
    final roles = school.roleKeys.isEmpty
        ? 'Member'
        : school.roleKeys.join(', ').replaceAll('_', ' ');

    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(14),
      clipBehavior: Clip.antiAlias,
      child: ListTile(
        onTap: () {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('${school.name} — class & management views coming soon.'),
              behavior: SnackBarBehavior.floating,
            ),
          );
        },
        leading: CircleAvatar(
          backgroundColor: AppColors.primary.withValues(alpha: 0.1),
          child: const Icon(Icons.school_rounded, color: AppColors.primary),
        ),
        title: Text(
          school.name,
          style: const TextStyle(
            fontWeight: FontWeight.w700,
            color: AppColors.primary,
          ),
        ),
        subtitle: Text(
          roles,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        trailing: const Icon(Icons.chevron_right_rounded, color: AppColors.primaryLight),
      ),
    );
  }
}

class _EmptySchoolsState extends StatelessWidget {
  const _EmptySchoolsState();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.school_outlined,
              size: 56,
              color: AppColors.primary.withValues(alpha: 0.5),
            ),
            const SizedBox(height: 16),
            const Text(
              'No schools yet',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Create or join a school on the web, then open it here.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.textSecondary, height: 1.4),
            ),
          ],
        ),
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(message, style: const TextStyle(color: AppColors.textSecondary)),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: onRetry,
              style: FilledButton.styleFrom(backgroundColor: AppColors.primary),
              child: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }
}
