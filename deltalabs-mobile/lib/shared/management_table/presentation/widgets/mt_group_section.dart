import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/shared/management_table/data/models/mt_definition_model.dart';
import 'package:deltalabs_mobile/shared/management_table/presentation/providers/management_table_providers.dart';
import 'package:deltalabs_mobile/shared/management_table/presentation/utils/mt_column_type_meta.dart';
import 'package:deltalabs_mobile/shared/management_table/presentation/widgets/mt_board_grid.dart';
import 'package:deltalabs_mobile/shared/widgets/loading/dl_loading_indicator.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

class MtGroupSection extends HookConsumerWidget {
  const MtGroupSection({
    required this.boardQuery,
    required this.groupId,
    required this.groupTitle,
    required this.definition,
    this.canMutate = false,
    this.personPicker = 'school_students',
    this.classWorkspaceItemId,
    this.addColumnGroups = mtAddColumnGroups,
    this.allowAddRow = true,
    this.onlyEditableColumnTitles,
    this.emptyRowsMessage,
    super.key,
  });

  final MtInstanceQuery boardQuery;
  final String groupId;
  final String groupTitle;
  final MtDefinitionModel definition;
  final bool canMutate;
  final String personPicker;
  final String? classWorkspaceItemId;
  final List<MtAddColumnGroup> addColumnGroups;
  final bool allowAddRow;
  final Set<String>? onlyEditableColumnTitles;
  final String? emptyRowsMessage;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final expanded = useState(true);
    final board = ref.watch(mtInstanceBoardProvider(boardQuery));

    useEffect(() {
      if (expanded.value) {
        board.ensureGroupRows(groupId);
      }
      return null;
    }, [expanded.value, groupId]);

    return ListenableBuilder(
      listenable: board,
      builder: (context, _) {
        final boardState = board.state;

        Future<void> runMutation(
          Future<void> Function() action,
          String errorMessage,
        ) async {
          try {
            await action();
          } catch (_) {
            if (context.mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text(errorMessage)),
              );
            }
          }
        }

        final rows = boardState.rowsFor(groupId);
        final showInitialRowLoader =
            !boardState.isGroupLoaded(groupId) && boardState.isGroupLoading(groupId);

        return DecoratedBox(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.inputBorder.withValues(alpha: 0.8)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              InkWell(
                onTap: () => expanded.value = !expanded.value,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(14)),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  child: Row(
                    children: [
                      Container(
                        width: 3,
                        height: 28,
                        margin: const EdgeInsets.only(right: 10),
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          borderRadius: BorderRadius.circular(999),
                        ),
                      ),
                      Icon(
                        expanded.value
                            ? Icons.keyboard_arrow_down_rounded
                            : Icons.keyboard_arrow_right_rounded,
                        color: AppColors.textSecondary,
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              groupTitle,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            Text(
                              showInitialRowLoader
                                  ? 'Loading…'
                                  : '${rows.length} row${rows.length == 1 ? '' : 's'}',
                              style: const TextStyle(
                                fontSize: 11,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              if (expanded.value) ...[
                const Divider(height: 1),
                Padding(
                  padding: const EdgeInsets.fromLTRB(12, 12, 12, 16),
                  child: showInitialRowLoader
                      ? const Padding(
                          padding: EdgeInsets.symmetric(vertical: 32),
                          child: Center(child: DlLoadingIndicator()),
                        )
                      : Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            MtBoardGrid(
                              definition: definition,
                              rows: rows,
                              readOnly: !canMutate,
                              canMutateSchema: canMutate,
                              personSearchOrgId: boardQuery.orgId,
                              personSearchSchoolId: boardQuery.schoolId,
                              personPicker: personPicker,
                              classWorkspaceItemId: classWorkspaceItemId,
                              addColumnGroups: addColumnGroups,
                              onlyEditableColumnTitles: onlyEditableColumnTitles,
                              emptyMessage: emptyRowsMessage ??
                                  'No rows in this table yet',
                              onCellCommit: canMutate
                                  ? (row, column, value) => runMutation(
                                        () => board.patchCell(
                                          groupId: groupId,
                                          row: row,
                                          column: column,
                                          rawValue: value,
                                        ),
                                        'Could not save cell. Try again.',
                                      )
                                  : null,
                              onRenameColumn: canMutate
                                  ? (column, title) => runMutation(
                                        () => board.renameColumn(column, title),
                                        'Could not rename column. Try again.',
                                      )
                                  : null,
                              onDeleteColumn: canMutate
                                  ? (column) => runMutation(
                                        () => board.deleteColumn(column),
                                        'Could not remove column. Try again.',
                                      )
                                  : null,
                              onAppendColumn: canMutate
                                  ? (spec) => runMutation(
                                        () => board.appendColumn(
                                          spec.type,
                                          title: spec.title,
                                          settings: spec.settings,
                                        ),
                                        'Could not add column. Try again.',
                                      )
                                  : null,
                            ),
                            if (canMutate && allowAddRow) ...[
                              const SizedBox(height: 12),
                              Align(
                                alignment: Alignment.centerLeft,
                                child: TextButton.icon(
                                  onPressed: () => runMutation(
                                    () => board.addRow(groupId),
                                    'Could not add row. Try again.',
                                  ),
                                  icon: const Icon(Icons.add_rounded, size: 18),
                                  label: const Text('Add row'),
                                ),
                              ),
                            ],
                          ],
                        ),
                ),
              ],
            ],
          ),
        );
      },
    );
  }
}
