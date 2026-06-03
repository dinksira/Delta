import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:flutter/material.dart';

enum SchoolTableChipTone { cyan, emerald, violet, rose }

class SchoolTableActionChip extends StatelessWidget {
  const SchoolTableActionChip({
    required this.label,
    required this.tone,
    this.onPressed,
    super.key,
  });

  final String label;
  final SchoolTableChipTone tone;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    final (bg, fg) = switch (tone) {
      SchoolTableChipTone.cyan => (const Color(0xFFE0F4FA), AppColors.primaryLight),
      SchoolTableChipTone.emerald => (const Color(0xFFDDF5E8), const Color(0xFF1B6B42)),
      SchoolTableChipTone.violet => (const Color(0xFFEDE8F8), const Color(0xFF5B4B8A)),
      SchoolTableChipTone.rose => (const Color(0xFFFCE8EC), const Color(0xFFB4233C)),
    };

    return Material(
      color: bg,
      borderRadius: BorderRadius.circular(6),
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(6),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 5),
          child: Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              color: onPressed == null ? AppColors.textHint : fg,
            ),
          ),
        ),
      ),
    );
  }
}
