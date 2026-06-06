import 'package:deltalabs_mobile/core/routing/app_routes.dart';
import 'package:deltalabs_mobile/features/feed/domain/entities/feed_custom_tab.dart';
import 'package:deltalabs_mobile/features/feed/presentation/pages/custom_feed_tab_page.dart';
import 'package:deltalabs_mobile/features/feed/presentation/pages/feed_page.dart';
import 'package:deltalabs_mobile/features/feed/presentation/providers/custom_feed_tab_provider.dart';
import 'package:deltalabs_mobile/features/features/presentation/constants/feature_hub_categories.dart';
import 'package:deltalabs_mobile/features/features/presentation/providers/features_hub_provider.dart';
import 'package:deltalabs_mobile/features/features/presentation/providers/features_shell_tab_provider.dart';
import 'package:deltalabs_mobile/features/features/presentation/widgets/features_shell_header.dart';
import 'package:deltalabs_mobile/features/shell/presentation/pages/features_hub_page.dart';
import 'package:deltalabs_mobile/features/shell/presentation/pages/feed_tab_placeholder_page.dart';
import 'package:deltalabs_mobile/features/shell/presentation/widgets/feed_top_tab.dart';
import 'package:deltalabs_mobile/features/shell/presentation/widgets/main_top_chrome.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
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

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _syncFeaturesTabFromRoute());
  }

  bool _usesFeedVideoOverlay(AsyncValue<FeedCustomTab?> customTabState) {
    if (_surface != ShellSurface.feed) return false;
    if (_tab == FeedTopTab.video) return true;
    if (_tab == FeedTopTab.custom) {
      return customTabState.when(
        data: (tab) => tab != null,
        loading: () => true,
        error: (_, __) => true,
      );
    }
    return false;
  }

  void _syncFeaturesTabFromRoute() {
    if (!mounted) return;
    final tab = GoRouterState.of(context).uri.queryParameters['tab'];
    if (tab == null || tab.isEmpty) return;

    final hub = ref.read(featuresHubProvider);
    if (tab != FeatureHubCategories.all.id && !hub.isCategoryPinned(tab)) {
      ref.read(featuresShellTabProvider.notifier).select(FeatureHubCategories.all.id);
      return;
    }
    ref.read(featuresShellTabProvider.notifier).select(tab);
  }

  @override
  Widget build(BuildContext context) {
    final customTabLabel = ref.watch(customFeedTabLabelProvider);
    final customTabState = ref.watch(customFeedTabNotifierProvider);
    final overlayChromeOnVideo = _usesFeedVideoOverlay(customTabState);

    final featuresHeader = FeaturesShellHeader(
      onFeaturesSwitchTap: () => setState(() {
        _surface = _surface == ShellSurface.feed
            ? ShellSurface.features
            : ShellSurface.feed;
      }),
    );

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
      overlayOnVideo: overlayChromeOnVideo,
    );

    final statusStyle = overlayChromeOnVideo
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
        CustomFeedTabPage(),
      ],
    );

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: statusStyle.copyWith(
        systemNavigationBarColor: Colors.transparent,
        systemNavigationBarIconBrightness:
            overlayChromeOnVideo ? Brightness.light : Brightness.dark,
      ),
      child: Scaffold(
        backgroundColor:
            _surface == ShellSurface.features ? Colors.white : Colors.black,
        body: _surface == ShellSurface.features
            ? Column(
                children: [
                  featuresHeader,
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
