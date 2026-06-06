import 'package:deltalabs_mobile/core/routing/app_routes.dart';
import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/workspace/data/models/my_school_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_workspace_item_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/pages/school_workspace_page.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/providers/school_providers.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_state_panel.dart';
import 'package:deltalabs_mobile/shared/widgets/loading/dl_loading_indicator.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

/// Department-scoped workspace — reuses [SchoolWorkspacePage] with a root item.
class SchoolDepartmentWorkspacePage extends ConsumerWidget {
  const SchoolDepartmentWorkspacePage({
    required this.schoolId,
    required this.departmentItemId,
    this.school,
    this.initialView,
    this.initialPathIds = const [],
    super.key,
  });

  final String schoolId;
  final String departmentItemId;
  final MySchoolModel? school;
  final String? initialView;
  final List<String> initialPathIds;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final schoolsAsync = ref.watch(myActiveSchoolsProvider);
    return schoolsAsync.when(
      loading: () => const Scaffold(
        backgroundColor: AppColors.surfaceGrey,
        body: Center(child: DlLoadingIndicator()),
      ),
      error: (e, _) => Scaffold(
        appBar: AppBar(backgroundColor: AppColors.surfaceGrey),
        body: SchoolStatePanel(
          icon: Icons.error_outline_rounded,
          title: 'Could not load department',
          message: 'Try again.',
          actionLabel: 'Retry',
          onAction: () => ref.invalidate(myActiveSchoolsProvider),
        ),
      ),
      data: (schools) {
        MySchoolModel? current = school;
        if (current == null || current.schoolId != schoolId) {
          for (final s in schools) {
            if (s.schoolId == schoolId) {
              current = s;
              break;
            }
          }
        }

        if (current == null || current.orgId.isEmpty) {
          return Scaffold(
            appBar: AppBar(backgroundColor: AppColors.surfaceGrey),
            body: const SchoolStatePanel(
              icon: Icons.account_tree_outlined,
              title: 'Department unavailable',
              message: 'School membership could not be resolved.',
            ),
          );
        }

        final itemAsync = ref.watch(
          schoolWorkspaceItemProvider((
            orgId: current.orgId,
            schoolId: schoolId,
            itemId: departmentItemId,
          )),
        );

        return itemAsync.when(
          loading: () => const Scaffold(
            backgroundColor: AppColors.surfaceGrey,
            body: Center(child: DlLoadingIndicator()),
          ),
          error: (e, _) => Scaffold(
            appBar: AppBar(
              backgroundColor: AppColors.surfaceGrey,
              leading: IconButton(
                onPressed: () => context.pop(),
                icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
              ),
            ),
            body: SchoolStatePanel(
              icon: Icons.error_outline_rounded,
              title: 'Department not found',
              message: 'This department may have been removed.',
              actionLabel: 'Back to school',
              onAction: () => context.go(
                AppRoutes.workspaceSchoolDetailPath(schoolId),
                extra: current,
              ),
            ),
          ),
          data: (item) {
            if (item.type != SchoolWorkspaceItemType.department) {
              return Scaffold(
                appBar: AppBar(backgroundColor: AppColors.surfaceGrey),
                body: const SchoolStatePanel(
                  icon: Icons.warning_amber_rounded,
                  title: 'Not a department',
                  message: 'This workspace item is not a department.',
                ),
              );
            }
            return SchoolWorkspacePage(
              schoolId: schoolId,
              school: current,
              initialView: initialView,
              initialPathIds: initialPathIds,
              departmentRootItemId: departmentItemId,
            );
          },
        );
      },
    );
  }
}
