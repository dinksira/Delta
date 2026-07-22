import 'package:deltalabs_mobile/features/workspace/school/presentation/models/course_workspace_constants.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_state_panel.dart';
import 'package:flutter/material.dart';

class CourseComingSoonPanel extends StatelessWidget {
  const CourseComingSoonPanel({required this.tabId, super.key});

  final String tabId;

  @override
  Widget build(BuildContext context) {
    final copy = CourseWorkspaceConstants.comingSoonCopy[tabId];
    if (copy == null) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.all(16),
      child: SchoolStatePanel(
        icon: copy.icon,
        title: copy.title,
        message: copy.message,
      ),
    );
  }
}
