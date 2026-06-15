import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/utils/class_workspace_utils.dart';
import 'package:flutter/material.dart';

class ClassOverviewMetaStrip extends StatelessWidget {
  const ClassOverviewMetaStrip({required this.meta, super.key});

  final ClassWorkspaceMeta meta;

  @override
  Widget build(BuildContext context) {
    if (!meta.hasSummary) return const SizedBox.shrink();

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.inputBorder.withValues(alpha: 0.75)),
      ),
      child: Wrap(
        spacing: 8,
        runSpacing: 8,
        crossAxisAlignment: WrapCrossAlignment.center,
        children: [
          for (var i = 0; i < meta.summaryParts.length; i++) ...[
            if (i > 0)
              Text(
                '·',
                style: TextStyle(
                  color: AppColors.textHint.withValues(alpha: 0.9),
                  fontWeight: FontWeight.w600,
                ),
              ),
            _MetaPart(
              icon: _iconForPart(i, meta),
              label: meta.summaryParts[i],
            ),
          ],
        ],
      ),
    );
  }

  IconData _iconForPart(int index, ClassWorkspaceMeta meta) {
    if (index == 0 && meta.grade != null) return Icons.school_outlined;
    if (meta.homeRoomTeacher != null &&
        meta.summaryParts[index] == meta.homeRoomTeacher) {
      return Icons.person_outline_rounded;
    }
    return Icons.groups_outlined;
  }
}

class _MetaPart extends StatelessWidget {
  const _MetaPart({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 16, color: AppColors.textSecondary),
        const SizedBox(width: 6),
        Text(
          label,
          style: const TextStyle(
            color: AppColors.textSecondary,
            fontSize: 13,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}
