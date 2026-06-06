import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:flutter/material.dart';

/// Compact menu anchored to the card's ⋮ button (not a full-width bottom sheet).
class FeatureCardMenuPopup {
  FeatureCardMenuPopup._();

  static const double _menuWidth = 216;

  static Future<void> show({
    required BuildContext context,
    required BuildContext anchorContext,
    required bool canMoveLeft,
    required bool canMoveRight,
    required VoidCallback onRename,
    required VoidCallback onMoveLeft,
    required VoidCallback onMoveRight,
    required VoidCallback onRemove,
    bool verticalReorder = false,
    bool showRename = true,
    String removeLabel = 'Remove',
  }) {
    final box = anchorContext.findRenderObject() as RenderBox?;
    if (box == null || !context.mounted) return Future.value();

    final topLeft = box.localToGlobal(Offset.zero);
    final bottomRight = topLeft + box.size.bottomRight(Offset.zero);
    final screen = MediaQuery.sizeOf(context);
    const estimatedHeight = 212.0;
    final menuHeight = showRename ? estimatedHeight : estimatedHeight - 52;

    var left = bottomRight.dx - _menuWidth;
    var top = bottomRight.dy + 6;
    if (top + menuHeight > screen.height - 16) {
      top = topLeft.dy - menuHeight - 6;
    }
    left = left.clamp(12.0, screen.width - _menuWidth - 12.0);
    top = top.clamp(MediaQuery.paddingOf(context).top + 8, screen.height - menuHeight - 16);

    return showGeneralDialog<void>(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'Close menu',
      barrierColor: Colors.black.withValues(alpha: 0.12),
      transitionDuration: const Duration(milliseconds: 160),
      pageBuilder: (dialogContext, animation, _) {
        return FadeTransition(
          opacity: CurvedAnimation(parent: animation, curve: Curves.easeOut),
          child: Stack(
            children: [
              Positioned(
                left: left,
                top: top,
                width: _menuWidth,
                child: Material(
                  color: Colors.white,
                  elevation: 10,
                  shadowColor: Colors.black.withValues(alpha: 0.18),
                  borderRadius: BorderRadius.circular(14),
                  clipBehavior: Clip.antiAlias,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (showRename)
                        _ActionRow(
                          icon: Icons.edit_rounded,
                          label: 'Rename',
                          onTap: () {
                            Navigator.pop(dialogContext);
                            onRename();
                          },
                        ),
                      _ActionRow(
                        icon: verticalReorder
                            ? Icons.arrow_upward_rounded
                            : Icons.arrow_back_rounded,
                        label: verticalReorder ? 'Move up' : 'Move left',
                        enabled: canMoveLeft,
                        onTap: () {
                          Navigator.pop(dialogContext);
                          onMoveLeft();
                        },
                      ),
                      _ActionRow(
                        icon: verticalReorder
                            ? Icons.arrow_downward_rounded
                            : Icons.arrow_forward_rounded,
                        label: verticalReorder ? 'Move down' : 'Move right',
                        enabled: canMoveRight,
                        onTap: () {
                          Navigator.pop(dialogContext);
                          onMoveRight();
                        },
                      ),
                      Divider(
                        height: 1,
                        thickness: 1,
                        color: AppColors.inputBorder.withValues(alpha: 0.5),
                      ),
                      _ActionRow(
                        icon: Icons.visibility_off_outlined,
                        label: removeLabel,
                        accent: AppColors.error,
                        onTap: () {
                          Navigator.pop(dialogContext);
                          onRemove();
                        },
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _ActionRow extends StatelessWidget {
  const _ActionRow({
    required this.icon,
    required this.label,
    required this.onTap,
    this.enabled = true,
    this.accent,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool enabled;
  final Color? accent;

  @override
  Widget build(BuildContext context) {
    final fg = enabled ? (accent ?? AppColors.textPrimary) : AppColors.textHint;
    final bg = enabled
        ? (accent ?? AppColors.primary).withValues(alpha: 0.08)
        : AppColors.surfaceGrey;

    return InkWell(
      onTap: enabled ? onTap : null,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        child: Row(
          children: [
            Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(
                color: bg,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, size: 18, color: fg),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  color: fg,
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
