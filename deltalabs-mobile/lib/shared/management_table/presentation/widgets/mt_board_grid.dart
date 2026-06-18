import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/shared/management_table/data/models/mt_column_model.dart';
import 'package:deltalabs_mobile/shared/management_table/data/models/mt_column_type.dart';
import 'package:deltalabs_mobile/shared/management_table/data/models/mt_definition_model.dart';
import 'package:deltalabs_mobile/shared/management_table/data/models/mt_row_model.dart';
import 'package:deltalabs_mobile/shared/management_table/presentation/utils/mt_board_grid_utils.dart';
import 'package:deltalabs_mobile/shared/management_table/presentation/utils/mt_cell_display.dart';
import 'package:deltalabs_mobile/shared/management_table/presentation/widgets/mt_add_column_sheet.dart';
import 'package:deltalabs_mobile/shared/management_table/presentation/widgets/mt_cell_editor.dart';
import 'package:deltalabs_mobile/shared/management_table/presentation/widgets/mt_column_head_cell.dart';
import 'package:deltalabs_mobile/shared/widgets/management_table/dl_management_table.dart';
import 'package:flutter/material.dart';

typedef MtCellCommitHandler = void Function(
  MtRowModel row,
  MtColumnModel column,
  Object? value,
);

typedef MtColumnRenameHandler = Future<void> Function(
  MtColumnModel column,
  String title,
);

typedef MtColumnDeleteHandler = Future<void> Function(MtColumnModel column);

typedef MtColumnAppendHandler = Future<void> Function(MtColumnType type);

class MtBoardGrid extends StatelessWidget {
  const MtBoardGrid({
    required this.definition,
    required this.rows,
    this.readOnly = true,
    this.canMutateSchema = false,
    this.personSearchOrgId,
    this.personSearchSchoolId,
    this.personPicker = 'school_students',
    this.onCellCommit,
    this.onRenameColumn,
    this.onDeleteColumn,
    this.onAppendColumn,
    super.key,
  });

  final MtDefinitionModel definition;
  final List<MtRowModel> rows;
  final bool readOnly;
  final bool canMutateSchema;
  final String? personSearchOrgId;
  final String? personSearchSchoolId;
  final String personPicker;
  final MtCellCommitHandler? onCellCommit;
  final MtColumnRenameHandler? onRenameColumn;
  final MtColumnDeleteHandler? onDeleteColumn;
  final MtColumnAppendHandler? onAppendColumn;

  @override
  Widget build(BuildContext context) {
    final columns = definition.columns;
    if (columns.isEmpty && !canMutateSchema) {
      return const SizedBox.shrink();
    }

    final schemaEnabled = canMutateSchema &&
        onRenameColumn != null &&
        onDeleteColumn != null &&
        onAppendColumn != null;

    Future<void> openAddColumn() async {
      if (!schemaEnabled) return;
      final type = await showMtAddColumnSheet(context);
      if (type == null) return;
      await onAppendColumn!(type);
    }

    final tableColumns = <DlManagementTableColumn<MtRowModel>>[
      for (final column in columns)
        DlManagementTableColumn<MtRowModel>(
          id: column.id,
          header: column.title,
          minWidth: mtMinWidthForColumn(column),
          align: mtAlignForColumn(column),
          headerBuilder: schemaEnabled
              ? (ctx) => MtColumnHeadCell(
                    column: column,
                    columnCount: columns.length,
                    enabled: true,
                    onRename: (title) => onRenameColumn!(column, title),
                    onDelete: () => onDeleteColumn!(column),
                  )
              : null,
          cellBuilder: (_, row, __) => _buildCell(column, row),
        ),
      if (schemaEnabled)
        DlManagementTableColumn<MtRowModel>(
          id: '__add_column',
          header: 'Add column',
          headerBuilder: (ctx) => TextButton.icon(
            onPressed: openAddColumn,
            icon: const Icon(Icons.add_rounded, size: 16),
            label: const Text(
              'Add column',
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
            ),
            style: TextButton.styleFrom(
              foregroundColor: AppColors.textSecondary,
              padding: const EdgeInsets.symmetric(horizontal: 4),
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
          ),
          cellBuilder: (_, __, ___) => const SizedBox.shrink(),
        ),
    ];

    return DlManagementTable<MtRowModel>(
      rows: rows,
      rowKey: (row, index) => row.id.isNotEmpty ? row.id : 'row-$index',
      leadingColumn: DlManagementTableColumn<MtRowModel>(
        id: '__row_index',
        header: '#',
        minWidth: 44,
        align: TextAlign.center,
        cellBuilder: (_, __, index) => Text(
          '${index + 1}',
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
      ),
      columns: tableColumns,
      emptyMessage: 'No rows in this table yet',
    );
  }

  Widget _buildCell(MtColumnModel column, MtRowModel row) {
    final value = row.cellValue(column.id);
    if (readOnly || onCellCommit == null) {
      return buildMtCellDisplayWidget(column, value);
    }
    return MtCellEditor(
      column: column,
      value: value,
      personSearchOrgId: personSearchOrgId,
      personSearchSchoolId: personSearchSchoolId,
      personPicker: personPicker,
      onCommit: (next) => onCellCommit!(row, column, next),
    );
  }
}
