import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_class_session_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/utils/class_session_utils.dart';
import 'package:flutter/material.dart';

class ClassSessionCard extends StatelessWidget {
  const ClassSessionCard({
    required this.session,
    required this.canMutate,
    this.starting = false,
    this.onStart,
    this.onJoin,
    this.onEdit,
    this.onDelete,
    super.key,
  });

  final SchoolClassSessionModel session;
  final bool canMutate;
  final bool starting;
  final VoidCallback? onStart;
  final VoidCallback? onJoin;
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;

  @override
  Widget build(BuildContext context) {
    final showJoin = canJoinClassSession(session);
    final showStart = canStartClassSession(session, canMutate);
    final isLive = session.status == 'live';

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isLive
              ? AppColors.primary.withValues(alpha: 0.45)
              : AppColors.inputBorder.withValues(alpha: 0.75),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 8, 0),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(
                    Icons.present_to_all_outlined,
                    color: AppColors.primary.withValues(alpha: 0.85),
                    size: 22,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        session.title,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: AppColors.primary,
                        ),
                      ),
                      if (isLive) ...[
                        const SizedBox(height: 6),
                        _LiveChip(),
                      ],
                    ],
                  ),
                ),
                if (canMutate && (onEdit != null || onDelete != null))
                  PopupMenuButton<String>(
                    icon: const Icon(Icons.more_vert_rounded, color: AppColors.textSecondary),
                    onSelected: (value) {
                      if (value == 'edit') onEdit?.call();
                      if (value == 'delete') onDelete?.call();
                    },
                    itemBuilder: (_) => [
                      if (onEdit != null)
                        const PopupMenuItem(
                          value: 'edit',
                          child: Text('Edit session'),
                        ),
                      if (onDelete != null)
                        const PopupMenuItem(
                          value: 'delete',
                          child: Text('Delete session'),
                        ),
                    ],
                  ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
            child: Text(
              session.description?.trim().isNotEmpty == true
                  ? session.description!.trim()
                  : 'No description yet.',
              style: const TextStyle(
                color: AppColors.textSecondary,
                fontSize: 13,
                height: 1.4,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: Wrap(
              spacing: 16,
              runSpacing: 8,
              children: [
                _MetaRow(
                  icon: Icons.calendar_today_outlined,
                  label: formatClassSessionDate(session.scheduledAt),
                ),
                _MetaRow(
                  icon: Icons.schedule_outlined,
                  label: formatClassSessionDuration(session.durationMinutes),
                ),
                _MetaRow(
                  icon: Icons.circle_outlined,
                  label: classSessionStatusLabel(session.status),
                ),
              ],
            ),
          ),
          const Divider(height: 28, indent: 16, endIndent: 16),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: Row(
              children: [
                if (showJoin)
                  FilledButton(
                    onPressed: onJoin,
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      minimumSize: const Size(120, 40),
                    ),
                    child: const Text('Join'),
                  )
                else if (showStart)
                  FilledButton(
                    onPressed: starting ? null : onStart,
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      minimumSize: const Size(120, 40),
                    ),
                    child: Text(starting ? 'Starting…' : 'Start session'),
                  )
                else
                  const SizedBox.shrink(),
                const Spacer(),
                Text(
                  classSessionTypeLabel(session.sessionType),
                  style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _LiveChip extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: const Color(0xFF2E7D32).withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: const Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.circle, size: 8, color: Color(0xFF2E7D32)),
          SizedBox(width: 6),
          Text(
            'LIVE',
            style: TextStyle(
              color: Color(0xFF2E7D32),
              fontSize: 11,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.4,
            ),
          ),
        ],
      ),
    );
  }
}

class _MetaRow extends StatelessWidget {
  const _MetaRow({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: AppColors.textHint),
        const SizedBox(width: 6),
        Text(
          label,
          style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
        ),
      ],
    );
  }
}
