import 'package:deltalabs_mobile/features/shell/presentation/widgets/main_top_chrome.dart';
import 'package:flutter/material.dart';

/// Shared overlay controls below the feed tab strip (video + custom tabs).
abstract class FeedOverlayControls {
  static const overlayTopGap = 2.0;
  static const overlayRightInset = 4.0;
  static const iconSize = 26.0;

  static double top(BuildContext context) =>
      MainTopChrome.feedTabStripBottom(context) + overlayTopGap;

  static ButtonStyle get iconStyle => IconButton.styleFrom(
        backgroundColor: Colors.black.withValues(alpha: 0.35),
        minimumSize: const Size(40, 40),
        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
      );
}

class FeedMuteButton extends StatelessWidget {
  const FeedMuteButton({
    required this.isMuted,
    required this.onToggle,
    super.key,
  });

  final bool isMuted;
  final VoidCallback onToggle;

  @override
  Widget build(BuildContext context) {
    return IconButton(
      onPressed: onToggle,
      tooltip: isMuted ? 'Unmute' : 'Mute',
      icon: Icon(
        isMuted ? Icons.volume_off_rounded : Icons.volume_up_rounded,
        color: Colors.white,
        size: FeedOverlayControls.iconSize,
      ),
      style: FeedOverlayControls.iconStyle,
    );
  }
}

class FeedFilterButton extends StatelessWidget {
  const FeedFilterButton({required this.onPressed, super.key});

  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return IconButton(
      onPressed: onPressed,
      tooltip: 'Filters',
      icon: const Icon(
        Icons.tune_rounded,
        color: Colors.white,
        size: FeedOverlayControls.iconSize,
      ),
      style: FeedOverlayControls.iconStyle,
    );
  }
}
