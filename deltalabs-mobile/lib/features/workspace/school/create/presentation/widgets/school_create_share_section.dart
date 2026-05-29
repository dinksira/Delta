import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/workspace/school/create/domain/school_create_constants.dart';
import 'package:deltalabs_mobile/features/workspace/school/create/domain/school_create_models.dart';
import 'package:deltalabs_mobile/features/auth/presentation/providers/auth_provider.dart';
import 'package:deltalabs_mobile/features/workspace/school/create/presentation/providers/school_create_notifier.dart';
import 'package:deltalabs_mobile/features/workspace/school/create/presentation/widgets/school_create_share_pickers.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class SchoolCreateShareSection extends ConsumerWidget {
  const SchoolCreateShareSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(schoolCreateProvider);
    final n = ref.read(schoolCreateProvider.notifier);
    final auth = ref.watch(authProvider).value;
    final creatorEmail = auth?.email?.trim().toLowerCase();

    if (s.partners.isEmpty) {
      return const Text(
        'Add at least one partner on the previous step to configure shares.',
        style: TextStyle(color: AppColors.textSecondary),
      );
    }

    final partner = s.selectedPartner!;
    final isCreator = creatorEmail != null &&
        creatorEmail == partner.email.trim().toLowerCase();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SchoolCreatePartnerField(
          partnerNames: s.partners.map((p) => p.fullName).toList(),
          selectedIndex: s.selectedPartnerIndex.clamp(0, s.partners.length - 1),
          onChanged: n.selectPartner,
        ),
        if (isCreator) ...[
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.06),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppColors.inputBorder.withValues(alpha: 0.5)),
            ),
            child: const Text(
              'Your account has full owner access. Share permissions are read-only.',
              style: TextStyle(color: AppColors.textSecondary, fontSize: 12, height: 1.4),
            ),
          ),
        ],
        const SizedBox(height: 14),
        LayoutBuilder(
          builder: (context, constraints) {
            const gap = 10.0;
            final itemWidth = (constraints.maxWidth - gap) / 2;
            final entries = partner.shareAccesses.asMap().entries.toList();

            return Wrap(
              spacing: gap,
              runSpacing: gap,
              children: [
                for (final e in entries)
                  SizedBox(
                    width: itemWidth,
                    child: _ShareAccessCard(
                      access: e.value,
                      readOnly: isCreator,
                      onStatusChanged: isCreator
                          ? null
                          : (status) => n.updateShareAccess(
                                s.selectedPartnerIndex,
                                e.key,
                                status,
                              ),
                    ),
                  ),
              ],
            );
          },
        ),
      ],
    );
  }
}

class _ShareAccessCard extends StatelessWidget {
  const _ShareAccessCard({
    required this.access,
    required this.readOnly,
    this.onStatusChanged,
  });

  final SchoolShareAccess access;
  final bool readOnly;
  final ValueChanged<String>? onStatusChanged;

  @override
  Widget build(BuildContext context) {
    final status = SchoolCreateConstants.shareStatuses.contains(access.status)
        ? access.status
        : 'can_view';
    final statusLabel = SchoolCreateConstants.shareStatusLabels[status]!;

    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.inputBorder.withValues(alpha: 0.65)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            access.accessName,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontWeight: FontWeight.w600,
              fontSize: 12,
              color: AppColors.textPrimary,
              height: 1.25,
            ),
          ),
          const SizedBox(height: 6),
          if (readOnly)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.surfaceGrey,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppColors.inputBorder.withValues(alpha: 0.5)),
              ),
              child: Text(
                statusLabel,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textSecondary,
                ),
              ),
            )
          else
            SchoolCreatePermissionField(
              status: status,
              onChanged: onStatusChanged!,
            ),
        ],
      ),
    );
  }
}
