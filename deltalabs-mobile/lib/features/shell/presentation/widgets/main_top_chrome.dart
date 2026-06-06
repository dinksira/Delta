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
    this.customTabLabel,
    this.overlayOnVideo = false,
    super.key,
  });

  final FeedTopTab currentTab;
  final ValueChanged<FeedTopTab> onTabChanged;
  final VoidCallback onSearchTap;
  final VoidCallback onFeaturesSwitchTap;
  final bool isFeaturesMode;
  final String? customTabLabel;
  /// When true, floats over the video with a gradient and light icons (TikTok-style).
  final bool overlayOnVideo;

  static double height(BuildContext context) {
    return MediaQuery.paddingOf(context).top + 52;
  }

  static const _tabTopInset = 32.0;
  static const _iconRowHeight = 48.0;
  static const _tabStripContentHeight = 40.0;

  /// Y-offset (from screen top) of the feed tab underline bottom edge.
  static double feedTabStripBottom(BuildContext context) {
    return MediaQuery.paddingOf(context).top +
        _tabTopInset +
        _tabStripContentHeight;
  }

  @override
  Widget build(BuildContext context) {
    final top = MediaQuery.paddingOf(context).top;
    final onVideo = overlayOnVideo && !isFeaturesMode;

    final content = Padding(
      padding: EdgeInsets.fromLTRB(4, top, 4, 0),
      child: isFeaturesMode
          ? SizedBox(
              height: _iconRowHeight,
              child: Row(
                children: [
                  IconButton(
                    onPressed: onSearchTap,
                    tooltip: 'Search',
                    icon: const Icon(
                      Icons.search_rounded,
                      color: AppColors.primary,
                      size: 26,
                    ),
                  ),
                  const Expanded(
                    child: Center(
                      child: Text(
                        'Features',
                        style: TextStyle(
                          color: AppColors.primary,
                          fontSize: 17,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
                  IconButton(
                    onPressed: onFeaturesSwitchTap,
                    tooltip: 'Back to feed',
                    icon: FeaturesSwitchIcon(
                      size: 22,
                      color: AppColors.primary,
                    ),
                  ),
                ],
              ),
            )
          : Stack(
              clipBehavior: Clip.none,
              children: [
                SizedBox(
                  height: _iconRowHeight,
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
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
                      const Spacer(),
                      IconButton(
                        onPressed: onFeaturesSwitchTap,
                        tooltip: 'Features',
                        icon: FeaturesSwitchIcon(
                          size: 22,
                          color: onVideo ? Colors.white : AppColors.primary,
                        ),
                      ),
                    ],
                  ),
                ),
                Positioned(
                  left: 48,
                  right: 48,
                  top: _tabTopInset,
                  child: _TabStrip(
                    current: currentTab,
                    onChanged: onTabChanged,
                    onVideo: onVideo,
                    customTabLabel: customTabLabel,
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
    this.customTabLabel,
  });

  final FeedTopTab current;
  final ValueChanged<FeedTopTab> onChanged;
  final bool onVideo;
  final String? customTabLabel;

  static const _underlineWidth = 28.0;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        return SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 2),
          child: ConstrainedBox(
            constraints: BoxConstraints(minWidth: constraints.maxWidth),
            child: Row(
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
                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 6),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          tab.displayLabel(customTabLabel: customTabLabel),
                          style: TextStyle(
                            color: selected ? activeColor : idleColor,
                            fontSize: 17,
                            fontWeight:
                                selected ? FontWeight.w700 : FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Container(
                          height: 3,
                          width: _underlineWidth,
                          decoration: BoxDecoration(
                            color: selected ? activeColor : Colors.transparent,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        );
      },
    );
  }
}
