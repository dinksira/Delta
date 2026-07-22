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
    final screenSharing = useState(false);
    final handRaised = useState(false);
    final boardVisible = useState(true);
    final mobileView = useState(_MobileView.stage);
    final chatMessages = useState(const [
      _ChatMessage(
        sender: 'System',
        text: 'Welcome to the live session.',
        isSystem: true,
      ),
      _ChatMessage(
        sender: 'System',
        text: 'Chat is local preview only — no backend.',
        isSystem: true,
      ),
    ]);

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
          return const Scaffold(
            backgroundColor: AppColors.surfaceGrey,
            body: SchoolStatePanel(
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
                        child: _RoomBody(
                          view: mobileView.value,
                          sessionTitle: title,
                          boardVisible: boardVisible.value,
                          onToggleBoard: () => boardVisible.value = !boardVisible.value,
                          chatMessages: chatMessages.value,
                          onSendChat: (text) {
                            chatMessages.value = [
                              ...chatMessages.value,
                              _ChatMessage(sender: 'You', text: text, isYou: true),
                            ];
                          },
                        ),
                      ),
                    ),
                    _RoomDock(
                      current: mobileView.value,
                      onChanged: (v) => mobileView.value = v,
                    ),
                    _CallControls(
                      micOn: micOn.value,
                      camOn: camOn.value,
                      screenSharing: screenSharing.value,
                      handRaised: handRaised.value,
                      onToggleMic: () => micOn.value = !micOn.value,
                      onToggleCam: () => camOn.value = !camOn.value,
                      onToggleScreenShare: () => screenSharing.value = !screenSharing.value,
                      onToggleHand: () => handRaised.value = !handRaised.value,
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

class _ChatMessage {
  const _ChatMessage({
    required this.sender,
    required this.text,
    this.isYou = false,
    this.isSystem = false,
  });

  final String sender;
  final String text;
  final bool isYou;
  final bool isSystem;
}

enum _BoardTool { pen, eraser }

class _DrawStroke {
  const _DrawStroke({required this.points, this.isEraser = false});

  final List<Offset> points;
  final bool isEraser;
}

class _RoomBody extends StatelessWidget {
  const _RoomBody({
    required this.view,
    required this.sessionTitle,
    required this.boardVisible,
    required this.onToggleBoard,
    required this.chatMessages,
    required this.onSendChat,
  });

  final _MobileView view;
  final String sessionTitle;
  final bool boardVisible;
  final VoidCallback onToggleBoard;
  final List<_ChatMessage> chatMessages;
  final ValueChanged<String> onSendChat;

  @override
  Widget build(BuildContext context) {
    switch (view) {
      case _MobileView.chat:
        return _Panel(
          title: 'In call message',
          child: _ChatPanel(messages: chatMessages, onSend: onSendChat),
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
        return _StageView(
          sessionTitle: sessionTitle,
          boardVisible: boardVisible,
          onToggleBoard: onToggleBoard,
        );
    }
  }
}

class _StageView extends StatelessWidget {
  const _StageView({
    required this.sessionTitle,
    required this.boardVisible,
    required this.onToggleBoard,
  });

  final String sessionTitle;
  final bool boardVisible;
  final VoidCallback onToggleBoard;

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
            padding: const EdgeInsets.fromLTRB(16, 16, 8, 0),
            child: Row(
              children: [
                const Icon(Icons.present_to_all_outlined, size: 20, color: AppColors.primary),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    sessionTitle,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: AppColors.primary,
                    ),
                  ),
                ),
                IconButton(
                  tooltip: boardVisible ? 'Hide thinking board' : 'Show thinking board',
                  onPressed: onToggleBoard,
                  icon: Icon(
                    boardVisible ? Icons.expand_less_rounded : Icons.expand_more_rounded,
                    color: AppColors.primary,
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: Container(
              margin: EdgeInsets.fromLTRB(16, 8, 16, boardVisible ? 8 : 16),
              decoration: BoxDecoration(
                color: AppColors.surfaceGrey,
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.videocam_outlined, size: 48, color: AppColors.primary),
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
                      'Video will connect here.',
                      style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                    ),
                  ],
                ),
              ),
            ),
          ),
          if (boardVisible)
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
              child: _ThinkingBoard(),
            ),
        ],
      ),
    );
  }
}

class _ThinkingBoard extends HookWidget {
  @override
  Widget build(BuildContext context) {
    final tool = useState(_BoardTool.pen);
    final strokes = useState<List<_DrawStroke>>([]);
    final redoStack = useState<List<_DrawStroke>>([]);
    final activeStroke = useState<List<Offset>?>(null);

    void commitStroke(List<Offset> points) {
      if (points.length < 2) return;
      strokes.value = [
        ...strokes.value,
        _DrawStroke(points: List.of(points), isEraser: tool.value == _BoardTool.eraser),
      ];
      redoStack.value = [];
    }

    void undo() {
      if (strokes.value.isEmpty) return;
      redoStack.value = [...redoStack.value, strokes.value.last];
      strokes.value = strokes.value.sublist(0, strokes.value.length - 1);
    }

    void redo() {
      if (redoStack.value.isEmpty) return;
      strokes.value = [...strokes.value, redoStack.value.last];
      redoStack.value = redoStack.value.sublist(0, redoStack.value.length - 1);
    }

    void clear() {
      if (strokes.value.isEmpty && activeStroke.value == null) return;
      strokes.value = [];
      redoStack.value = [];
      activeStroke.value = null;
    }

    Widget toolChip({
      required IconData icon,
      required String label,
      required bool selected,
      required VoidCallback onTap,
    }) {
      return Material(
        color: selected ? AppColors.primary.withValues(alpha: 0.12) : Colors.transparent,
        borderRadius: BorderRadius.circular(8),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(8),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
            child: Icon(
              icon,
              size: 18,
              color: selected ? AppColors.primary : AppColors.textSecondary,
            ),
          ),
        ),
      );
    }

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.inputBorder.withValues(alpha: 0.5)),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.06),
            blurRadius: 8,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Padding(
            padding: EdgeInsets.fromLTRB(12, 10, 12, 0),
            child: Text(
              'Thinking bord',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
            child: Row(
              children: [
                toolChip(
                  icon: Icons.edit_outlined,
                  label: 'Pen',
                  selected: tool.value == _BoardTool.pen,
                  onTap: () => tool.value = _BoardTool.pen,
                ),
                toolChip(
                  icon: Icons.auto_fix_off_outlined,
                  label: 'Eraser',
                  selected: tool.value == _BoardTool.eraser,
                  onTap: () => tool.value = _BoardTool.eraser,
                ),
                toolChip(
                  icon: Icons.undo_rounded,
                  label: 'Undo',
                  selected: false,
                  onTap: undo,
                ),
                toolChip(
                  icon: Icons.redo_rounded,
                  label: 'Redo',
                  selected: false,
                  onTap: redo,
                ),
                const Spacer(),
                TextButton(
                  onPressed: clear,
                  style: TextButton.styleFrom(
                    foregroundColor: AppColors.textSecondary,
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                  child: const Text('Clear', style: TextStyle(fontSize: 12)),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(8, 0, 8, 8),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: AspectRatio(
                aspectRatio: 16 / 9,
                child: ColoredBox(
                  color: AppColors.primary.withValues(alpha: 0.05),
                  child: LayoutBuilder(
                    builder: (context, constraints) {
                      return GestureDetector(
                        onPanStart: (d) {
                          activeStroke.value = [d.localPosition];
                        },
                        onPanUpdate: (d) {
                          final current = activeStroke.value;
                          if (current == null) return;
                          activeStroke.value = [...current, d.localPosition];
                        },
                        onPanEnd: (_) {
                          final current = activeStroke.value;
                          if (current != null) commitStroke(current);
                          activeStroke.value = null;
                        },
                        child: CustomPaint(
                          size: Size(constraints.maxWidth, constraints.maxHeight),
                          painter: _BoardPainter(
                            strokes: strokes.value,
                            activeStroke: activeStroke.value,
                            activeIsEraser: tool.value == _BoardTool.eraser,
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _BoardPainter extends CustomPainter {
  _BoardPainter({
    required this.strokes,
    required this.activeStroke,
    required this.activeIsEraser,
  });

  final List<_DrawStroke> strokes;
  final List<Offset>? activeStroke;
  final bool activeIsEraser;

  @override
  void paint(Canvas canvas, Size size) {
    canvas.clipRect(Offset.zero & size);

    final penPaint = Paint()
      ..color = AppColors.primary
      ..strokeWidth = 2.5
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    final eraserPaint = Paint()
      ..color = AppColors.surfaceGrey
      ..strokeWidth = 12
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke
      ..blendMode = BlendMode.src;

    void drawStroke(List<Offset> points, {required bool isEraser}) {
      if (points.length < 2) return;
      final path = Path()..moveTo(points.first.dx, points.first.dy);
      for (var i = 1; i < points.length; i++) {
        path.lineTo(points[i].dx, points[i].dy);
      }
      canvas.drawPath(path, isEraser ? eraserPaint : penPaint);
    }

    for (final stroke in strokes) {
      drawStroke(stroke.points, isEraser: stroke.isEraser);
    }
    if (activeStroke != null) {
      drawStroke(activeStroke!, isEraser: activeIsEraser);
    }
  }

  @override
  bool shouldRepaint(covariant _BoardPainter oldDelegate) {
    return oldDelegate.strokes != strokes ||
        oldDelegate.activeStroke != activeStroke ||
        oldDelegate.activeIsEraser != activeIsEraser;
  }
}

class _ChatPanel extends HookWidget {
  const _ChatPanel({required this.messages, required this.onSend});

  final List<_ChatMessage> messages;
  final ValueChanged<String> onSend;

  @override
  Widget build(BuildContext context) {
    final controller = useTextEditingController();
    final scrollController = useScrollController();

    useEffect(() {
      if (!scrollController.hasClients) return null;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (scrollController.hasClients) {
          scrollController.animateTo(
            scrollController.position.maxScrollExtent,
            duration: const Duration(milliseconds: 200),
            curve: Curves.easeOut,
          );
        }
      });
      return null;
    }, [messages.length]);

    void send() {
      final text = controller.text.trim();
      if (text.isEmpty) return;
      onSend(text);
      controller.clear();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Expanded(
          child: messages.isEmpty
              ? const Center(
                  child: Text(
                    'No messages yet.',
                    style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                  ),
                )
              : ListView.builder(
                  controller: scrollController,
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                  itemCount: messages.length,
                  itemBuilder: (context, index) {
                    final msg = messages[index];
                    if (msg.isSystem) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: Center(
                          child: Text(
                            msg.text,
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: AppColors.textSecondary.withValues(alpha: 0.9),
                              fontSize: 12,
                              fontStyle: FontStyle.italic,
                            ),
                          ),
                        ),
                      );
                    }
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: Column(
                        crossAxisAlignment:
                            msg.isYou ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                        children: [
                          Text(
                            msg.sender,
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: AppColors.textSecondary,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Container(
                            constraints: BoxConstraints(
                              maxWidth: MediaQuery.sizeOf(context).width * 0.72,
                            ),
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            decoration: BoxDecoration(
                              color: msg.isYou
                                  ? AppColors.primary.withValues(alpha: 0.12)
                                  : AppColors.surfaceGrey,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              msg.text,
                              style: const TextStyle(
                                color: AppColors.textPrimary,
                                fontSize: 14,
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(12, 4, 12, 12),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: controller,
                  textInputAction: TextInputAction.send,
                  onSubmitted: (_) => send(),
                  decoration: InputDecoration(
                    hintText: 'Type something…',
                    hintStyle: const TextStyle(color: AppColors.textHint, fontSize: 14),
                    filled: true,
                    fillColor: AppColors.primary.withValues(alpha: 0.05),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(999),
                      borderSide: BorderSide(
                        color: AppColors.inputBorder.withValues(alpha: 0.6),
                      ),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(999),
                      borderSide: BorderSide(
                        color: AppColors.inputBorder.withValues(alpha: 0.6),
                      ),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(999),
                      borderSide: const BorderSide(color: AppColors.inputBorderFocused),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Material(
                color: AppColors.primary,
                shape: const CircleBorder(),
                child: InkWell(
                  onTap: send,
                  customBorder: const CircleBorder(),
                  child: const SizedBox(
                    width: 44,
                    height: 44,
                    child: Icon(Icons.send_rounded, color: Colors.white, size: 20),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
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
    required this.screenSharing,
    required this.handRaised,
    required this.onToggleMic,
    required this.onToggleCam,
    required this.onToggleScreenShare,
    required this.onToggleHand,
    required this.onLeave,
  });

  final bool micOn;
  final bool camOn;
  final bool screenSharing;
  final bool handRaised;
  final VoidCallback onToggleMic;
  final VoidCallback onToggleCam;
  final VoidCallback onToggleScreenShare;
  final VoidCallback onToggleHand;
  final VoidCallback onLeave;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 12, 12, 16),
      child: Wrap(
        alignment: WrapAlignment.center,
        spacing: 10,
        runSpacing: 8,
        children: [
          _ControlButton(
            icon: micOn ? Icons.mic_none_rounded : Icons.mic_off_rounded,
            label: micOn ? 'Mic on' : 'Mic off',
            onTap: onToggleMic,
            selected: micOn,
          ),
          _ControlButton(
            icon: camOn ? Icons.videocam_outlined : Icons.videocam_off_outlined,
            label: camOn ? 'Cam on' : 'Cam off',
            onTap: onToggleCam,
            selected: camOn,
          ),
          _ControlButton(
            icon: Icons.screen_share_outlined,
            label: screenSharing ? 'Sharing' : 'Share',
            onTap: onToggleScreenShare,
            selected: screenSharing,
            accent: true,
          ),
          _ControlButton(
            icon: Icons.back_hand_outlined,
            label: handRaised ? 'Hand up' : 'Raise hand',
            onTap: onToggleHand,
            selected: handRaised,
          ),
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
    this.selected = false,
    this.accent = false,
    this.destructive = false,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool selected;
  final bool accent;
  final bool destructive;

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color iconColor;

    if (destructive) {
      bg = const Color(0xFFD32F2F);
      iconColor = Colors.white;
    } else if (accent && selected) {
      bg = AppColors.primaryLight;
      iconColor = Colors.white;
    } else if (accent) {
      bg = AppColors.primary;
      iconColor = Colors.white;
    } else if (selected) {
      bg = AppColors.primary.withValues(alpha: 0.15);
      iconColor = AppColors.primary;
    } else {
      bg = AppColors.primary.withValues(alpha: 0.1);
      iconColor = AppColors.textSecondary;
    }

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
              width: 48,
              height: 48,
              child: Icon(icon, color: iconColor, size: 22),
            ),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: const TextStyle(color: AppColors.textSecondary, fontSize: 10),
          textAlign: TextAlign.center,
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
