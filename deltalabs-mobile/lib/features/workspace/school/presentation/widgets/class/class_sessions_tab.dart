import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_class_session_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/utils/class_session_utils.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/class/class_session_card.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_state_panel.dart';
import 'package:deltalabs_mobile/shared/widgets/loading/dl_loading_indicator.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class ClassSessionsTab extends StatelessWidget {
  const ClassSessionsTab({
    required this.sessionsAsync,
    required this.canMutate,
    required this.startingSessionId,
    required this.onStartSession,
    required this.onJoinSession,
    required this.onEditSession,
    required this.onDeleteSession,
    required this.onCreateSession,
    super.key,
  });

  final AsyncValue<List<SchoolClassSessionModel>> sessionsAsync;
  final bool canMutate;
  final String? startingSessionId;
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
      error: (_, __) => Padding(
        padding: const EdgeInsets.all(16),
        child: SchoolStatePanel(
          icon: Icons.error_outline_rounded,
          title: 'Could not load sessions',
          message: 'Pull to refresh.',
        ),
      ),
      data: (sessions) {
        if (sessions.isEmpty) {
          return Padding(
            padding: const EdgeInsets.all(16),
            child: SchoolStatePanel(
              icon: Icons.event_note_outlined,
              title: 'No sessions yet',
              message: canMutate
                  ? 'Create your first class session.'
                  : 'Sessions will appear here when added.',
              actionLabel: canMutate ? 'Add session' : null,
              onAction: canMutate ? onCreateSession : null,
            ),
          );
        }

        final groups = groupClassSessions(sessions);

        return ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
          children: [
            if (groups.live.isNotEmpty) ...[
              _SectionTitle('Live now'),
              for (final session in groups.live) ...[
                ClassSessionCard(
                  session: session,
                  canMutate: canMutate,
                  starting: startingSessionId == session.id,
                  onJoin: () => onJoinSession(session),
                  onEdit: canMutate && session.status != 'live'
                      ? () => onEditSession(session)
                      : null,
                  onDelete: canMutate ? () => onDeleteSession(session) : null,
                ),
                const SizedBox(height: 10),
              ],
              const SizedBox(height: 8),
            ],
            if (groups.upcoming.isNotEmpty) ...[
              _SectionTitle('Upcoming'),
              for (final session in groups.upcoming) ...[
                ClassSessionCard(
                  session: session,
                  canMutate: canMutate,
                  starting: startingSessionId == session.id,
                  onStart: canStartClassSession(session, canMutate)
                      ? () => onStartSession(session)
                      : null,
                  onEdit: canMutate && session.status != 'live'
                      ? () => onEditSession(session)
                      : null,
                  onDelete: canMutate ? () => onDeleteSession(session) : null,
                ),
                const SizedBox(height: 10),
              ],
              const SizedBox(height: 8),
            ],
            if (groups.past.isNotEmpty) ...[
              _SectionTitle('Past'),
              for (final session in groups.past) ...[
                ClassSessionCard(
                  session: session,
                  canMutate: canMutate,
                  onEdit: canMutate && session.status != 'live'
                      ? () => onEditSession(session)
                      : null,
                  onDelete: canMutate ? () => onDeleteSession(session) : null,
                ),
                const SizedBox(height: 10),
              ],
            ],
          ],
        );
      },
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.label);

  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10, top: 4),
      child: Text(
        label,
        style: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w700,
          color: AppColors.primary,
        ),
      ),
    );
  }
}
