import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_workspace_item_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/providers/school_providers.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/utils/schedule_calendar_utils.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/class/class_mt_groups_list.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/class/class_schedule_calendar_view.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_state_panel.dart';
import 'package:deltalabs_mobile/shared/management_table/data/models/mt_column_model.dart';
import 'package:deltalabs_mobile/shared/management_table/data/models/mt_table_group_model.dart';
import 'package:deltalabs_mobile/shared/management_table/presentation/providers/management_table_providers.dart';
import 'package:deltalabs_mobile/shared/management_table/presentation/state/mt_instance_board_controller.dart';
import 'package:deltalabs_mobile/shared/management_table/presentation/utils/mt_column_type_meta.dart';
import 'package:deltalabs_mobile/shared/widgets/loading/dl_loading_indicator.dart';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

enum _SchedulesView { table, calendar }

String _bootstrapErrorMessage(Object error) {
  if (error is DioException) {
    final status = error.response?.statusCode;
    if (status == 404) {
      return 'The schedules-table API is not on the live server yet. '
          'Deploy the latest deltalabs-backend, then try again.';
    }
    if (status == 403) {
      return 'You need school manage permission on this organization to create the schedules table.';
    }
    final detail = error.response?.data;
    if (detail is Map && detail['message'] != null) {
      return detail['message'].toString();
    }
    if (detail is Map && detail['detail'] != null) {
      return detail['detail'].toString();
    }
  }
  return 'Could not create schedules table. Check your connection and try again.';
}

class ClassSchedulesTableTab extends HookConsumerWidget {
  const ClassSchedulesTableTab({
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
    final instanceId = useState<String?>(classItem.schedulesTableInstanceId);
    final bootstrapping = useState(false);
    final bootstrapError = useState<String?>(null);
    final viewMode = useState(_SchedulesView.table);

    useEffect(() {
      instanceId.value = classItem.schedulesTableInstanceId;
      return null;
    }, [classItem.schedulesTableInstanceId]);

    Future<void> ensureTable({bool auto = false}) async {
      if (instanceId.value != null || bootstrapping.value) return;
      if (auto && !canMutate) return;

      bootstrapping.value = true;
      bootstrapError.value = null;
      try {
        final id = await ref.read(schoolRemoteDataSourceProvider).bootstrapClassSchedulesTable(
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
            icon: Icons.calendar_month_outlined,
            title: 'Schedules table not set up',
            message:
                'A school manager needs to open this tab once to create the class schedules table.',
          ),
        );
      }

      return Padding(
        padding: const EdgeInsets.all(16),
        child: SchoolStatePanel(
          icon: Icons.calendar_month_outlined,
          title: 'Create schedules table',
          message: bootstrapError.value ??
              'Plan class schedules and link rows to class sessions.',
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
              title: 'Could not load schedules table',
              message: boardState.errorMessage ?? 'Pull to refresh.',
            ),
          );
        }

        final groups = bundle.instance.tableGroups;
        final mainGroup = groups.isNotEmpty ? groups.first : MtTableGroupModel.fallbackMain();
        final columns = bundle.definition.columns;
        final hasDateColumn = findScheduleColumnByTitle(columns, 'Date') != null;

        return Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                'Schedules',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Plan schedules for this class. Link rows to sessions and add columns for exams or events.',
                style: TextStyle(
                  fontSize: 13,
                  height: 1.4,
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 16),
              SegmentedButton<_SchedulesView>(
                segments: const [
                  ButtonSegment(
                    value: _SchedulesView.table,
                    label: Text('Table'),
                    icon: Icon(Icons.table_chart_outlined, size: 18),
                  ),
                  ButtonSegment(
                    value: _SchedulesView.calendar,
                    label: Text('Calendar'),
                    icon: Icon(Icons.calendar_month_outlined, size: 18),
                  ),
                ],
                selected: {viewMode.value},
                onSelectionChanged: (value) => viewMode.value = value.first,
              ),
              const SizedBox(height: 16),
              Expanded(
                child: viewMode.value == _SchedulesView.table
                    ? ListView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        children: [
                          ClassMtGroupsList(
                            boardQuery: boardQuery,
                            definition: bundle.definition,
                            groups: groups,
                            canMutate: canMutate,
                            personPicker: 'school_teachers',
                            classWorkspaceItemId: classItemId,
                            addColumnGroups: classSchedulesAddColumnGroups,
                          ),
                        ],
                      )
                    : _SchedulesCalendarPanel(
                        board: board,
                        groupId: mainGroup.id,
                        columns: columns,
                        canMutate: canMutate,
                        hasDateColumn: hasDateColumn,
                        onSwitchToTable: () => viewMode.value = _SchedulesView.table,
                      ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _SchedulesCalendarPanel extends HookConsumerWidget {
  const _SchedulesCalendarPanel({
    required this.board,
    required this.groupId,
    required this.columns,
    required this.canMutate,
    required this.hasDateColumn,
    required this.onSwitchToTable,
  });

  final MtInstanceBoardController board;
  final String groupId;
  final List<MtColumnModel> columns;
  final bool canMutate;
  final bool hasDateColumn;
  final VoidCallback onSwitchToTable;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final weekStart = useState(startOfWeekMonday(DateTime.now()));
    final creating = useState(false);

    useEffect(() {
      board.ensureGroupRows(groupId);
      return null;
    }, [groupId]);

    if (!hasDateColumn) {
      return SchoolStatePanel(
        icon: Icons.calendar_month_outlined,
        title: 'Add a Date column to use the calendar',
        message: 'Switch to Table, use Add column, and pick Date.',
        actionLabel: 'Open Table',
        onAction: onSwitchToTable,
      );
    }

    return ListenableBuilder(
      listenable: board,
      builder: (context, _) {
        final boardState = board.state;
        if (boardState.isGroupLoading(groupId) && !boardState.isGroupLoaded(groupId)) {
          return const Center(child: DlLoadingIndicator());
        }

        final rows = boardState.rowsFor(groupId);
        final events = buildScheduleCalendarEvents(rows, columns);

        Future<void> handleCreateAtSlot(String dateKey, int startMinutes) async {
          if (!canMutate || creating.value) return;
          creating.value = true;
          try {
            await board.addRow(groupId);
            final updatedRows = board.state.rowsFor(groupId);
            final row = updatedRows.isNotEmpty ? updatedRows.last : null;
            if (row == null) return;

            final dateCol = findScheduleColumnByTitle(columns, 'Date');
            final timeCol = findScheduleColumnByTitle(columns, 'Time');
            if (dateCol != null) {
              await board.patchCell(
                groupId: groupId,
                row: row,
                column: dateCol,
                rawValue: dateKey,
              );
            }
            if (timeCol != null) {
              final latestRow = board.state.rowsFor(groupId).firstWhere(
                    (item) => item.id == row.id,
                    orElse: () => row,
                  );
              await board.patchCell(
                groupId: groupId,
                row: latestRow,
                column: timeCol,
                rawValue: formatMinutesAsTime(startMinutes),
              );
            }
          } catch (_) {
            if (context.mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Could not create schedule row.')),
              );
            }
          } finally {
            creating.value = false;
          }
        }

        return Stack(
          children: [
            ClassScheduleCalendarView(
              weekStart: weekStart.value,
              onWeekStartChanged: (next) => weekStart.value = next,
              events: events,
              canMutate: canMutate,
              onCreateAtSlot: canMutate ? handleCreateAtSlot : null,
            ),
            if (creating.value)
              Positioned(
                top: 8,
                right: 8,
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    color: AppColors.background.withValues(alpha: 0.92),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppColors.divider),
                  ),
                  child: const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        SizedBox(
                          width: 14,
                          height: 14,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                        SizedBox(width: 8),
                        Text(
                          'Creating…',
                          style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
          ],
        );
      },
    );
  }
}
