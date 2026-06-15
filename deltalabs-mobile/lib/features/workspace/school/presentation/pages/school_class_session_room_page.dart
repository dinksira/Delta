import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/workspace/data/models/my_school_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/providers/school_providers.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_simple_back_header.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_state_panel.dart';
import 'package:deltalabs_mobile/shared/widgets/loading/dl_loading_indicator.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

class SchoolClassSessionRoomPage extends HookConsumerWidget {
  const SchoolClassSessionRoomPage({
    required this.schoolId,
    required this.classItemId,
    required this.sessionId,
    this.school,
    super.key,
  });

  final String schoolId;
  final String classItemId;
  final String sessionId;
  final MySchoolModel? school;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final micOn = useState(false);
    final camOn = useState(false);
    final mobileView = useState(_MobileView.stage);

    final schoolsAsync = ref.watch(myActiveSchoolsProvider);

    return schoolsAsync.when(
      loading: () => const Scaffold(
        backgroundColor: AppColors.surfaceGrey,
        body: Center(child: DlLoadingIndicator()),
      ),
      error: (_, __) => Scaffold(
        backgroundColor: AppColors.surfaceGrey,
        body: SchoolStatePanel(
          icon: Icons.error_outline_rounded,
          title: 'Could not load session',
          message: 'Try again.',
          actionLabel: 'Leave',
          onAction: () => context.pop(),
        ),
      ),
      data: (schools) {
        MySchoolModel? current = school;
        if (current == null || current.schoolId != schoolId) {
          for (final s in schools) {
            if (s.schoolId == schoolId) {
              current = s;
              break;
            }
          }
        }

        if (current == null || current.orgId.isEmpty) {
          return Scaffold(
            backgroundColor: AppColors.surfaceGrey,
            body: const SchoolStatePanel(
              icon: Icons.school_outlined,
              title: 'Session unavailable',
              message: 'School membership could not be resolved.',
            ),
          );
        }

        final orgId = current.orgId;
        final sessionsQuery = (
          orgId: orgId,
          schoolId: schoolId,
          classWorkspaceItemId: classItemId,
        );
        final sessionsAsync = ref.watch(schoolClassSessionsProvider(sessionsQuery));

        return sessionsAsync.when(
          loading: () => Scaffold(
            backgroundColor: AppColors.surfaceGrey,
            body: Column(
              children: [
                SchoolSimpleBackHeader(title: 'Session', onBack: () => context.pop()),
                const Expanded(child: Center(child: DlLoadingIndicator())),
              ],
            ),
          ),
          error: (_, __) => Scaffold(
            backgroundColor: AppColors.surfaceGrey,
            body: Column(
              children: [
                SchoolSimpleBackHeader(title: 'Session', onBack: () => context.pop()),
                Expanded(
                  child: SchoolStatePanel(
                    icon: Icons.error_outline_rounded,
                    title: 'Session not found',
                    message: 'This session may have ended.',
                    actionLabel: 'Back to class',
                    onAction: () => context.pop(),
                  ),
                ),
              ],
            ),
          ),
          data: (sessions) {
            final matched = sessions.where((s) => s.id == sessionId).firstOrNull;
            final title = matched?.title ?? 'Session';

            return Scaffold(
              backgroundColor: AppColors.surfaceGrey,
              body: SafeArea(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    SchoolSimpleBackHeader(
                      title: title,
                      onBack: () => _confirmLeave(context),
                    ),
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                        child: _RoomBody(view: mobileView.value, sessionTitle: title),
                      ),
                    ),
                    _RoomDock(
                      current: mobileView.value,
                      onChanged: (v) => mobileView.value = v,
                    ),
                    _CallControls(
                      micOn: micOn.value,
                      camOn: camOn.value,
                      onToggleMic: () => micOn.value = !micOn.value,
                      onToggleCam: () => camOn.value = !camOn.value,
                      onLeave: () => _confirmLeave(context),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  Future<void> _confirmLeave(BuildContext context) async {
    final leave = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Leave session?'),
        content: const Text('You can rejoin while the session is live.'),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: const Text('Stay')),
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: FilledButton.styleFrom(backgroundColor: AppColors.primary),
            child: const Text('Leave'),
          ),
        ],
      ),
    );
    if (leave == true && context.mounted) context.pop();
  }
}

enum _MobileView { stage, chat, people }

class _RoomBody extends StatelessWidget {
  const _RoomBody({required this.view, required this.sessionTitle});

  final _MobileView view;
  final String sessionTitle;

  @override
  Widget build(BuildContext context) {
    switch (view) {
      case _MobileView.chat:
        return _Panel(
          title: 'Chat',
          child: const Center(
            child: Text(
              'Class chat will appear here.',
              style: TextStyle(color: AppColors.textSecondary),
            ),
          ),
        );
      case _MobileView.people:
        return _Panel(
          title: 'People',
          child: ListView(
            children: const [
              _ParticipantRow(name: 'Hilina', muted: false),
              _ParticipantRow(name: 'Fikir', muted: true),
              _ParticipantRow(name: 'Mahlet', muted: true),
              _ParticipantRow(name: 'You', muted: false, isYou: true),
            ],
          ),
        );
      case _MobileView.stage:
        return Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.inputBorder.withValues(alpha: 0.75)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Padding(
                padding: const EdgeInsets.all(16),
                child: Text(
                  sessionTitle,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: AppColors.primary,
                  ),
                ),
              ),
              Expanded(
                child: Container(
                  margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceGrey,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.present_to_all_outlined, size: 48, color: AppColors.primary),
                        SizedBox(height: 12),
                        Text(
                          'Live session stage',
                          style: TextStyle(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        SizedBox(height: 6),
                        Text(
                          'Video and board tools coming soon.',
                          style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
    }
  }
}

class _Panel extends StatelessWidget {
  const _Panel({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.inputBorder.withValues(alpha: 0.75)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Text(
              title,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppColors.primary,
              ),
            ),
          ),
          Expanded(child: child),
        ],
      ),
    );
  }
}

class _ParticipantRow extends StatelessWidget {
  const _ParticipantRow({
    required this.name,
    required this.muted,
    this.isYou = false,
  });

  final String name;
  final bool muted;
  final bool isYou;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: CircleAvatar(
        backgroundColor: AppColors.primary.withValues(alpha: 0.12),
        child: Text(
          name.isNotEmpty ? name[0].toUpperCase() : '?',
          style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700),
        ),
      ),
      title: Text(isYou ? '$name (You)' : name),
      trailing: Icon(
        muted ? Icons.mic_off_outlined : Icons.mic_none_outlined,
        color: AppColors.textSecondary,
      ),
    );
  }
}

class _RoomDock extends StatelessWidget {
  const _RoomDock({required this.current, required this.onChanged});

  final _MobileView current;
  final ValueChanged<_MobileView> onChanged;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          _DockButton(
            label: 'People',
            icon: Icons.people_outline_rounded,
            selected: current == _MobileView.people,
            onTap: () => onChanged(_MobileView.people),
          ),
          const SizedBox(width: 10),
          _DockButton(
            label: 'Chat',
            icon: Icons.chat_bubble_outline_rounded,
            selected: current == _MobileView.chat,
            onTap: () => onChanged(_MobileView.chat),
          ),
          const SizedBox(width: 10),
          _DockButton(
            label: 'Stage',
            icon: Icons.slideshow_outlined,
            selected: current == _MobileView.stage,
            onTap: () => onChanged(_MobileView.stage),
          ),
        ],
      ),
    );
  }
}

class _DockButton extends StatelessWidget {
  const _DockButton({
    required this.label,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? AppColors.primary : Colors.white,
      borderRadius: BorderRadius.circular(999),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(999),
            border: Border.all(
              color: selected ? AppColors.primary : AppColors.inputBorder.withValues(alpha: 0.75),
            ),
          ),
          child: Row(
            children: [
              Icon(icon, size: 18, color: selected ? Colors.white : AppColors.primary),
              const SizedBox(width: 6),
              Text(
                label,
                style: TextStyle(
                  color: selected ? Colors.white : AppColors.primary,
                  fontWeight: FontWeight.w700,
                  fontSize: 13,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CallControls extends StatelessWidget {
  const _CallControls({
    required this.micOn,
    required this.camOn,
    required this.onToggleMic,
    required this.onToggleCam,
    required this.onLeave,
  });

  final bool micOn;
  final bool camOn;
  final VoidCallback onToggleMic;
  final VoidCallback onToggleCam;
  final VoidCallback onLeave;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          _ControlButton(
            icon: micOn ? Icons.mic_none_rounded : Icons.mic_off_rounded,
            label: micOn ? 'Mic on' : 'Mic off',
            onTap: onToggleMic,
          ),
          const SizedBox(width: 12),
          _ControlButton(
            icon: camOn ? Icons.videocam_outlined : Icons.videocam_off_outlined,
            label: camOn ? 'Cam on' : 'Cam off',
            onTap: onToggleCam,
          ),
          const SizedBox(width: 12),
          _ControlButton(
            icon: Icons.call_end_rounded,
            label: 'Leave',
            onTap: onLeave,
            destructive: true,
          ),
        ],
      ),
    );
  }
}

class _ControlButton extends StatelessWidget {
  const _ControlButton({
    required this.icon,
    required this.label,
    required this.onTap,
    this.destructive = false,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool destructive;

  @override
  Widget build(BuildContext context) {
    final bg = destructive ? const Color(0xFFD32F2F) : AppColors.primary;
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Material(
          color: bg,
          shape: const CircleBorder(),
          child: InkWell(
            onTap: onTap,
            customBorder: const CircleBorder(),
            child: SizedBox(
              width: 52,
              height: 52,
              child: Icon(icon, color: Colors.white),
            ),
          ),
        ),
        const SizedBox(height: 6),
        Text(
          label,
          style: const TextStyle(color: AppColors.textSecondary, fontSize: 11),
        ),
      ],
    );
  }
}

extension _FirstOrNull<E> on Iterable<E> {
  E? get firstOrNull {
    final iterator = this.iterator;
    if (!iterator.moveNext()) return null;
    return iterator.current;
  }
}
