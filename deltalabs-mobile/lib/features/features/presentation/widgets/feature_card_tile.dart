import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/features/presentation/models/feature_card_ui.dart';
import 'package:flutter/material.dart';

/// Single feature card on the hub grid (fixed height, matches web).
class FeatureCardTile extends StatelessWidget {
  const FeatureCardTile({
    required this.card,
    required this.onTap,
    required this.onMenuTap,
    super.key,
  });

  final FeatureCardUi card;
  final VoidCallback onTap;
  /// Called with the ⋮ button's [BuildContext] so the menu anchors to that card.
  final void Function(BuildContext menuAnchorContext) onMenuTap;

  static const double cardHeight = 200;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: card.disabled ? null : onTap,
        child: Container(
          height: cardHeight,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.inputBorder.withValues(alpha: 0.7)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.04),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          padding: const EdgeInsets.fromLTRB(14, 12, 10, 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: card.visuals.chipBackground,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      card.visuals.icon,
                      color: card.visuals.chipForeground,
                      size: 22,
                    ),
                  ),
                  const Spacer(),
                  Builder(
                    builder: (menuContext) => GestureDetector(
                      onLongPress: () {},
                      child: IconButton(
                        onPressed: () => onMenuTap(menuContext),
                        icon: const Icon(Icons.more_vert_rounded),
                        color: AppColors.textSecondary,
                        iconSize: 22,
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(
                          minWidth: 36,
                          minHeight: 36,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Text(
                card.displayTitle,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: AppColors.primary,
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  height: 1.15,
                ),
              ),
              const SizedBox(height: 6),
              Expanded(
                child: Text(
                  card.description,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 12,
                    height: 1.35,
                  ),
                ),
              ),
              Text(
                card.linkLabel,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: card.disabled
                      ? AppColors.textHint
                      : AppColors.primaryLight,
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
