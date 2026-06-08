import 'package:deltalabs_mobile/core/routing/app_routes.dart';
import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/workspace/data/models/my_school_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_workspace_item_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/models/school_workspace_constants.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/providers/school_providers.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_confirm_dialog.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_hub_search_bar.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_state_panel.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/utils/school_workspace_navigation.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_workspace_create_sheet.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_workspace_detail_header.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_workspace_edit_sheet.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_workspace_item_card.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_workspace_section_tabs.dart';
import 'package:deltalabs_mobile/shared/widgets/loading/dl_loading_indicator.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

class SchoolWorkspacePage extends HookConsumerWidget {
  const SchoolWorkspacePage({
    required this.schoolId,
    this.school,
    this.initialView,
    this.initialPathIds = const [],
    this.departmentRootItemId,
    super.key,
  });

  final String schoolId;
  final MySchoolModel? school;
  final String? initialView;
  final List<String> initialPathIds;
  final String? departmentRootItemId;

  MySchoolModel? _resolveSchool(List<MySchoolModel> schools) {
    if (school != null && school!.schoolId == schoolId) return school;
    for (final s in schools) {
      if (s.schoolId == schoolId) return s;
    }
    return school;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final schoolsAsync = ref.watch(myActiveSchoolsProvider);
    final sectionId = useState(
      _normalizeSection(initialView ?? 'all'),
    );
    final pathIds = useState<List<String>>(List<String>.from(initialPathIds));
    final search = useState('');
    final layoutMode = useState(SchoolWorkspaceLayoutMode.list);
    final creating = useState(false);
    final visibleSections = useState<List<String>>(
      List<String>.from(SchoolWorkspaceConstants.defaultVisibleSectionIds),
    );

    useEffect(() {
      pathIds.value = List<String>.from(initialPathIds);
      sectionId.value = _normalizeSection(initialView ?? 'all');
      return null;
    }, [initialPathIds, initialView]);

    return schoolsAsync.when(
      loading: () => const Scaffold(
        backgroundColor: AppColors.surfaceGrey,
        body: Center(child: DlLoadingIndicator()),
      ),
      error: (e, _) => Scaffold(
        backgroundColor: AppColors.surfaceGrey,
        appBar: AppBar(
          backgroundColor: AppColors.surfaceGrey,
          title: const Text('School workspace'),
        ),
        body: SchoolStatePanel(
          icon: Icons.error_outline_rounded,
          title: 'Could not load schools',
          message: 'Try again to open this workspace.',
          actionLabel: 'Retry',
          onAction: () => ref.invalidate(myActiveSchoolsProvider),
        ),
      ),
      data: (schools) {
        final current = _resolveSchool(schools);
        if (current == null || current.orgId.isEmpty) {
          return Scaffold(
            backgroundColor: AppColors.surfaceGrey,
            appBar: AppBar(backgroundColor: AppColors.surfaceGrey),
            body: const SchoolStatePanel(
              icon: Icons.school_outlined,
              title: 'School not found',
              message: 'This school is unavailable or you no longer have access.',
            ),
          );
        }

        final orgId = current.orgId;
        final listParentId = pathIds.value.isNotEmpty
            ? pathIds.value.last
            : (departmentRootItemId?.trim().isNotEmpty == true
                ? departmentRootItemId!.trim()
                : null);

        final accessAsync = ref.watch(schoolOrgAccessProvider(orgId));
        final itemType = SchoolWorkspaceConstants.sectionToItemType(sectionId.value);
        final itemsQuery = (
          orgId: orgId,
          schoolId: schoolId,
          type: itemType,
          parentId: listParentId,
        );
        final itemsAsync = ref.watch(schoolWorkspaceItemsProvider(itemsQuery));

        final canMutate = accessAsync.maybeWhen(
          data: (access) => access.canManageSchoolWorkspace,
          orElse: () => false,
        );
        final accessPending = accessAsync.isLoading;

        final breadcrumbSegments = pathIds.value.map((id) {
          final itemAsync = ref.watch(
            schoolWorkspaceItemProvider((orgId: orgId, schoolId: schoolId, itemId: id)),
          );
          final item = itemAsync.asData?.value;
          return (
            id: id,
            label: item?.title ?? id,
            loading: itemAsync.isLoading && item == null,
          );
        }).toList();

        final departmentRootAsync = departmentRootItemId?.trim().isNotEmpty == true
            ? ref.watch(
                schoolWorkspaceItemProvider((
                  orgId: orgId,
                  schoolId: schoolId,
                  itemId: departmentRootItemId!.trim(),
                )),
              )
            : null;

        Future<void> refreshWorkspace() async {
          ref.invalidate(schoolWorkspaceItemsProvider(itemsQuery));
          for (final id in pathIds.value) {
            ref.invalidate(
              schoolWorkspaceItemProvider((orgId: orgId, schoolId: schoolId, itemId: id)),
            );
          }
          if (departmentRootItemId?.trim().isNotEmpty == true) {
            ref.invalidate(
              schoolWorkspaceItemProvider((
                orgId: orgId,
                schoolId: schoolId,
                itemId: departmentRootItemId!.trim(),
              )),
            );
          }
        }

        final featureInstanceId =
            AppRoutes.instanceIdFrom(GoRouterState.of(context).uri);

        String withInstanceRoute(String location) {
          if (featureInstanceId == null || featureInstanceId.isEmpty) {
            return location;
          }
          return AppRoutes.attachInstance(location, featureInstanceId);
        }

        void navigatePath(List<String> nextPath, {String? view}) {
          final location = AppRoutes.workspaceSchoolDetailUri(
            schoolId,
            view: view ?? sectionId.value,
            pathIds: nextPath,
            departmentItemId: departmentRootItemId,
            instanceId: featureInstanceId,
          );
          context.go(location, extra: current);
        }

        void navigateRoot() {
          if (departmentRootItemId?.trim().isNotEmpty == true) {
            context.go(
              withInstanceRoute(AppRoutes.workspaceSchoolDetailPath(schoolId)),
              extra: current,
            );
            return;
          }
          navigatePath([]);
        }

        Future<void> createItem() async {
          if (creating.value) return;
          final result = await SchoolWorkspaceCreateSheet.show(
            context,
            initialSectionId: sectionId.value,
            canCreate: canMutate,
          );
          if (result == null || !context.mounted) return;
          creating.value = true;
          try {
            await ref.read(schoolRemoteDataSourceProvider).createWorkspaceItem(
                  orgId: orgId,
                  schoolId: schoolId,
                  type: result.type,
                  title: result.title,
                  description: result.description.isEmpty ? null : result.description,
                  parentId: listParentId,
                );
            await refreshWorkspace();
            if (context.mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Workspace item created'),
                  behavior: SnackBarBehavior.floating,
                ),
              );
            }
          } catch (_) {
            if (context.mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Could not create item'),
                  behavior: SnackBarBehavior.floating,
                ),
              );
            }
          } finally {
            creating.value = false;
          }
        }

        Future<void> editItem(SchoolWorkspaceItemModel item) async {
          final result = await SchoolWorkspaceEditSheet.show(context, item);
          if (result == null || !context.mounted) return;
          try {
            await ref.read(schoolRemoteDataSourceProvider).updateWorkspaceItem(
                  orgId: orgId,
                  schoolId: schoolId,
                  itemId: item.id,
                  title: result.title,
                  description: result.description.isEmpty ? '' : result.description,
                );
            await refreshWorkspace();
          } catch (_) {
            if (context.mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Could not update item'),
                  behavior: SnackBarBehavior.floating,
                ),
              );
            }
          }
        }

        Future<void> deleteItem(SchoolWorkspaceItemModel item) async {
          final ok = await SchoolConfirmDialog.show(
            context,
            title: 'Delete item?',
            description: 'This action cannot be undone.',
            confirmLabel: 'Delete',
            confirmColor: const Color(0xFFB4233C),
          );
          if (ok != true || !context.mounted) return;
          try {
            await ref.read(schoolRemoteDataSourceProvider).deleteWorkspaceItem(
                  orgId: orgId,
                  schoolId: schoolId,
                  itemId: item.id,
                );
            await refreshWorkspace();
          } catch (_) {
            if (context.mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Could not delete item'),
                  behavior: SnackBarBehavior.floating,
                ),
              );
            }
          }
        }

        void openItem(SchoolWorkspaceItemModel item) {
          if (item.opensAsFolder) {
            navigatePath([...pathIds.value, item.id]);
            return;
          }
          if (item.opensAsDepartment) {
            if (departmentRootItemId?.trim().isNotEmpty == true) {
              navigatePath([...pathIds.value, item.id]);
              return;
            }
            context.push(
              withInstanceRoute(
                AppRoutes.workspaceSchoolDepartmentPath(schoolId, item.id),
              ),
              extra: current,
            );
            return;
          }
          if (item.opensAsClass) {
            context.push(
              withInstanceRoute(
                AppRoutes.workspaceSchoolClassPath(schoolId, item.id),
              ),
              extra: current,
            );
            return;
          }
          if (item.opensAsManagementTable) {
            final instanceId = item.managementTableInstanceId;
            if (instanceId != null && instanceId.isNotEmpty) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Management table editor for "$instanceId" is available on web.'),
                  behavior: SnackBarBehavior.floating,
                ),
              );
            } else {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Link a management table template on web first.'),
                  behavior: SnackBarBehavior.floating,
                ),
              );
            }
          }
        }

        final q = search.value.trim().toLowerCase();
        final itemsRefreshing = itemsAsync.isLoading && itemsAsync.hasValue;
        final filteredItems = itemsAsync.maybeWhen(
          data: (items) => q.isEmpty
              ? items
              : items
                  .where(
                    (item) =>
                        item.title.toLowerCase().contains(q) ||
                        (item.description ?? '').toLowerCase().contains(q),
                  )
                  .toList(),
          orElse: () => <SchoolWorkspaceItemModel>[],
        );
        final isBusy = creating.value || itemsRefreshing;

        return PopScope(
          canPop: false,
          onPopInvokedWithResult: (didPop, _) {
            if (!didPop) {
              SchoolWorkspaceNavigation.backFromDetail(
                context,
                featureInstanceId: featureInstanceId,
              );
            }
          },
          child: Scaffold(
          backgroundColor: AppColors.surfaceGrey,
          floatingActionButton: canMutate
              ? FloatingActionButton.extended(
                  onPressed: accessPending || creating.value ? null : createItem,
                  backgroundColor: AppColors.primary,
                  icon: creating.value
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(Icons.add_rounded, color: Colors.white),
                  label: Text(
                    creating.value ? 'Creating…' : 'New',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                )
              : null,
          body: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (isBusy) const DlLinearLoadingBar(),
              SchoolWorkspaceDetailHeader(
                currentSchool: current,
                schools: schools,
                featureInstanceId: featureInstanceId,
                segments: breadcrumbSegments,
                onRootTap: navigateRoot,
                onSegmentTap: (index) =>
                    navigatePath(pathIds.value.sublist(0, index + 1)),
                departmentRootLabel: departmentRootItemId?.trim().isNotEmpty == true
                    ? (departmentRootAsync?.asData?.value.title ??
                        departmentRootItemId)
                    : null,
                onDepartmentRootTap: departmentRootItemId?.trim().isNotEmpty == true
                    ? () => navigatePath([])
                    : null,
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 0),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Expanded(
                      child: SchoolHubSearchBar(
                        hintText: 'Search workspace',
                        onChanged: (v) => search.value = v,
                      ),
                    ),
                    const SizedBox(width: 8),
                    _LayoutToggle(
                      mode: layoutMode.value,
                      onChanged: (mode) => layoutMode.value = mode,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: SchoolWorkspaceSectionTabs(
                  visibleSectionIds: visibleSections.value,
                  currentSectionId: sectionId.value,
                  onSectionChanged: (next) {
                    sectionId.value = next;
                    context.go(
                      AppRoutes.workspaceSchoolDetailUri(
                        schoolId,
                        view: next,
                        pathIds: pathIds.value,
                        departmentItemId: departmentRootItemId,
                        instanceId: featureInstanceId,
                      ),
                      extra: current,
                    );
                  },
                ),
              ),
              const SizedBox(height: 8),
              Expanded(
                child: RefreshIndicator(
                  color: AppColors.primary,
                  onRefresh: refreshWorkspace,
                  child: ListView(
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 96),
                    children: [
                      itemsAsync.when(
                  skipLoadingOnRefresh: true,
                  loading: () => const Padding(
                    padding: EdgeInsets.symmetric(vertical: 48),
                    child: Center(child: DlLoadingIndicator()),
                  ),
                  error: (e, _) => SchoolStatePanel(
                    icon: Icons.error_outline_rounded,
                    title: 'Could not load workspace',
                    message: 'Pull to refresh or try again.',
                    actionLabel: 'Retry',
                    onAction: refreshWorkspace,
                  ),
                  data: (_) {
                    if (filteredItems.isEmpty) {
                      return SchoolStatePanel(
                        icon: Icons.folder_open_rounded,
                        title: q.isEmpty ? 'Nothing here yet' : 'No matches',
                        message: q.isEmpty
                            ? 'Add departments, classes, or resources to get started.'
                            : 'Try a different search term.',
                        actionLabel:
                            canMutate && q.isEmpty && !creating.value ? 'Create item' : null,
                        onAction: canMutate && q.isEmpty && !creating.value
                            ? createItem
                            : null,
                      );
                    }

                    if (layoutMode.value == SchoolWorkspaceLayoutMode.grid) {
                      return Column(
                        children: [
                          for (final item in filteredItems) ...[
                            SchoolWorkspaceItemCard(
                                item: item,
                                layoutMode: layoutMode.value,
                                onPrimaryOpen:
                                    item.hasPrimaryOpen ? () => openItem(item) : null,
                                onEdit: canMutate ? () => editItem(item) : null,
                                onDelete: canMutate ? () => deleteItem(item) : null,
                              ),
                            const SizedBox(height: 12),
                          ],
                        ],
                      );
                    }

                    return Column(
                      children: [
                        for (final item in filteredItems) ...[
                          SchoolWorkspaceItemCard(
                            item: item,
                            layoutMode: layoutMode.value,
                            onPrimaryOpen: item.hasPrimaryOpen ? () => openItem(item) : null,
                            onEdit: canMutate ? () => editItem(item) : null,
                            onDelete: canMutate ? () => deleteItem(item) : null,
                          ),
                          const SizedBox(height: 10),
                        ],
                      ],
                    );
                  },
                ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
        );
      },
    );
  }

  static String _normalizeSection(String raw) {
    final value = raw.trim().toLowerCase();
    final valid = SchoolWorkspaceConstants.sections.map((s) => s.id).toSet();
    if (valid.contains(value)) return value;
    return 'all';
  }
}

class _LayoutToggle extends StatelessWidget {
  const _LayoutToggle({required this.mode, required this.onChanged});

  final SchoolWorkspaceLayoutMode mode;
  final ValueChanged<SchoolWorkspaceLayoutMode> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.inputBorder.withValues(alpha: 0.7)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _IconToggleButton(
            icon: Icons.view_list_rounded,
            selected: mode == SchoolWorkspaceLayoutMode.list,
            onTap: () => onChanged(SchoolWorkspaceLayoutMode.list),
          ),
          _IconToggleButton(
            icon: Icons.grid_view_rounded,
            selected: mode == SchoolWorkspaceLayoutMode.grid,
            onTap: () => onChanged(SchoolWorkspaceLayoutMode.grid),
          ),
        ],
      ),
    );
  }
}

class _IconToggleButton extends StatelessWidget {
  const _IconToggleButton({
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: selected ? AppColors.primary.withValues(alpha: 0.12) : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(
          icon,
          size: 20,
          color: selected ? AppColors.primary : AppColors.textSecondary,
        ),
      ),
    );
  }
}
