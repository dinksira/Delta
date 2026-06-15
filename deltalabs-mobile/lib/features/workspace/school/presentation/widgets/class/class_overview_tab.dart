import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_class_session_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/models/class_workspace_constants.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/utils/class_session_utils.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/utils/class_workspace_utils.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/class/class_overview_meta_strip.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/class/class_session_card.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_state_panel.dart';
import 'package:deltalabs_mobile/shared/widgets/loading/dl_loading_indicator.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class ClassOverviewTab extends StatelessWidget {
  const ClassOverviewTab({
    required this.classMeta,
    required this.classDescription,
    required this.sessionsAsync,
    required this.canMutate,
    required this.startingSessionId,
    required this.onTabChanged,
    required this.onStartSession,
    required this.onJoinSession,
    required this.onEditSession,
    required this.onDeleteSession,
    required this.onCreateSession,
    super.key,
  });

  final ClassWorkspaceMeta classMeta;
  final String? classDescription;
  final AsyncValue<List<SchoolClassSessionModel>> sessionsAsync;
  final bool canMutate;
  final String? startingSessionId;
  final ValueChanged<String> onTabChanged;
  final Future<void> Function(SchoolClassSessionModel session) onStartSession;
  final void Function(SchoolClassSessionModel session) onJoinSession;
  final Future<void> Function(SchoolClassSessionModel session) onEditSession;
  final Future<void> Function(SchoolClassSessionModel session) onDeleteSession;
  final VoidCallback onCreateSession;

  @override
  Widget build(BuildContext context) {
    return sessionsAsync.when(
      loading: () => const Padding(
        padding: EdgeInsets.symmetric(vertical: 48),
        child: Center(child: DlLoadingIndicator()),
      ),
      error: (_, __) => SchoolStatePanel(
        icon: Icons.error_outline_rounded,
        title: 'Could not load overview',
        message: 'Pull to refresh.',
      ),
      data: (sessions) {
        final hero = pickHeroSession(sessions);
        final recent = sessions.take(3).toList();

        return ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
          children: [
            if (classMeta.hasSummary) ...[
              ClassOverviewMetaStrip(meta: classMeta),
              const SizedBox(height: 12),
            ],
            if (classDescription?.trim().isNotEmpty == true) ...[              Text(
                classDescription!.trim(),
                style: const TextStyle(color: AppColors.textSecondary, fontSize: 14),
              ),
              const SizedBox(height: 16),
            ],
            if (hero != null)
              _HeroSessionCard(
                session: hero,
                canMutate: canMutate,
                starting: startingSessionId == hero.id,
                onStart: () => onStartSession(hero),
                onJoin: () => onJoinSession(hero),
              )
            else
              SchoolStatePanel(
                icon: Icons.event_note_outlined,
                title: 'No sessions yet',
                message: canMutate
                    ? 'Create your first session to get started.'
                    : 'Sessions will appear here when added.',
                actionLabel: canMutate ? 'Add session' : null,
                onAction: canMutate ? onCreateSession : null,
              ),
            const SizedBox(height: 20),
            const Text(
              'Quick actions',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(height: 12),
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 10,
              crossAxisSpacing: 10,
              childAspectRatio: 2.2,
              children: [
                for (final action in ClassWorkspaceConstants.quickActions)
                  _QuickActionTile(
                    label: action.label,
                    icon: action.icon,
                    onTap: () => onTabChanged(action.targetTab),
                  ),
              ],
            ),
            if (recent.isNotEmpty) ...[
              const SizedBox(height: 24),
              Row(
                children: [
                  const Expanded(
                    child: Text(
                      'Recent sessions',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                  TextButton(
                    onPressed: () => onTabChanged('sessions'),
                    child: const Text('See all'),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              for (final session in recent) ...[
                ClassSessionCard(
                  session: session,
                  canMutate: canMutate,
                  starting: startingSessionId == session.id,
                  onStart: canStartClassSession(session, canMutate)
                      ? () => onStartSession(session)
                      : null,
                  onJoin: canJoinClassSession(session) ? () => onJoinSession(session) : null,
                  onEdit: canMutate && session.status != 'live'
                      ? () => onEditSession(session)
                      : null,
                  onDelete: canMutate ? () => onDeleteSession(session) : null,
                ),                const SizedBox(height: 10),
              ],
            ],
          ],
        );
      },
    );
  }
}

class _HeroSessionCard extends StatelessWidget {
  const _HeroSessionCard({
    required this.session,
    required this.canMutate,
    required this.starting,
    required this.onStart,
    required this.onJoin,
  });

  final SchoolClassSessionModel session;
  final bool canMutate;
  final bool starting;
  final VoidCallback onStart;
  final VoidCallback onJoin;

  @override
  Widget build(BuildContext context) {
    final isLive = session.status == 'live';
    final showJoin = canJoinClassSession(session);
    final showStart = canStartClassSession(session, canMutate);
    final date = formatClassSessionDate(session.scheduledAt);
    final time = formatClassSessionTime(session.scheduledAt);

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isLive
              ? AppColors.primary.withValues(alpha: 0.5)
              : AppColors.inputBorder.withValues(alpha: 0.75),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            isLive ? 'Live now' : 'Up next',
            style: TextStyle(
              color: isLive ? const Color(0xFF2E7D32) : AppColors.textSecondary,
              fontWeight: FontWeight.w700,
              fontSize: 12,
              letterSpacing: 0.3,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            session.title,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: AppColors.primary,
            ),
          ),
          if (date != '—' || time.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              [if (date != '—') date, if (time.isNotEmpty) time].join(' · '),
              style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
            ),
          ],
          const SizedBox(height: 16),
          Row(
            children: [
              if (showJoin)
                FilledButton(
                  onPressed: onJoin,
                  style: FilledButton.styleFrom(backgroundColor: AppColors.primary),
                  child: const Text('Join session'),
                )
              else if (showStart)
                FilledButton(
                  onPressed: starting ? null : onStart,
                  style: FilledButton.styleFrom(backgroundColor: AppColors.primary),
                  child: Text(starting ? 'Starting…' : 'Start session'),
                ),
              const Spacer(),
              Text(
                classSessionTypeLabel(session.sessionType),
                style: const TextStyle(
                  color: AppColors.textSecondary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _QuickActionTile extends StatelessWidget {
  const _QuickActionTile({
    required this.label,
    required this.icon,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.inputBorder.withValues(alpha: 0.75)),
          ),
          child: Row(
            children: [
              Icon(icon, color: AppColors.primary, size: 22),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  label,
                  style: const TextStyle(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w700,
                    fontSize: 14,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
