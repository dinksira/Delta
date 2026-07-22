import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_workspace_item_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/providers/school_providers.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/class/class_mt_groups_list.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_state_panel.dart';
import 'package:deltalabs_mobile/shared/management_table/presentation/providers/management_table_providers.dart';
import 'package:deltalabs_mobile/shared/widgets/loading/dl_loading_indicator.dart';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

String _bootstrapErrorMessage(Object error) {
  if (error is DioException) {
    final status = error.response?.statusCode;
    if (status == 404) {
      return 'The teachers-table API is not on the live server yet. '
          'Deploy the latest deltalabs-backend, then try again.';
    }
    if (status == 403) {
      return 'You need school manage permission on this organization to create the teachers table.';
    }
    final detail = error.response?.data;
    if (detail is Map && detail['message'] != null) {
      return detail['message'].toString();
    }
    if (detail is Map && detail['detail'] != null) {
      return detail['detail'].toString();
    }
  }
  return 'Could not create teachers table. Check your connection and try again.';
}

class ClassTeachersTableTab extends HookConsumerWidget {
  const ClassTeachersTableTab({
    required this.orgId,
    required this.schoolId,
    required this.classItemId,
    required this.classItem,
    required this.canMutate,
    required this.onTableReady,
    super.key,
  });

  final String orgId;
  final String schoolId;
  final String classItemId;
  final SchoolWorkspaceItemModel classItem;
  final bool canMutate;
  final VoidCallback onTableReady;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final instanceId = useState<String?>(classItem.teachersTableInstanceId);
    final bootstrapping = useState(false);
    final bootstrapError = useState<String?>(null);

    useEffect(() {
      instanceId.value = classItem.teachersTableInstanceId;
      return null;
    }, [classItem.teachersTableInstanceId]);

    Future<void> ensureTable({bool auto = false}) async {
      if (instanceId.value != null || bootstrapping.value) return;
      if (auto && !canMutate) return;

      bootstrapping.value = true;
      bootstrapError.value = null;
      try {
        final id = await ref.read(schoolRemoteDataSourceProvider).bootstrapClassTeachersTable(
              orgId: orgId,
              schoolId: schoolId,
              classWorkspaceItemId: classItemId,
            );
        instanceId.value = id;
        onTableReady();
      } catch (error) {
        bootstrapError.value = _bootstrapErrorMessage(error);
      } finally {
        bootstrapping.value = false;
      }
    }

    useEffect(() {
      if (instanceId.value == null && canMutate) {
        ensureTable(auto: true);
      }
      return null;
    }, [canMutate, instanceId.value]);

    if (instanceId.value == null) {
      if (bootstrapping.value) {
        return const Padding(
          padding: EdgeInsets.symmetric(vertical: 48),
          child: Center(child: DlLoadingIndicator()),
        );
      }

      if (!canMutate) {
        return const Padding(
          padding: EdgeInsets.all(16),
          child: SchoolStatePanel(
            icon: Icons.table_chart_outlined,
            title: 'Teachers table not set up',
            message: 'A school manager needs to open this tab once to create the class teachers table.',
          ),
        );
      }

      return Padding(
        padding: const EdgeInsets.all(16),
        child: SchoolStatePanel(
          icon: Icons.table_chart_outlined,
          title: 'Create teachers table',
          message: bootstrapError.value ??
              'Register teachers for this class. Pick school teachers in the Teacher column.',
          actionLabel: 'Create table',
          onAction: () => ensureTable(),
        ),
      );
    }

    final boardQuery = (
      orgId: orgId,
      schoolId: schoolId,
      instanceId: instanceId.value!,
    );
    final board = ref.watch(mtInstanceBoardProvider(boardQuery));

    return ListenableBuilder(
      listenable: board,
      builder: (context, _) {
        final boardState = board.state;

        if (boardState.isLoadingBundle && boardState.bundle == null) {
          return const Padding(
            padding: EdgeInsets.symmetric(vertical: 48),
            child: Center(child: DlLoadingIndicator()),
          );
        }

        final bundle = boardState.bundle;
        if (bundle == null) {
          return Padding(
            padding: const EdgeInsets.all(16),
            child: SchoolStatePanel(
              icon: Icons.error_outline_rounded,
              title: 'Could not load teachers table',
              message: boardState.errorMessage ?? 'Pull to refresh.',
            ),
          );
        }

        final groups = bundle.instance.tableGroups;

        return ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
          children: [
            const Text(
              'Teachers',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Assign teachers to this class. Pick registered school teachers in the Teacher column.',
              style: TextStyle(
                fontSize: 13,
                height: 1.4,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 16),
            ClassMtGroupsList(
              boardQuery: boardQuery,
              definition: bundle.definition,
              groups: groups,
              canMutate: canMutate,
              personPicker: 'school_teachers',
              classWorkspaceItemId: classItemId,
            ),
          ],
        );
      },
    );
  }
}
