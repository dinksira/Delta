import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:flutter/material.dart';

/// Back + title row — same placement as [SchoolInstanceBackBar].
class SchoolSimpleBackHeader extends StatelessWidget {
  const SchoolSimpleBackHeader({
    required this.title,
    required this.onBack,
    this.trailing,
    super.key,
  });

  final String title;
  final VoidCallback onBack;
  final Widget? trailing;

  static const padding = EdgeInsets.fromLTRB(4, 2, 16, 6);

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surfaceGrey,
      child: Padding(
        padding: padding,
        child: Row(
          children: [
            IconButton(
              onPressed: onBack,
              icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18),
              color: AppColors.primary,
              visualDensity: VisualDensity.compact,
              tooltip: 'Back',
            ),
            Expanded(
              child: Text(
                title,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: AppColors.primary,
                ),
              ),
            ),
            if (trailing != null) trailing!,
          ],
        ),
      ),
    );
  }
}
