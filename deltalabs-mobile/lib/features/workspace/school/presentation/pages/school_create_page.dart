import 'package:deltalabs_mobile/features/workspace/school/create/presentation/providers/school_create_notifier.dart';
import 'package:deltalabs_mobile/features/workspace/school/create/presentation/providers/school_wizard_args.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/pages/school_wizard_page.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Create school — multi-step wizard.
class SchoolCreatePage extends StatelessWidget {
  const SchoolCreatePage({super.key});

  @override
  Widget build(BuildContext context) {
    return ProviderScope(
      overrides: [
        schoolWizardArgsProvider.overrideWithValue(const SchoolWizardArgs.create()),
        schoolWizardProvider.overrideWith(SchoolCreateNotifier.new),
      ],
      child: const SchoolWizardPage(
        title: 'Create school',
        submitLabel: 'Create school',
        successMessage: 'School created successfully',
        showClearDraft: true,
      ),
    );
  }
}
