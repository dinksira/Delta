import 'package:deltalabs_mobile/core/routing/app_routes.dart';
import 'package:deltalabs_mobile/features/feed/presentation/pages/custom_feed_tab_page.dart';
import 'package:deltalabs_mobile/features/feed/presentation/pages/feed_page.dart';
import 'package:deltalabs_mobile/features/feed/presentation/providers/custom_feed_tab_provider.dart';
import 'package:deltalabs_mobile/features/shell/presentation/pages/features_hub_page.dart';
import 'package:deltalabs_mobile/features/shell/presentation/pages/feed_tab_placeholder_page.dart';
import 'package:deltalabs_mobile/features/shell/presentation/widgets/feed_top_tab.dart';
import 'package:deltalabs_mobile/features/shell/presentation/widgets/main_top_chrome.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

enum ShellSurface { feed, features }

/// Post-login shell: top tabs overlay on video (TikTok-style), no bottom navigation.
class MainShellPage extends ConsumerStatefulWidget {
  const MainShellPage({
    super.key,
    this.initialTab = FeedTopTab.video,
    this.initialSurface = ShellSurface.feed,
  });

  final FeedTopTab initialTab;
  final ShellSurface initialSurface;

  @override
  ConsumerState<MainShellPage> createState() => _MainShellPageState();
}

class _MainShellPageState extends ConsumerState<MainShellPage> {
  late FeedTopTab _tab = widget.initialTab;
  late ShellSurface _surface = widget.initialSurface;

  bool get _overlayChromeOnVideo =>
      _surface == ShellSurface.feed && _tab == FeedTopTab.video;

  @override
  Widget build(BuildContext context) {
    final customTabLabel = ref.watch(customFeedTabLabelProvider);

    final chrome = MainTopChrome(
      currentTab: _tab,
      customTabLabel: customTabLabel,
      onTabChanged: (next) => setState(() {
        _tab = next;
        _surface = ShellSurface.feed;
      }),
      onSearchTap: () {
        if (_surface == ShellSurface.features) {
          context.push(AppRoutes.featuresSearch);
        } else {
          context.push(AppRoutes.search);
        }
      },
      onFeaturesSwitchTap: () => setState(() {
        _surface = _surface == ShellSurface.feed
            ? ShellSurface.features
            : ShellSurface.feed;
      }),
      isFeaturesMode: _surface == ShellSurface.features,
      overlayOnVideo: _overlayChromeOnVideo,
    );

    final statusStyle = _overlayChromeOnVideo
        ? SystemUiOverlayStyle.light.copyWith(statusBarColor: Colors.transparent)
        : SystemUiOverlayStyle.dark.copyWith(statusBarColor: Colors.transparent);

    final feedStack = IndexedStack(
      index: _tab.index,
      children: const [
        FeedPage(),
        FeedTabPlaceholderPage(
          icon: Icons.music_note_rounded,
          title: 'Audio',
          subtitle: 'Audio feed — coming soon',
        ),
        FeedTabPlaceholderPage(
          icon: Icons.auto_awesome,
          title: 'AI',
          subtitle: 'AI tools and clips — coming soon',
        ),
        FeedTabPlaceholderPage(
          icon: Icons.science_outlined,
          title: 'Simulation',
          subtitle: 'Scenarios, digital twin, and batch runs — coming soon',
        ),
        const CustomFeedTabPage(),
      ],
    );

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: statusStyle.copyWith(
        systemNavigationBarColor: Colors.transparent,
        systemNavigationBarIconBrightness:
            _overlayChromeOnVideo ? Brightness.light : Brightness.dark,
      ),
      child: Scaffold(
        backgroundColor:
            _surface == ShellSurface.features ? Colors.white : Colors.black,
        body: _surface == ShellSurface.features
            ? Column(
                children: [
                  chrome,
                  const Expanded(child: FeaturesHubPage()),
                ],
              )
            : Stack(
                fit: StackFit.expand,
                children: [
                  feedStack,
                  Positioned(
                    top: 0,
                    left: 0,
                    right: 0,
                    child: chrome,
                  ),
                ],
              ),
      ),
    );
  }
}
