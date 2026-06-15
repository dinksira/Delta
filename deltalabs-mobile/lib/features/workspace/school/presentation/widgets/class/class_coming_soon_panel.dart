import 'package:deltalabs_mobile/features/workspace/school/presentation/models/class_workspace_constants.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_state_panel.dart';
import 'package:flutter/material.dart';

class ClassComingSoonPanel extends StatelessWidget {
  const ClassComingSoonPanel({required this.tabId, super.key});

  final String tabId;

  @override
  Widget build(BuildContext context) {
    final copy = ClassWorkspaceConstants.comingSoonCopy[tabId];
    if (copy == null) return const SizedBox.shrink();

    return SchoolStatePanel(
      icon: copy.icon,
      title: copy.title,
      message: copy.message,
    );
  }
}
