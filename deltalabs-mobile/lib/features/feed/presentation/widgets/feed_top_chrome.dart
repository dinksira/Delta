import 'package:flutter/material.dart';

enum FeedSurfaceMode { feed, school }

/// Top overlay: search (left) · Feed/School (center) · mute (right).
class FeedTopChrome extends StatelessWidget {
  const FeedTopChrome({
    required this.mode,
    required this.onModeChanged,
    required this.isMuted,
    required this.onMuteToggle,
    this.onSearchTap,
    this.showMute = true,
    super.key,
  });

  final FeedSurfaceMode mode;
  final ValueChanged<FeedSurfaceMode> onModeChanged;
  final bool isMuted;
  final VoidCallback onMuteToggle;
  final VoidCallback? onSearchTap;
  final bool showMute;

  @override
  Widget build(BuildContext context) {
    final top = MediaQuery.paddingOf(context).top;

    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Colors.black.withValues(alpha: 0.5),
            Colors.black.withValues(alpha: 0.15),
            Colors.transparent,
          ],
        ),
      ),
      child: Padding(
        padding: EdgeInsets.fromLTRB(8, top + 4, 8, 10),
        child: Row(
          children: [
            _ChromeIconButton(
              icon: Icons.search_rounded,
              tooltip: 'Search',
              onTap: onSearchTap,
            ),
            Expanded(
              child: Center(
                child: _ModeSwitcher(mode: mode, onModeChanged: onModeChanged),
              ),
            ),
            if (showMute)
              _ChromeIconButton(
                icon: isMuted ? Icons.volume_off_rounded : Icons.volume_up_rounded,
                tooltip: isMuted ? 'Unmute' : 'Mute',
                onTap: onMuteToggle,
              )
            else
              const SizedBox(width: 48),
          ],
        ),
      ),
    );
  }
}

class _ChromeIconButton extends StatelessWidget {
  const _ChromeIconButton({
    required this.icon,
    required this.onTap,
    this.tooltip,
  });

  final IconData icon;
  final VoidCallback? onTap;
  final String? tooltip;

  @override
  Widget build(BuildContext context) {
    return IconButton(
      onPressed: onTap,
      tooltip: tooltip,
      icon: Icon(icon, color: Colors.white, size: 26),
      style: IconButton.styleFrom(
        minimumSize: const Size(48, 48),
        shadowColor: Colors.black54,
      ),
    );
  }
}

class _ModeSwitcher extends StatelessWidget {
  const _ModeSwitcher({
    required this.mode,
    required this.onModeChanged,
  });

  final FeedSurfaceMode mode;
  final ValueChanged<FeedSurfaceMode> onModeChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(3),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.35),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _ModeChip(
            label: 'Feed',
            selected: mode == FeedSurfaceMode.feed,
            onTap: () => onModeChanged(FeedSurfaceMode.feed),
          ),
          _ModeChip(
            label: 'School',
            selected: mode == FeedSurfaceMode.school,
            onTap: () => onModeChanged(FeedSurfaceMode.school),
          ),
        ],
      ),
    );
  }
}

class _ModeChip extends StatelessWidget {
  const _ModeChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 7),
        decoration: BoxDecoration(
          color: selected ? Colors.white : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? Colors.black : Colors.white.withValues(alpha: 0.85),
            fontSize: 13,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
    );
  }
}
