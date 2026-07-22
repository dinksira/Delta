import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_workspace_item_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/providers/school_providers.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/class/class_mt_groups_list.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_state_panel.dart';
import 'package:deltalabs_mobile/shared/management_table/data/models/mt_column_model.dart';
import 'package:deltalabs_mobile/shared/management_table/data/models/mt_column_type.dart';
import 'package:deltalabs_mobile/shared/management_table/data/models/mt_table_group_model.dart';
import 'package:deltalabs_mobile/shared/management_table/presentation/providers/management_table_providers.dart';
import 'package:deltalabs_mobile/shared/management_table/presentation/utils/mt_column_type_meta.dart';
import 'package:deltalabs_mobile/shared/widgets/loading/dl_loading_indicator.dart';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

String _bootstrapErrorMessage(Object error) {
  if (error is DioException) {
    final status = error.response?.statusCode;
    if (status == 404) {
      return 'The leave-requests-table API is not on the live server yet. '
          'Deploy the latest deltalabs-backend, then try again.';
    }
    if (status == 403) {
      return 'You need school manage permission on this organization to create the leave requests table.';
    }
    final detail = error.response?.data;
    if (detail is Map && detail['message'] != null) {
      return detail['message'].toString();
    }
    if (detail is Map && detail['detail'] != null) {
      return detail['detail'].toString();
    }
  }
  return 'Could not create leave requests table. Check your connection and try again.';
}

bool _isStudentFillableColumn(MtColumnModel column) {
  final title = column.title.trim().toLowerCase();
  return title != 'student' && title != 'status';
}

class ClassLeaveRequestsPanel extends HookConsumerWidget {
  const ClassLeaveRequestsPanel({
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
    final instanceId = useState<String?>(classItem.leaveRequestsTableInstanceId);
    final bootstrapping = useState(false);
    final bootstrapError = useState<String?>(null);

    useEffect(() {
      instanceId.value = classItem.leaveRequestsTableInstanceId;
      return null;
    }, [classItem.leaveRequestsTableInstanceId]);

    Future<void> ensureTable({bool auto = false}) async {
      if (instanceId.value != null || bootstrapping.value) return;
      if (auto && !canMutate) return;

      bootstrapping.value = true;
      bootstrapError.value = null;
      try {
        final id = await ref.read(schoolRemoteDataSourceProvider).bootstrapLeaveRequestsTable(
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
          padding: EdgeInsets.symmetric(vertical: 32),
          child: Center(child: DlLoadingIndicator()),
        );
      }

      if (!canMutate) {
        return const SchoolStatePanel(
          icon: Icons.event_busy_outlined,
          title: 'Leave requests table not set up',
          message:
              'A school manager needs to open Leave management once to create the submission form and inbox.',
        );
      }

      return SchoolStatePanel(
        icon: Icons.event_busy_outlined,
        title: 'Create leave requests table',
        message: bootstrapError.value ??
            'Configure columns for the leave form. Rows appear when students submit.',
        actionLabel: 'Create table',
        onAction: () => ensureTable(),
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
            padding: EdgeInsets.symmetric(vertical: 32),
            child: Center(child: DlLoadingIndicator()),
          );
        }

        final bundle = boardState.bundle;
        if (bundle == null) {
          return SchoolStatePanel(
            icon: Icons.error_outline_rounded,
            title: 'Could not load leave requests table',
            message: boardState.errorMessage ?? 'Pull to refresh and try again.',
          );
        }

        final groups = bundle.instance.tableGroups;
        final columns = bundle.definition.columns;

        if (!canMutate) {
          return _LeaveRequestSubmitForm(
            orgId: orgId,
            schoolId: schoolId,
            classItemId: classItemId,
            boardQuery: boardQuery,
            columns: columns,
          );
        }

        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              canMutate
                  ? 'Configure columns for the leave form. Rows appear only when students submit — review and update Status; do not add rows yourself.'
                  : 'Submit a leave request using the form below. Each submission adds one row to the class inbox.',
              style: const TextStyle(
                fontSize: 12,
                height: 1.4,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 12),
            ClassMtGroupsList(
              boardQuery: boardQuery,
              definition: bundle.definition,
              groups: groups.isNotEmpty ? groups : [MtTableGroupModel.fallbackMain()],
              canMutate: canMutate,
              personPicker: 'class_students',
              classWorkspaceItemId: classItemId,
              addColumnGroups: classLeaveRequestsAddColumnGroups,
              allowAddRow: false,
              onlyEditableColumnTitles: const {'Status'},
              emptyRowsMessage:
                  'No leave requests yet. Rows appear when students submit the leave form.',
            ),
          ],
        );
      },
    );
  }
}

class _LeaveRequestSubmitForm extends HookConsumerWidget {
  const _LeaveRequestSubmitForm({
    required this.orgId,
    required this.schoolId,
    required this.classItemId,
    required this.boardQuery,
    required this.columns,
  });

  final String orgId;
  final String schoolId;
  final String classItemId;
  final MtInstanceQuery boardQuery;
  final List<MtColumnModel> columns;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final fillableColumns = useMemoized(
      () => columns.where(_isStudentFillableColumn).toList(),
      [columns],
    );
    final cells = useState<Map<String, dynamic>>({});
    final submitted = useState(false);
    final submitting = useState(false);

    if (submitted.value) {
      return SchoolStatePanel(
        icon: Icons.check_circle_outline_rounded,
        title: 'Leave request submitted',
        message:
            'Your request was sent to the class manager. You will see updates when they review it.',
        actionLabel: 'Submit another',
        onAction: () {
          submitted.value = false;
          cells.value = {};
        },
      );
    }

    Future<void> submit() async {
      if (submitting.value) return;
      submitting.value = true;
      try {
        await ref.read(schoolRemoteDataSourceProvider).submitClassLeaveRequest(
              orgId: orgId,
              schoolId: schoolId,
              classWorkspaceItemId: classItemId,
              cells: cells.value,
            );
        await ref.read(mtInstanceBoardProvider(boardQuery)).refresh();
        submitted.value = true;
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Leave request submitted'),
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      } catch (_) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Could not submit leave request'),
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      } finally {
        submitting.value = false;
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text(
          'Submit leave request',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 4),
        const Text(
          'Fill in the form below. Your submission creates a row in the class leave inbox.',
          style: TextStyle(fontSize: 12, height: 1.4, color: AppColors.textSecondary),
        ),
        const SizedBox(height: 16),
        DecoratedBox(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.divider),
          ),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                for (final column in fillableColumns) ...[
                  _LeaveRequestField(
                    column: column,
                    value: cells.value[column.id],
                    onChanged: (next) {
                      cells.value = {...cells.value, column.id: next};
                    },
                  ),
                  const SizedBox(height: 12),
                ],
                FilledButton(
                  onPressed: submitting.value ? null : submit,
                  child: Text(submitting.value ? 'Submitting…' : 'Submit leave request'),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _LeaveRequestField extends HookWidget {
  const _LeaveRequestField({
    required this.column,
    required this.value,
    required this.onChanged,
  });

  final MtColumnModel column;
  final Object? value;
  final ValueChanged<Object?> onChanged;

  @override
  Widget build(BuildContext context) {
    final label = column.title;

    switch (column.type) {
      case MtColumnType.textarea:
        final controller = useTextEditingController(text: value?.toString() ?? '');
        return TextField(
          decoration: InputDecoration(labelText: label),
          maxLines: 3,
          controller: controller,
          onChanged: onChanged,
        );
      case MtColumnType.date:
        final dateText = value?.toString() ?? '';
        return InkWell(
          onTap: () async {
            final initial = dateText.isNotEmpty ? DateTime.tryParse(dateText) : null;
            final picked = await showDatePicker(
              context: context,
              initialDate: initial ?? DateTime.now(),
              firstDate: DateTime(2000),
              lastDate: DateTime(2100),
            );
            if (picked != null) {
              onChanged(picked.toIso8601String().split('T').first);
            }
          },
          child: InputDecorator(
            decoration: InputDecoration(labelText: label),
            child: Text(
              dateText.isNotEmpty ? dateText : 'Select date',
              style: TextStyle(
                color: dateText.isNotEmpty ? AppColors.textPrimary : AppColors.textHint,
              ),
            ),
          ),
        );
      case MtColumnType.link:
        final controller = useTextEditingController(text: value?.toString() ?? '');
        return TextField(
          decoration: InputDecoration(labelText: label, hintText: 'https://'),
          keyboardType: TextInputType.url,
          controller: controller,
          onChanged: onChanged,
        );
      default:
        final controller = useTextEditingController(text: value?.toString() ?? '');
        return TextField(
          decoration: InputDecoration(labelText: label),
          controller: controller,
          onChanged: onChanged,
        );
    }
  }
}
