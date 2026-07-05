import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_workspace_item_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/providers/school_providers.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_state_panel.dart';
import 'package:deltalabs_mobile/shared/management_table/data/models/mt_table_group_model.dart';
import 'package:deltalabs_mobile/shared/management_table/presentation/providers/management_table_providers.dart';
import 'package:deltalabs_mobile/shared/management_table/presentation/widgets/mt_group_section.dart';
import 'package:deltalabs_mobile/shared/widgets/loading/dl_loading_indicator.dart';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

String _bootstrapErrorMessage(Object error) {
  if (error is DioException) {
    final status = error.response?.statusCode;
    if (status == 404) {
      return 'The grades-table API is not on the live server yet. '
          'Deploy the latest deltalabs-backend, then try again.';
    }
    if (status == 403) {
      return 'You need school manage permission on this organization to create the grades table.';
    }
    final detail = error.response?.data;
    if (detail is Map && detail['message'] != null) {
      return detail['message'].toString();
    }
    if (detail is Map && detail['detail'] != null) {
      return detail['detail'].toString();
    }
  }
  return 'Could not create grades table. Check your connection and try again.';
}

class ClassGradesTableTab extends HookConsumerWidget {
  const ClassGradesTableTab({
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
    final instanceId = useState<String?>(classItem.gradesTableInstanceId);
    final bootstrapping = useState(false);
    final bootstrapError = useState<String?>(null);

    useEffect(() {
      instanceId.value = classItem.gradesTableInstanceId;
      return null;
    }, [classItem.gradesTableInstanceId]);

    Future<void> ensureTable({bool auto = false}) async {
      if (instanceId.value != null || bootstrapping.value) return;
      if (auto && !canMutate) return;

      bootstrapping.value = true;
      bootstrapError.value = null;
      try {
        final id = await ref.read(schoolRemoteDataSourceProvider).bootstrapClassGradesTable(
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
            title: 'Grades table not set up',
            message: 'A school manager needs to open this tab once to create the class grades table.',
          ),
        );
      }

      return Padding(
        padding: const EdgeInsets.all(16),
        child: SchoolStatePanel(
          icon: Icons.table_chart_outlined,
          title: 'Create grades table',
          message: bootstrapError.value ??
              'Record student grades for this class. Pick students and teachers, then enter scores.',
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
              title: 'Could not load grades table',
              message: boardState.errorMessage ?? 'Pull to refresh.',
            ),
          );
        }

        final groups = bundle.instance.tableGroups;
        final mainGroup = groups.isNotEmpty ? groups.first : MtTableGroupModel.fallbackMain();

        return ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
          children: [
            const Text(
              'Grade',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Record student grades for this class. Pick a student and teacher, enter course name and scores. '
              'Add columns for finals, assignments, or other assessments.',
              style: TextStyle(
                fontSize: 13,
                height: 1.4,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 16),
            MtGroupSection(
              boardQuery: boardQuery,
              groupId: mainGroup.id,
              groupTitle: mainGroup.title,
              definition: bundle.definition,
              canMutate: canMutate,
              personPicker: 'class_students',
              classWorkspaceItemId: classItemId,
            ),
          ],
        );
      },
    );
  }
}
