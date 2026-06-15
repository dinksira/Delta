import 'package:deltalabs_mobile/core/routing/app_routes.dart';
import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/workspace/data/models/my_school_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/providers/school_providers.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_state_panel.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_workspace_detail_header.dart';
import 'package:deltalabs_mobile/shared/management_table/presentation/providers/management_table_providers.dart';
import 'package:deltalabs_mobile/shared/management_table/presentation/state/mt_instance_board_state.dart';
import 'package:deltalabs_mobile/shared/management_table/presentation/widgets/mt_group_section.dart';
import 'package:deltalabs_mobile/shared/widgets/loading/dl_loading_indicator.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

class SchoolManagementTablePage extends HookConsumerWidget {
  const SchoolManagementTablePage({
    required this.schoolId,
    required this.instanceId,
    this.school,
    this.workspaceItemTitle,
    this.pathIds = const [],
    this.workspaceView,
    this.departmentItemId,
    this.featureInstanceId,
    super.key,
  });

  final String schoolId;
  final String instanceId;
  final MySchoolModel? school;
  final String? workspaceItemTitle;
  final List<String> pathIds;
  final String? workspaceView;
  final String? departmentItemId;
  final String? featureInstanceId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final schoolsAsync = ref.watch(myActiveSchoolsProvider);

    return schoolsAsync.when(
      loading: () => const Scaffold(
        backgroundColor: AppColors.surfaceGrey,
        body: Center(child: DlLoadingIndicator()),
      ),
      error: (_, __) => Scaffold(
        backgroundColor: AppColors.surfaceGrey,
        body: ListView(
          children: [
            _SimpleBackHeader(title: 'Management table', onBack: () => context.pop()),
            SchoolStatePanel(
              icon: Icons.error_outline_rounded,
              title: 'Could not load school',
              message: 'Try again.',
              actionLabel: 'Retry',
              onAction: () => ref.invalidate(myActiveSchoolsProvider),
            ),
          ],
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
            backgroundColor: AppColors.surfaceGrey,
            body: ListView(
              children: [
                _SimpleBackHeader(title: 'Management table', onBack: () => context.pop()),
                const SchoolStatePanel(
                  icon: Icons.table_chart_outlined,
                  title: 'Management table unavailable',
                  message: 'School membership could not be resolved.',
                ),
              ],
            ),
          );
        }

        final resolvedSchool = current;
        final orgId = resolvedSchool.orgId;
        final accessAsync = ref.watch(schoolOrgAccessProvider(orgId));
        final canMutate = accessAsync.maybeWhen(
          data: (access) =>
              access.canManageSchoolWorkspace ||
              resolvedSchool.roleKeys.contains('school_owner') ||
              resolvedSchool.roleKeys.contains('school_admin'),
          orElse: () =>
              resolvedSchool.roleKeys.contains('school_owner') ||
              resolvedSchool.roleKeys.contains('school_admin'),
        );
        final boardQuery = (
          orgId: orgId,
          schoolId: schoolId,
          instanceId: instanceId,
        );
        final board = ref.watch(mtInstanceBoardProvider(boardQuery));
        final deptId = departmentItemId?.trim();

        final departmentRootAsync = deptId != null && deptId.isNotEmpty
            ? ref.watch(
                schoolWorkspaceItemProvider((
                  orgId: orgId,
                  schoolId: schoolId,
                  itemId: deptId,
                )),
              )
            : null;
        final departmentRootLabel = departmentRootAsync?.asData?.value.title;

        final breadcrumbSegments = pathIds.map((id) {
          final itemAsync = ref.watch(
            schoolWorkspaceItemProvider((
              orgId: orgId,
              schoolId: schoolId,
              itemId: id,
            )),
          );
          final item = itemAsync.asData?.value;
          return (
            id: id,
            label: item?.title ?? id,
            loading: itemAsync.isLoading && item == null,
          );
        }).toList();

        Future<void> refresh() async {
          await board.refresh();
        }

        void returnToWorkspace({List<String>? nextPathIds}) {
          context.pop();
          if (!context.mounted) return;
          context.go(
            AppRoutes.workspaceSchoolDetailUri(
              schoolId,
              view: workspaceView,
              pathIds: nextPathIds ?? pathIds,
              departmentItemId: deptId,
              instanceId: featureInstanceId,
            ),
            extra: resolvedSchool,
          );
        }

        String terminalTitle(String fallback) =>
            workspaceItemTitle?.trim().isNotEmpty == true
                ? workspaceItemTitle!.trim()
                : fallback;

        Widget buildWorkspaceHeader({required String tableTitle, String? templateTitle}) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              SchoolWorkspaceDetailHeader(
                currentSchool: resolvedSchool,
                schools: schools,
                segments: breadcrumbSegments,
                featureInstanceId: featureInstanceId,
                departmentRootLabel: departmentRootLabel,
                terminalLabel: tableTitle,
                onBack: () => context.pop(),
                onRootTap: () => returnToWorkspace(nextPathIds: const []),
                onDepartmentRootTap: deptId != null && deptId.isNotEmpty
                    ? () => returnToWorkspace(nextPathIds: const [])
                    : null,
                onSegmentTap: (index) => returnToWorkspace(
                  nextPathIds: pathIds.sublist(0, index + 1),
                ),
              ),
              if (templateTitle != null && templateTitle.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 4),
                  child: Text(
                    templateTitle,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ),
            ],
          );
        }

        Future<void> createTableGroup() async {
          if (!canMutate) return;
          final controller = TextEditingController();
          final title = await showDialog<String>(
            context: context,
            builder: (ctx) => AlertDialog(
              title: const Text('New table group'),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Adds another grid on this page. Columns stay shared with this management table.',
                    style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: controller,
                    autofocus: true,
                    decoration: const InputDecoration(
                      labelText: 'Group name',
                      hintText: 'e.g. Ghost management',
                      border: OutlineInputBorder(),
                    ),
                    onSubmitted: (value) => Navigator.of(ctx).pop(value.trim()),
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(ctx).pop(),
                  child: const Text('Cancel'),
                ),
                FilledButton(
                  onPressed: () => Navigator.of(ctx).pop(controller.text.trim()),
                  child: const Text('Add group'),
                ),
              ],
            ),
          );
          if (title == null || title.isEmpty) return;

          try {
            await board.addTableGroup(title);
          } catch (_) {
            if (context.mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Could not add table group. Try again.')),
              );
            }
          }
        }

        Widget buildBody(MtInstanceBoardState boardState) {
          final bundle = boardState.bundle;

          if (boardState.isLoadingBundle && bundle == null) {
            return ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.only(bottom: 32),
              children: [
                buildWorkspaceHeader(tableTitle: terminalTitle('Management table')),
                const SizedBox(height: 80),
                const Center(child: DlLoadingIndicator()),
              ],
            );
          }

          if (bundle == null) {
            return ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(0, 0, 16, 32),
              children: [
                buildWorkspaceHeader(tableTitle: terminalTitle('Management table')),
                const SizedBox(height: 16),
                SchoolStatePanel(
                  icon: Icons.table_chart_outlined,
                  title: 'Could not load table',
                  message: boardState.errorMessage ?? 'Check your connection and try again.',
                  actionLabel: 'Retry',
                  onAction: refresh,
                ),
              ],
            );
          }

          final groups = bundle.instance.tableGroups;
          final tableTitle = terminalTitle(bundle.instance.title);
          return ListView.separated(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(0, 0, 16, 32),
            itemCount: groups.length + 1 + (canMutate ? 1 : 0),
            separatorBuilder: (_, index) {
              if (index == 0) return const SizedBox(height: 8);
              return const SizedBox(height: 16);
            },
            itemBuilder: (context, index) {
              if (index == 0) {
                return buildWorkspaceHeader(
                  tableTitle: tableTitle,
                  templateTitle: bundle.definition.title,
                );
              }

              final groupIndex = index - 1;
              if (canMutate && groupIndex == groups.length) {
                return Padding(
                  padding: const EdgeInsets.only(left: 16),
                  child: OutlinedButton.icon(
                    onPressed: createTableGroup,
                    icon: const Icon(Icons.table_chart_outlined, size: 18),
                    label: const Text('New table group'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 14,
                      ),
                      foregroundColor: AppColors.textPrimary,
                      side: BorderSide(
                        color: AppColors.inputBorder.withValues(alpha: 0.9),
                      ),
                    ),
                  ),
                );
              }

              final group = groups[groupIndex];
              return Padding(
                padding: const EdgeInsets.only(left: 16),
                child: MtGroupSection(
                  boardQuery: boardQuery,
                  groupId: group.id,
                  groupTitle: group.title,
                  definition: bundle.definition,
                  canMutate: canMutate,
                ),
              );
            },
          );
        }

        return Scaffold(
          backgroundColor: AppColors.surfaceGrey,
          body: ListenableBuilder(
            listenable: board,
            builder: (context, _) {
              return RefreshIndicator(
                onRefresh: refresh,
                child: buildBody(board.state),
              );
            },
          ),
        );
      },
    );
  }
}

class _SimpleBackHeader extends StatelessWidget {
  const _SimpleBackHeader({required this.title, required this.onBack});

  final String title;
  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(4, 8, 16, 8),
      child: Row(
        children: [
          IconButton(
            onPressed: onBack,
            icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18),
            color: AppColors.primary,
            visualDensity: VisualDensity.compact,
          ),
          Expanded(
            child: Text(
              title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: AppColors.primary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
