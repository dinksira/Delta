import 'package:deltalabs_mobile/features/feed/presentation/layout/feed_layout.dart';
import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';

/// TikTok-style scrubber: thin track, draggable. Line sits on the bottom edge.
class FeedVideoProgressBar extends StatefulWidget {
  const FeedVideoProgressBar({
    required this.controller,
    this.onDragStateChanged,
    super.key,
  });

  final VideoPlayerController controller;
  final ValueChanged<bool>? onDragStateChanged;

  @override
  State<FeedVideoProgressBar> createState() => _FeedVideoProgressBarState();
}

class _FeedVideoProgressBarState extends State<FeedVideoProgressBar> {
  double? _dragProgress;
  bool _wasPlayingBeforeDrag = false;

  @override
  void initState() {
    super.initState();
    widget.controller.addListener(_onTick);
  }

  @override
  void didUpdateWidget(FeedVideoProgressBar oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.controller != widget.controller) {
      oldWidget.controller.removeListener(_onTick);
      widget.controller.addListener(_onTick);
    }
  }

  @override
  void dispose() {
    widget.controller.removeListener(_onTick);
    super.dispose();
  }

  void _onTick() {
    if (_dragProgress != null) return;
    if (mounted) setState(() {});
  }

  double _progressFromPosition(double localDx, double width) {
    if (width <= 0) return 0;
    return (localDx / width).clamp(0.0, 1.0);
  }

  void _seekToFraction(double fraction) {
    final duration = widget.controller.value.duration;
    if (duration.inMilliseconds <= 0) return;
    final ms = (duration.inMilliseconds * fraction.clamp(0, 1)).round();
    widget.controller.seekTo(Duration(milliseconds: ms));
  }

  void _beginDrag(double fraction) {
    _wasPlayingBeforeDrag = widget.controller.value.isPlaying;
    if (_wasPlayingBeforeDrag) {
      widget.controller.pause();
    }
    setState(() => _dragProgress = fraction);
    widget.onDragStateChanged?.call(true);
    _seekToFraction(fraction);
  }

  void _updateDrag(double fraction) {
    setState(() => _dragProgress = fraction);
    _seekToFraction(fraction);
  }

  void _endDrag() {
    if (_dragProgress != null) {
      _seekToFraction(_dragProgress!);
    }
    setState(() => _dragProgress = null);
    widget.onDragStateChanged?.call(false);
    if (_wasPlayingBeforeDrag) {
      widget.controller.play();
    }
  }

  @override
  Widget build(BuildContext context) {
    final value = widget.controller.value;
    final duration = value.duration;
    final position = value.position;
    final liveProgress = duration.inMilliseconds > 0
        ? (position.inMilliseconds / duration.inMilliseconds).clamp(0.0, 1.0)
        : 0.0;
    final progress = _dragProgress ?? liveProgress;
    final isDragging = _dragProgress != null;
    final trackHeight = isDragging ? 4.0 : FeedLayout.progressBarThickness;
    const touchHeight = FeedLayout.progressTouchHeight;

    return LayoutBuilder(
      builder: (context, constraints) {
        final width = constraints.maxWidth;

        return GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTapDown: (details) {
            _seekToFraction(
              _progressFromPosition(details.localPosition.dx, width),
            );
          },
          onHorizontalDragStart: (details) {
            _beginDrag(_progressFromPosition(details.localPosition.dx, width));
          },
          onHorizontalDragUpdate: (details) {
            _updateDrag(_progressFromPosition(details.localPosition.dx, width));
          },
          onHorizontalDragEnd: (_) => _endDrag(),
          onHorizontalDragCancel: _endDrag,
          child: SizedBox(
            height: touchHeight,
            width: double.infinity,
            child: Align(
              alignment: Alignment.bottomCenter,
              child: SizedBox(
                height: trackHeight,
                width: double.infinity,
                child: Stack(
                  clipBehavior: Clip.none,
                  alignment: Alignment.centerLeft,
                  children: [
                    Container(
                      height: trackHeight,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.25),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    FractionallySizedBox(
                      widthFactor: progress,
                      child: Container(
                        height: trackHeight,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),
                    if (isDragging && progress > 0)
                      Positioned(
                        left: (width * progress).clamp(0, width - 8) - 4,
                        top: -3,
                        child: Container(
                          width: 8,
                          height: 8,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.4),
                                blurRadius: 4,
                              ),
                            ],
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
