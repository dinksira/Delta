import 'package:deltalabs_mobile/shared/management_table/data/models/mt_definition_model.dart';
import 'package:deltalabs_mobile/shared/management_table/data/models/mt_row_model.dart';
import 'package:deltalabs_mobile/shared/management_table/presentation/widgets/mt_board_grid.dart';
import 'package:flutter/material.dart';

/// Read-only management table grid (Phase 1 compatibility wrapper).
class MtReadOnlyBoardGrid extends StatelessWidget {
  const MtReadOnlyBoardGrid({
    required this.definition,
    required this.rows,
    super.key,
  });

  final MtDefinitionModel definition;
  final List<MtRowModel> rows;

  @override
  Widget build(BuildContext context) {
    return MtBoardGrid(
      definition: definition,
      rows: rows,
    );
  }
}
