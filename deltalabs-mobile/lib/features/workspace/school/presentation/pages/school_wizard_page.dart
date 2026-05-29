import 'package:deltalabs_mobile/core/routing/app_routes.dart';
import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/auth/presentation/providers/auth_provider.dart';
import 'package:deltalabs_mobile/features/workspace/school/create/domain/school_create_constants.dart';
import 'package:deltalabs_mobile/features/workspace/school/create/presentation/providers/school_create_notifier.dart';
import 'package:deltalabs_mobile/features/workspace/school/create/presentation/providers/school_wizard_args.dart';
import 'package:deltalabs_mobile/features/workspace/school/create/presentation/widgets/school_create_form_widgets.dart';
import 'package:deltalabs_mobile/features/workspace/school/create/presentation/widgets/school_create_step_indicator.dart';
import 'package:deltalabs_mobile/features/workspace/school/create/presentation/widgets/school_create_step_views.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/providers/school_providers.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

/// Shared create / edit school wizard (5 steps, same as web create flow).
class SchoolWizardPage extends ConsumerWidget {
  const SchoolWizardPage({
    required this.title,
    this.submitLabel = 'Done',
    this.successMessage = 'School created successfully',
    this.showClearDraft = true,
    super.key,
  });

  final String title;
  final String submitLabel;
  final String successMessage;
  final bool showClearDraft;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final args = ref.watch(schoolWizardArgsProvider);
    final state = ref.watch(schoolWizardProvider);
    final notifier = ref.read(schoolWizardProvider.notifier);
    final auth = ref.watch(authProvider).value;
    final creatorEmail = auth?.email?.trim().toLowerCase();
    final stepIndex = state.stepIndex;
    final canContinue = notifier.canContinue(creatorEmail);
    final continueHint = state.stepValidationError ?? notifier.continueHint(creatorEmail);
    final showLoading = args.isEdit
        ? !state.draftHydrated
        : !state.draftHydrated && state.orgLoading;

    return Scaffold(
      backgroundColor: AppColors.surfaceGrey,
      appBar: AppBar(
        backgroundColor: AppColors.surfaceGrey,
        foregroundColor: AppColors.primary,
        title: Text(
          title,
          style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.primary),
        ),
        actions: [
          if (showClearDraft)
            TextButton(
              onPressed: state.submitting
                  ? null
                  : () async {
                      await notifier.clearDraftAndReset();
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Draft cleared')),
                        );
                      }
                    },
              child: const Text('Clear draft'),
            ),
        ],
      ),
      body: showLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : Column(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      SchoolCreateStepIndicator(currentIndex: stepIndex),
                      const SizedBox(height: 14),
                      Align(
                        alignment: Alignment.centerLeft,
                        child: Text(
                          SchoolCreateConstants.stepHeadings[stepIndex],
                          textAlign: TextAlign.left,
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w800,
                            color: AppColors.primary,
                            height: 1.2,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                if (state.submitError != null)
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                    child: Material(
                      color: AppColors.error.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(10),
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Text(
                          state.submitError!,
                          style: const TextStyle(color: AppColors.error),
                        ),
                      ),
                    ),
                  ),
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(16),
                    child: _StepBody(stepIndex: stepIndex),
                  ),
                ),
                Container(
                  padding: EdgeInsets.fromLTRB(
                    16,
                    12,
                    16,
                    12 + MediaQuery.paddingOf(context).bottom,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.06),
                        blurRadius: 12,
                        offset: const Offset(0, -4),
                      ),
                    ],
                  ),
                  child: SchoolCreateFooter(
                    stepIndex: stepIndex,
                    canContinue: canContinue,
                    isLastStep: stepIndex == 4,
                    submitting: state.submitting,
                    continueHint: continueHint,
                    submitLabel: submitLabel,
                    onBack: notifier.goBack,
                    onContinue: () => notifier.continueStep(creatorEmail: creatorEmail),
                    onSubmit: () async {
                      final ok = await notifier.submit();
                      if (!ok || !context.mounted) return;
                      ref.invalidate(myActiveSchoolsProvider);
                      ref.invalidate(myArchivedSchoolsProvider);
                      ref.invalidate(schoolHubSummaryProvider);
                      if (args.isEdit) {
                        context.pop();
                      } else {
                        context.go(AppRoutes.workspaceSchool);
                      }
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text(successMessage)),
                      );
                    },
                  ),
                ),
              ],
            ),
    );
  }
}

class _StepBody extends StatelessWidget {
  const _StepBody({required this.stepIndex});

  final int stepIndex;

  @override
  Widget build(BuildContext context) {
    return switch (stepIndex) {
      0 => const SchoolCreateStepSchool(),
      1 => const SchoolCreateStepPartnerDetail(),
      2 => const SchoolCreateStepPartners(),
      3 => const SchoolCreateStepShare(),
      _ => const SchoolCreateStepDocuments(),
    };
  }
}
