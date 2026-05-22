import 'package:flutter/material.dart';

enum MainTab { video, audio, ai, explore, profile }

/// TikTok-style bottom navigation — icon-only, dark bar, no top app bar.
class MainBottomNav extends StatelessWidget {
  const MainBottomNav({
    required this.current,
    required this.onChanged,
    super.key,
  });

  /// Icon row: 4 + 26 + 2 + ~12 label + 4 vertical padding.
  static const double contentHeight = 48;

  /// Total bar height including home-indicator / bottom inset padding.
  static double barHeight(BuildContext context) {
    final bottom = MediaQuery.paddingOf(context).bottom;
    return contentHeight + (bottom > 0 ? bottom : 8);
  }

  final MainTab current;
  final ValueChanged<MainTab> onChanged;

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.paddingOf(context).bottom;

    return Container(
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.92),
        border: Border(
          top: BorderSide(color: Colors.white.withValues(alpha: 0.08)),
        ),
      ),
      padding: EdgeInsets.only(bottom: bottom > 0 ? bottom : 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _NavItem(
            icon: Icons.home_filled,
            label: 'Video',
            selected: current == MainTab.video,
            onTap: () => onChanged(MainTab.video),
          ),
          _NavItem(
            icon: Icons.music_note_rounded,
            label: 'Audio',
            selected: current == MainTab.audio,
            onTap: () => onChanged(MainTab.audio),
          ),
          _NavItem(
            icon: Icons.auto_awesome,
            label: 'AI',
            selected: current == MainTab.ai,
            onTap: () => onChanged(MainTab.ai),
          ),
          _NavItem(
            icon: Icons.explore_rounded,
            label: 'Explore',
            selected: current == MainTab.explore,
            onTap: () => onChanged(MainTab.explore),
          ),
          _NavItem(
            icon: Icons.person_rounded,
            label: 'Profile',
            selected: current == MainTab.profile,
            onTap: () => onChanged(MainTab.profile),
          ),
        ],
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem({
    required this.icon,
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = selected ? Colors.white : Colors.white.withValues(alpha: 0.45);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: color, size: 26),
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(
                color: color,
                fontSize: 10,
                fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
