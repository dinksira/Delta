import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/shell/presentation/widgets/features_switch_icon.dart';
import 'package:deltalabs_mobile/features/shell/presentation/widgets/feed_top_tab.dart';
import 'package:flutter/material.dart';

/// TikTok-style shell header: search · category tabs · feed/features switch.
class MainTopChrome extends StatelessWidget {
  const MainTopChrome({
    required this.currentTab,
    required this.onTabChanged,
    required this.onSearchTap,
    required this.onFeaturesSwitchTap,
    required this.isFeaturesMode,
    this.overlayOnVideo = false,
    super.key,
  });

  final FeedTopTab currentTab;
  final ValueChanged<FeedTopTab> onTabChanged;
  final VoidCallback onSearchTap;
  final VoidCallback onFeaturesSwitchTap;
  final bool isFeaturesMode;
  /// When true, floats over the video with a gradient and light icons (TikTok-style).
  final bool overlayOnVideo;

  static double height(BuildContext context) {
    return MediaQuery.paddingOf(context).top + 52;
  }

  @override
  Widget build(BuildContext context) {
    final top = MediaQuery.paddingOf(context).top;
    final onVideo = overlayOnVideo && !isFeaturesMode;

    final content = Padding(
      padding: EdgeInsets.fromLTRB(4, top, 4, 0),
      child: Row(
        children: [
          IconButton(
            onPressed: onSearchTap,
            tooltip: 'Search',
            icon: Icon(
              Icons.search_rounded,
              color: onVideo ? Colors.white : AppColors.primary,
              size: 26,
            ),
          ),
          Expanded(
            child: isFeaturesMode
                ? const Center(
                    child: Text(
                      'Features',
                      style: TextStyle(
                        color: AppColors.primary,
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  )
                : _TabStrip(
                    current: currentTab,
                    onChanged: onTabChanged,
                    onVideo: onVideo,
                  ),
          ),
          IconButton(
            onPressed: onFeaturesSwitchTap,
            tooltip: isFeaturesMode ? 'Back to feed' : 'Features',
            icon: FeaturesSwitchIcon(
              size: 22,
              color: onVideo ? Colors.white : AppColors.primary,
            ),
          ),
        ],
      ),
    );

    if (onVideo) {
      return DecoratedBox(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Colors.black.withValues(alpha: 0.55),
              Colors.black.withValues(alpha: 0.2),
              Colors.transparent,
            ],
            stops: const [0.0, 0.65, 1.0],
          ),
        ),
        child: SizedBox(height: top + 52, child: content),
      );
    }

    return Material(
      color: Colors.white,
      child: SizedBox(height: top + 48, child: content),
    );
  }
}

class _TabStrip extends StatelessWidget {
  const _TabStrip({
    required this.current,
    required this.onChanged,
    required this.onVideo,
  });

  final FeedTopTab current;
  final ValueChanged<FeedTopTab> onChanged;
  final bool onVideo;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: FeedTopTab.values.map((tab) {
        final selected = tab == current;
        final activeColor = onVideo ? Colors.white : AppColors.primary;
        final idleColor = onVideo
            ? Colors.white.withValues(alpha: 0.55)
            : AppColors.textSecondary;

        return GestureDetector(
          onTap: () => onChanged(tab),
          behavior: HitTestBehavior.opaque,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  tab.label,
                  style: TextStyle(
                    color: selected ? activeColor : idleColor,
                    fontSize: 15,
                    fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 4),
                AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  height: 2.5,
                  width: selected ? 28 : 0,
                  decoration: BoxDecoration(
                    color: activeColor,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }
}
