import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_workspace_item_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/models/school_workspace_constants.dart';
import 'package:flutter/material.dart';

enum SchoolWorkspaceLayoutMode { grid, list }

class SchoolWorkspaceItemCard extends StatelessWidget {
  const SchoolWorkspaceItemCard({
    required this.item,
    required this.layoutMode,
    required this.onPrimaryOpen,
    this.onEdit,
    this.onDelete,
    super.key,
  });

  final SchoolWorkspaceItemModel item;
  final SchoolWorkspaceLayoutMode layoutMode;
  final VoidCallback? onPrimaryOpen;
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;

  @override
  Widget build(BuildContext context) {
    if (layoutMode == SchoolWorkspaceLayoutMode.list) {
      return _ListCard(
        item: item,
        onPrimaryOpen: onPrimaryOpen,
        onEdit: onEdit,
        onDelete: onDelete,
      );
    }
    return _GridCard(
      item: item,
      onPrimaryOpen: onPrimaryOpen,
      onEdit: onEdit,
      onDelete: onDelete,
    );
  }
}

class _GridCard extends StatelessWidget {
  const _GridCard({
    required this.item,
    this.onPrimaryOpen,
    this.onEdit,
    this.onDelete,
  });

  final SchoolWorkspaceItemModel item;
  final VoidCallback? onPrimaryOpen;
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.inputBorder.withValues(alpha: 0.75)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _TypeIcon(type: item.type),
              const Spacer(),
              if (onEdit != null || onDelete != null)
                _ItemMenu(onEdit: onEdit, onDelete: onDelete),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            item.title,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: AppColors.primary,
              fontSize: 16,
              fontWeight: FontWeight.w700,
              height: 1.2,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            SchoolWorkspaceConstants.primaryMeta(item),
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
          if (SchoolWorkspaceConstants.secondaryMeta(item).isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              SchoolWorkspaceConstants.secondaryMeta(item),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(color: AppColors.textHint, fontSize: 12),
            ),
          ],
          const SizedBox(height: 12),
          if (item.hasPrimaryOpen)
            FilledButton(
              onPressed: onPrimaryOpen,
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.primary,
                minimumSize: const Size.fromHeight(36),
                padding: const EdgeInsets.symmetric(horizontal: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              child: Text(
                _gridOpenLabel(item),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
              ),
            ),
        ],
      ),
    );
  }
}

class _ListCard extends StatelessWidget {
  const _ListCard({
    required this.item,
    this.onPrimaryOpen,
    this.onEdit,
    this.onDelete,
  });

  final SchoolWorkspaceItemModel item;
  final VoidCallback? onPrimaryOpen;
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.inputBorder.withValues(alpha: 0.75)),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      child: Row(
        children: [
          _TypeIcon(type: item.type, size: 36),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: AppColors.primary,
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  SchoolWorkspaceConstants.primaryMeta(item),
                  style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                ),
              ],
            ),
          ),
          if (item.hasPrimaryOpen)
            TextButton(onPressed: onPrimaryOpen, child: Text(_openLabel(item))),
          if (onEdit != null || onDelete != null)
            _ItemMenu(onEdit: onEdit, onDelete: onDelete),
        ],
      ),
    );
  }
}

class _TypeIcon extends StatelessWidget {
  const _TypeIcon({required this.type, this.size = 40});

  final SchoolWorkspaceItemType type;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Icon(
        SchoolWorkspaceConstants.iconForItemType(type),
        color: AppColors.primary,
        size: size * 0.5,
      ),
    );
  }
}

class _ItemMenu extends StatelessWidget {
  const _ItemMenu({this.onEdit, this.onDelete});

  final VoidCallback? onEdit;
  final VoidCallback? onDelete;

  @override
  Widget build(BuildContext context) {
    return PopupMenuButton<String>(
      icon: const Icon(Icons.more_vert_rounded, color: AppColors.textSecondary, size: 20),
      padding: EdgeInsets.zero,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      onSelected: (value) {
        if (value == 'edit') onEdit?.call();
        if (value == 'delete') onDelete?.call();
      },
      itemBuilder: (context) => [
        if (onEdit != null)
          const PopupMenuItem(value: 'edit', child: Text('Edit')),
        if (onDelete != null)
          const PopupMenuItem(value: 'delete', child: Text('Delete')),
      ],
    );
  }
}

String _gridOpenLabel(SchoolWorkspaceItemModel item) => 'Open';

String _openLabel(SchoolWorkspaceItemModel item) {
  if (item.opensAsFolder) return 'Open folder';
  if (item.opensAsDepartment) return 'Open department';
  if (item.opensAsClass) return 'Open class';
  if (item.opensAsStudent) return 'Register students';
  if (item.opensAsManagementTable) return 'Open table';
  return 'Open';
}
