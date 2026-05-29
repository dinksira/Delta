import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/workspace/data/models/my_school_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_state_panel.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class SchoolDetailPlaceholderPage extends StatelessWidget {
  const SchoolDetailPlaceholderPage({
    required this.schoolId,
    this.school,
    super.key,
  });

  final String schoolId;
  final MySchoolModel? school;

  @override
  Widget build(BuildContext context) {
    final name = school?.name ?? 'School';

    return Scaffold(
      backgroundColor: AppColors.surfaceGrey,
      appBar: AppBar(
        backgroundColor: AppColors.surfaceGrey,
        foregroundColor: AppColors.primary,
        title: Text(
          name,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.primary),
        ),
      ),
      body: SchoolStatePanel(
        icon: Icons.folder_open_rounded,
        title: 'School workspace',
        message:
            'Browsing departments, classes, and resources inside $name is coming in the next update.',
        actionLabel: 'Back to My School',
        onAction: () => context.pop(),
      ),
    );
  }
}
