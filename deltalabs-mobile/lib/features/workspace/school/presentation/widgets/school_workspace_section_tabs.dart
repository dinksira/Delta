import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/models/school_workspace_constants.dart';
import 'package:flutter/material.dart';

class SchoolWorkspaceSectionTabs extends StatelessWidget {
  const SchoolWorkspaceSectionTabs({
    required this.visibleSectionIds,
    required this.currentSectionId,
    required this.onSectionChanged,
    super.key,
  });

  final List<String> visibleSectionIds;
  final String currentSectionId;
  final ValueChanged<String> onSectionChanged;

  @override
  Widget build(BuildContext context) {
    final sections = SchoolWorkspaceConstants.sections
        .where((s) => visibleSectionIds.contains(s.id))
        .toList();

    return SizedBox(
      height: 40,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: sections.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final section = sections[index];
          final selected = section.id == currentSectionId;
          return GestureDetector(
            onTap: () => onSectionChanged(section.id),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: selected ? AppColors.primary : Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: selected
                      ? AppColors.primary
                      : AppColors.inputBorder.withValues(alpha: 0.7),
                ),
              ),
              child: Text(
                section.label,
                style: TextStyle(
                  color: selected ? Colors.white : AppColors.textSecondary,
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
