import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_class_enrollment_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_state_panel.dart';
import 'package:deltalabs_mobile/shared/widgets/loading/dl_loading_indicator.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class ClassPeopleTab extends StatelessWidget {
  const ClassPeopleTab({
    required this.enrollmentsAsync,
    required this.canMutate,
    required this.enrolling,
    required this.withdrawingEnrollmentId,
    required this.onEnroll,
    required this.onWithdraw,
    super.key,
  });

  final AsyncValue<List<SchoolClassEnrollmentModel>> enrollmentsAsync;
  final bool canMutate;
  final bool enrolling;
  final String? withdrawingEnrollmentId;
  final VoidCallback onEnroll;
  final Future<void> Function(SchoolClassEnrollmentModel enrollment) onWithdraw;

  @override
  Widget build(BuildContext context) {
    return enrollmentsAsync.when(
      loading: () => const Padding(
        padding: EdgeInsets.symmetric(vertical: 48),
        child: Center(child: DlLoadingIndicator()),
      ),
      error: (_, __) => Padding(
        padding: const EdgeInsets.all(16),
        child: SchoolStatePanel(
          icon: Icons.error_outline_rounded,
          title: 'Could not load students',
          message: 'Pull to refresh.',
        ),
      ),
      data: (enrollments) {
        if (enrollments.isEmpty) {
          return Padding(
            padding: const EdgeInsets.all(16),
            child: SchoolStatePanel(
              icon: Icons.people_outline_rounded,
              title: 'No students enrolled',
              message: canMutate
                  ? 'Add students to this class using their account email.'
                  : 'Students will appear here when enrolled.',
              actionLabel: canMutate ? 'Add student' : null,
              onAction: canMutate ? onEnroll : null,
            ),
          );
        }

        return ListView.separated(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
          itemCount: enrollments.length,
          separatorBuilder: (_, __) => const SizedBox(height: 10),
          itemBuilder: (context, index) {
            final row = enrollments[index];
            final withdrawing = withdrawingEnrollmentId == row.id;
            final secondary = row.user.displaySecondary;

            return Material(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              child: InkWell(
                borderRadius: BorderRadius.circular(14),
                onTap: null,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppColors.divider),
                  ),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 20,
                        backgroundColor: AppColors.primary.withValues(alpha: 0.12),
                        child: Text(
                          row.user.displayName.characters.first.toUpperCase(),
                          style: const TextStyle(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              row.user.displayName,
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w700,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            if (secondary != null)
                              Text(
                                secondary,
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                          ],
                        ),
                      ),
                      if (canMutate)
                        TextButton.icon(
                          onPressed: withdrawing || withdrawingEnrollmentId != null
                              ? null
                              : () => onWithdraw(row),
                          icon: withdrawing
                              ? const SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                )
                              : const Icon(Icons.person_remove_outlined, size: 18),
                          label: Text(withdrawing ? 'Removing…' : 'Remove'),
                          style: TextButton.styleFrom(
                            foregroundColor: AppColors.error,
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }
}
