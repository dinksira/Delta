import 'package:deltalabs_mobile/features/workspace/data/models/my_school_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/create/presentation/providers/school_create_notifier.dart';
import 'package:deltalabs_mobile/features/workspace/school/create/presentation/providers/school_wizard_args.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/pages/school_wizard_page.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Edit school — same multi-step wizard as create, pre-filled from API.
class SchoolEditPage extends StatelessWidget {
  const SchoolEditPage({required this.school, super.key});

  final MySchoolModel school;

  @override
  Widget build(BuildContext context) {
    if (school.orgId.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: const Text('Edit school')),
        body: const Center(
          child: Padding(
            padding: EdgeInsets.all(24),
            child: Text('Cannot edit: missing organization id for this school.'),
          ),
        ),
      );
    }

    return ProviderScope(
      overrides: [
        schoolWizardArgsProvider.overrideWithValue(
          SchoolWizardArgs.edit(orgId: school.orgId, schoolId: school.schoolId),
        ),
        schoolWizardProvider.overrideWith(SchoolCreateNotifier.new),
      ],
      child: const SchoolWizardPage(
        title: 'Edit school',
        submitLabel: 'Save changes',
        successMessage: 'School updated',
        showClearDraft: false,
      ),
    );
  }
}
