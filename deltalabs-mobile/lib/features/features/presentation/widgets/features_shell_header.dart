import 'package:deltalabs_mobile/core/routing/app_routes.dart';
import 'package:deltalabs_mobile/features/features/presentation/widgets/features_shell_chrome.dart';
import 'package:deltalabs_mobile/features/shell/presentation/widgets/feed_top_tab.dart';
import 'package:deltalabs_mobile/features/shell/presentation/widgets/main_top_chrome.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// Shared features chrome: Search · Features · switch + category tabs.
/// Used on the hub and every workspace route so the top stays identical.
class FeaturesShellHeader extends StatelessWidget {
  const FeaturesShellHeader({
    this.onFeaturesSwitchTap,
    super.key,
  });

  final VoidCallback? onFeaturesSwitchTap;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        MainTopChrome(
          currentTab: FeedTopTab.video,
          onTabChanged: (_) {},
          onSearchTap: () => context.push(AppRoutes.featuresSearch),
          onFeaturesSwitchTap:
              onFeaturesSwitchTap ?? () => context.go(AppRoutes.feed),
          isFeaturesMode: true,
        ),
        const FeaturesShellChrome(),
      ],
    );
  }
}
