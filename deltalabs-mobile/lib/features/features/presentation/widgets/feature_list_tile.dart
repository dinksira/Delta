import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/features/presentation/constants/feature_visuals.dart';
import 'package:deltalabs_mobile/features/features/presentation/models/feature_card_ui.dart';
import 'package:deltalabs_mobile/features/features/presentation/models/feature_instance_ui.dart';
import 'package:flutter/material.dart';

/// Telegram-style feature row (avatar · title · preview · trailing).
class FeatureListTile extends StatelessWidget {
  const FeatureListTile.catalog({
    required this.card,
    required this.onTap,
    required this.subtitle,
    super.key,
  })  : instance = null,
        onMenuTap = null;

  const FeatureListTile.instance({
    required this.instance,
    required this.onTap,
    required this.onMenuTap,
    this.subtitle,
    super.key,
  })  : card = null;

  final FeatureCardUi? card;
  final FeatureInstanceUi? instance;
  final VoidCallback onTap;
  final String? subtitle;
  final void Function(BuildContext menuAnchorContext)? onMenuTap;

  static const double avatarSize = 54;

  bool get _disabled => card?.disabled ?? instance?.disabled ?? false;
  String get _title => card?.displayTitle ?? instance!.displayTitle;
  String get _description =>
      subtitle ?? card?.description ?? instance!.description;
  FeatureVisuals get _visuals => card?.visuals ?? instance!.visuals;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      child: InkWell(
        onTap: _disabled ? null : onTap,
        child: Padding(
          padding: EdgeInsets.fromLTRB(16, 8, onMenuTap == null ? 16 : 8, 8),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              _FeatureAvatar(visuals: _visuals),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            _title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: AppColors.textPrimary,
                              height: 1.2,
                            ),
                          ),
                        ),
                        if (_disabled)
                          Container(
                            margin: const EdgeInsets.only(left: 8),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 3,
                            ),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF0F0F0),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Text(
                              'Soon',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: AppColors.textHint,
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 3),
                    Text(
                      _description,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 14,
                        color: subtitle != null
                            ? AppColors.primary.withValues(alpha: 0.75)
                            : const Color(0xFF707579),
                        height: 1.25,
                      ),
                    ),
                  ],
                ),
              ),
              if (onMenuTap != null)
                Builder(
                  builder: (menuContext) => IconButton(
                    onPressed: () => onMenuTap!(menuContext),
                    icon: const Icon(Icons.more_vert_rounded, size: 20),
                    color: const Color(0xFFADB5BD),
                    visualDensity: VisualDensity.compact,
                  ),
                )
              else
                Icon(
                  Icons.add_circle_outline_rounded,
                  size: 22,
                  color: _disabled
                      ? AppColors.textHint
                      : AppColors.primary.withValues(alpha: 0.65),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _FeatureAvatar extends StatelessWidget {
  const _FeatureAvatar({required this.visuals});

  final FeatureVisuals visuals;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: FeatureListTile.avatarSize,
      height: FeatureListTile.avatarSize,
      decoration: BoxDecoration(
        color: visuals.chipBackground,
        shape: BoxShape.circle,
      ),
      alignment: Alignment.center,
      child: Icon(
        visuals.icon,
        color: visuals.chipForeground,
        size: 26,
      ),
    );
  }
}

/// Thin divider inset like Telegram chat list.
class FeatureListDivider extends StatelessWidget {
  const FeatureListDivider({super.key});

  @override
  Widget build(BuildContext context) {
    return const Divider(
      height: 1,
      thickness: 0.5,
      indent: 16 + FeatureListTile.avatarSize + 14,
      color: Color(0xFFE7E7E7),
    );
  }
}
