import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/workspace/school/create/domain/school_create_models.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/offer_amendment_payload.dart';
import 'package:flutter/material.dart';

/// Read-only list of school share access levels for a partner.
class OfferShareAccessList extends StatelessWidget {
  const OfferShareAccessList({
    required this.accesses,
    super.key,
  });

  final List<SchoolShareAccess> accesses;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.inputBorder.withValues(alpha: 0.65)),
      ),
      child: Column(
        children: [
          for (var i = 0; i < accesses.length; i++) ...[
            if (i > 0)
              Divider(
                height: 1,
                color: AppColors.inputBorder.withValues(alpha: 0.5),
              ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      accesses[i].accessName,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ),
                  _ShareStatusChip(status: accesses[i].status),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _ShareStatusChip extends StatelessWidget {
  const _ShareStatusChip({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final (bg, fg) = switch (status) {
      'can_edit' => (const Color(0xFFE8EDF8), AppColors.primary),
      'can_manage' => (const Color(0xFFEDE8F8), const Color(0xFF5B4B8A)),
      _ => (AppColors.surfaceGrey, AppColors.textSecondary),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        shareAccessStatusLabel(status),
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: fg,
        ),
      ),
    );
  }
}
