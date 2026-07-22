import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/shared/management_table/data/models/mt_definition_model.dart';
import 'package:deltalabs_mobile/shared/management_table/data/models/mt_table_group_model.dart';
import 'package:deltalabs_mobile/shared/management_table/presentation/providers/management_table_providers.dart';
import 'package:deltalabs_mobile/shared/management_table/presentation/utils/mt_column_type_meta.dart';
import 'package:deltalabs_mobile/shared/management_table/presentation/widgets/mt_group_section.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

/// Renders all management-table groups for a class tab (+ optional “New table group”).
class ClassMtGroupsList extends ConsumerWidget {
  const ClassMtGroupsList({
    required this.boardQuery,
    required this.definition,
    required this.groups,
    required this.canMutate,
    this.personPicker = 'school_students',
    this.classWorkspaceItemId,
    this.addColumnGroups = mtAddColumnGroups,
    this.allowAddRow = true,
    this.onlyEditableColumnTitles,
    this.emptyRowsMessage,
    super.key,
  });

  final MtInstanceQuery boardQuery;
  final MtDefinitionModel definition;
  final List<MtTableGroupModel> groups;
  final bool canMutate;
  final String personPicker;
  final String? classWorkspaceItemId;
  final List<MtAddColumnGroup> addColumnGroups;
  final bool allowAddRow;
  final Set<String>? onlyEditableColumnTitles;
  final String? emptyRowsMessage;

  Future<void> _createGroup(BuildContext context, WidgetRef ref) async {
    final controller = TextEditingController(text: 'New group');
    final title = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('New table group'),
        content: TextField(
          controller: controller,
          autofocus: true,
          decoration: const InputDecoration(hintText: 'Group title'),
          onSubmitted: (value) => Navigator.of(ctx).pop(value.trim()),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(controller.text.trim()),
            style: FilledButton.styleFrom(backgroundColor: AppColors.primary),
            child: const Text('Create'),
          ),
        ],
      ),
    );
    controller.dispose();
    if (title == null || title.isEmpty) return;

    try {
      await ref.read(mtInstanceBoardProvider(boardQuery)).addTableGroup(title);
    } catch (_) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not create table group.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final resolved =
        groups.isNotEmpty ? groups : [MtTableGroupModel.fallbackMain()];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        for (var i = 0; i < resolved.length; i++) ...[
          if (i > 0) const SizedBox(height: 16),
          MtGroupSection(
            boardQuery: boardQuery,
            groupId: resolved[i].id,
            groupTitle: resolved[i].title,
            definition: definition,
            canMutate: canMutate,
            personPicker: personPicker,
            classWorkspaceItemId: classWorkspaceItemId,
            addColumnGroups: addColumnGroups,
            allowAddRow: allowAddRow,
            onlyEditableColumnTitles: onlyEditableColumnTitles,
            emptyRowsMessage: emptyRowsMessage,
          ),
        ],
        if (canMutate) ...[
          const SizedBox(height: 16),
          OutlinedButton.icon(
            onPressed: () => _createGroup(context, ref),
            icon: const Icon(Icons.table_chart_outlined, size: 18),
            label: const Text('New table group'),
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              foregroundColor: AppColors.textPrimary,
              side: BorderSide(
                color: AppColors.inputBorder.withValues(alpha: 0.9),
              ),
            ),
          ),
        ],
      ],
    );
  }
}
