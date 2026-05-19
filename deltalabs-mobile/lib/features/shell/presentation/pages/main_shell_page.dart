import 'package:deltalabs_mobile/features/feed/presentation/pages/feed_page.dart';
import 'package:deltalabs_mobile/features/shell/presentation/pages/feed_tab_placeholder_page.dart';
import 'package:deltalabs_mobile/features/shell/presentation/pages/profile_tab_page.dart';
import 'package:deltalabs_mobile/features/shell/presentation/widgets/main_bottom_nav.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

/// Post-login shell: full-screen tabs with TikTok-style bottom navigation (no top bar).
class MainShellPage extends ConsumerStatefulWidget {
  const MainShellPage({super.key, this.initialTab = MainTab.video});

  final MainTab initialTab;

  @override
  ConsumerState<MainShellPage> createState() => _MainShellPageState();
}

class _MainShellPageState extends ConsumerState<MainShellPage> {
  late MainTab _tab = widget.initialTab;

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light.copyWith(
        statusBarColor: Colors.transparent,
        systemNavigationBarColor: Colors.transparent,
      ),
      child: Scaffold(
        backgroundColor: Colors.black,
        body: IndexedStack(
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
              icon: Icons.explore_rounded,
              title: 'Explore',
              subtitle: 'Discover schools and courses — coming soon',
            ),
            ProfileTabPage(),
          ],
        ),
        bottomNavigationBar: MainBottomNav(
          current: _tab,
          onChanged: (next) => setState(() => _tab = next),
        ),
      ),
    );
  }
}
