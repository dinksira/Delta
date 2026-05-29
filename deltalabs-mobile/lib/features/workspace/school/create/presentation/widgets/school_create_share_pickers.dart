import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/workspace/school/create/domain/school_create_constants.dart';
import 'package:flutter/material.dart';

const _menuShape = RoundedRectangleBorder(
  borderRadius: BorderRadius.all(Radius.circular(10)),
);

Future<T?> _showAnchoredMenu<T>({
  required BuildContext context,
  required GlobalKey anchorKey,
  required List<PopupMenuEntry<T>> items,
}) {
  final box = anchorKey.currentContext?.findRenderObject() as RenderBox?;
  if (box == null || !box.hasSize) return Future.value();

  final overlay = Overlay.of(context).context.findRenderObject() as RenderBox;
  final topLeft = box.localToGlobal(Offset.zero, ancestor: overlay);
  final bottomRight = box.localToGlobal(box.size.bottomRight(Offset.zero), ancestor: overlay);
  final width = box.size.width;

  return showMenu<T>(
    context: context,
    position: RelativeRect.fromRect(
      Rect.fromLTWH(topLeft.dx, bottomRight.dy + 2, width, 0),
      Offset.zero & overlay.size,
    ),
    constraints: BoxConstraints(minWidth: width, maxWidth: width),
    shape: _menuShape,
    color: Colors.white,
    elevation: 3,
    items: items,
  );
}

/// Compact popup menu for share permission — menu width matches the field.
class SchoolCreatePermissionField extends StatefulWidget {
  const SchoolCreatePermissionField({
    required this.status,
    required this.onChanged,
    super.key,
  });

  final String status;
  final ValueChanged<String> onChanged;

  @override
  State<SchoolCreatePermissionField> createState() => _SchoolCreatePermissionFieldState();
}

class _SchoolCreatePermissionFieldState extends State<SchoolCreatePermissionField> {
  final _anchorKey = GlobalKey();

  Future<void> _openMenu() async {
    final picked = await _showAnchoredMenu<String>(
      context: context,
      anchorKey: _anchorKey,
      items: [
        for (final st in SchoolCreateConstants.shareStatuses)
          PopupMenuItem(
            value: st,
            height: 40,
            child: Text(
              SchoolCreateConstants.shareStatusLabels[st]!,
              style: TextStyle(
                fontSize: 13,
                fontWeight: st == widget.status ? FontWeight.w700 : FontWeight.w500,
                color: AppColors.primary,
              ),
            ),
          ),
      ],
    );
    if (picked != null) widget.onChanged(picked);
  }

  @override
  Widget build(BuildContext context) {
    final label = SchoolCreateConstants.shareStatusLabels[widget.status] ?? widget.status;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        key: _anchorKey,
        onTap: _openMenu,
        borderRadius: BorderRadius.circular(8),
        child: _FieldChip(label: label),
      ),
    );
  }
}

/// Compact popup menu for partner selection — menu width matches the field.
class SchoolCreatePartnerField extends StatefulWidget {
  const SchoolCreatePartnerField({
    required this.partnerNames,
    required this.selectedIndex,
    required this.onChanged,
    super.key,
  });

  final List<String> partnerNames;
  final int selectedIndex;
  final ValueChanged<int> onChanged;

  @override
  State<SchoolCreatePartnerField> createState() => _SchoolCreatePartnerFieldState();
}

class _SchoolCreatePartnerFieldState extends State<SchoolCreatePartnerField> {
  final _anchorKey = GlobalKey();

  Future<void> _openMenu() async {
    final index = widget.selectedIndex.clamp(0, widget.partnerNames.length - 1);
    final picked = await _showAnchoredMenu<int>(
      context: context,
      anchorKey: _anchorKey,
      items: [
        for (var i = 0; i < widget.partnerNames.length; i++)
          PopupMenuItem(
            value: i,
            height: 40,
            child: Text(
              widget.partnerNames[i],
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 14,
                fontWeight: i == index ? FontWeight.w700 : FontWeight.w500,
                color: AppColors.primary,
              ),
            ),
          ),
      ],
    );
    if (picked != null) widget.onChanged(picked);
  }

  @override
  Widget build(BuildContext context) {
    final index = widget.selectedIndex.clamp(0, widget.partnerNames.length - 1);
    final name = widget.partnerNames[index];

    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        key: _anchorKey,
        onTap: _openMenu,
        borderRadius: BorderRadius.circular(10),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: AppColors.inputBorder.withValues(alpha: 0.8)),
          ),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  name,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
              const Icon(Icons.keyboard_arrow_down_rounded, color: AppColors.textSecondary),
            ],
          ),
        ),
      ),
    );
  }
}

class _FieldChip extends StatelessWidget {
  const _FieldChip({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.surfaceGrey,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.inputBorder.withValues(alpha: 0.55)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: AppColors.primary,
              ),
            ),
          ),
          const Icon(
            Icons.keyboard_arrow_down_rounded,
            size: 18,
            color: AppColors.textSecondary,
          ),
        ],
      ),
    );
  }
}
