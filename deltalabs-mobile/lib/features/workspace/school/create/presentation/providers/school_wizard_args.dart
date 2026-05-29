import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Wizard mode: create a new school or edit an existing one.
class SchoolWizardArgs {
  const SchoolWizardArgs.create()
      : orgId = null,
        schoolId = null;

  const SchoolWizardArgs.edit({
    required this.orgId,
    required this.schoolId,
  });

  final String? orgId;
  final String? schoolId;

  bool get isEdit => schoolId != null && schoolId!.isNotEmpty;
}

/// Override on [ProviderScope] for edit routes; defaults to create.
final schoolWizardArgsProvider = Provider<SchoolWizardArgs>(
  (ref) => const SchoolWizardArgs.create(),
);
