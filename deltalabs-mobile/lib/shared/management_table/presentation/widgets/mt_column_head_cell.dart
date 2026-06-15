import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/shared/management_table/data/models/mt_column_model.dart';
import 'package:flutter/material.dart';

typedef MtColumnRenameCallback = Future<void> Function(String title);
typedef MtColumnDeleteCallback = Future<void> Function();

class MtColumnHeadCell extends StatelessWidget {
  const MtColumnHeadCell({
    required this.column,
    required this.columnCount,
    required this.enabled,
    required this.onRename,
    required this.onDelete,
    super.key,
  });

  final MtColumnModel column;
  final int columnCount;
  final bool enabled;
  final MtColumnRenameCallback onRename;
  final MtColumnDeleteCallback onDelete;

  Future<void> _promptRename(BuildContext context) async {
    final controller = TextEditingController(text: column.title);
    final next = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Rename column'),
        content: TextField(
          controller: controller,
          autofocus: true,
          maxLength: 200,
          decoration: const InputDecoration(
            labelText: 'Column name',
            border: OutlineInputBorder(),
          ),
          onSubmitted: (value) => Navigator.of(ctx).pop(value.trim()),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(controller.text.trim()),
            child: const Text('Save'),
          ),
        ],
      ),
    );
    if (next == null || next.isEmpty || next == column.title) return;
    await onRename(next);
  }

  Future<void> _confirmDelete(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Remove column?'),
        content: Text(
          'Remove column "${column.title}"? Row data for this field stays in the database but will no longer appear in the table.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Remove'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    await onDelete();
  }

  @override
  Widget build(BuildContext context) {
    if (!enabled) {
      return Text(
        column.title,
        maxLines: 2,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: AppColors.primary,
        ),
      );
    }

    final canRemove = columnCount > 1;

    return Row(
      children: [
        Expanded(
          child: GestureDetector(
            onDoubleTap: () => _promptRename(context),
            child: Text(
              column.title,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: AppColors.primary,
              ),
            ),
          ),
        ),
        PopupMenuButton<String>(
          padding: EdgeInsets.zero,
          icon: const Icon(Icons.more_horiz_rounded, size: 18, color: AppColors.textSecondary),
          onSelected: (value) async {
            if (value == 'rename') {
              await _promptRename(context);
            } else if (value == 'remove' && canRemove) {
              await _confirmDelete(context);
            }
          },
          itemBuilder: (context) => [
            const PopupMenuItem(
              value: 'rename',
              child: ListTile(
                dense: true,
                leading: Icon(Icons.edit_outlined, size: 20),
                title: Text('Rename'),
                contentPadding: EdgeInsets.zero,
              ),
            ),
            PopupMenuItem(
              value: 'remove',
              enabled: canRemove,
              child: ListTile(
                dense: true,
                leading: Icon(
                  Icons.delete_outline_rounded,
                  size: 20,
                  color: canRemove ? Colors.red : AppColors.textHint,
                ),
                title: Text(
                  'Remove',
                  style: TextStyle(color: canRemove ? Colors.red : AppColors.textHint),
                ),
                contentPadding: EdgeInsets.zero,
              ),
            ),
          ],
        ),
      ],
    );
  }
}
