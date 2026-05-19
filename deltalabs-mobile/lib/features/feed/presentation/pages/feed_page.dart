import 'package:deltalabs_mobile/core/routing/app_routes.dart';
import 'package:deltalabs_mobile/features/auth/presentation/providers/auth_provider.dart';
import 'package:deltalabs_mobile/features/feed/presentation/pages/school_feed_page.dart';
import 'package:deltalabs_mobile/features/feed/presentation/providers/feed_provider.dart';
import 'package:deltalabs_mobile/features/feed/presentation/widgets/feed_auth_gate_dialog.dart';
import 'package:deltalabs_mobile/features/feed/presentation/widgets/feed_comments_sheet.dart';
import 'package:deltalabs_mobile/features/feed/presentation/widgets/feed_share_sheet.dart';
import 'package:deltalabs_mobile/features/feed/presentation/widgets/feed_top_chrome.dart';
import 'package:deltalabs_mobile/features/feed/presentation/widgets/feed_video_slide.dart';
import 'package:deltalabs_mobile/shared/widgets/loading/dl_loading_indicator.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

/// TikTok-style vertical video feed (default tab after login).
class FeedPage extends HookConsumerWidget {
  const FeedPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final feedState = ref.watch(feedProvider);
    final pageController = usePageController();
    final activeIndex = useState(0);
    final surfaceMode = useState(FeedSurfaceMode.feed);
    final isMuted = useState(false);

    useEffect(() {
      void listener() {
        final page = pageController.page?.round() ?? 0;
        if (page != activeIndex.value) {
          activeIndex.value = page;
          final items = feedState.items;
          if (items.isNotEmpty && page >= items.length - 2) {
            ref.read(feedProvider.notifier).loadMore();
          }
        }
      }

      pageController.addListener(listener);
      return () => pageController.removeListener(listener);
    }, [pageController, feedState.items.length]);

    final isFeedVideos = surfaceMode.value == FeedSurfaceMode.feed &&
        !feedState.isLoading &&
        feedState.items.isNotEmpty;

    Future<void> requireAuth(Future<void> Function() action) async {
      if (!ref.read(isAuthenticatedProvider)) {
        await FeedAuthGateDialog.show(context);
        return;
      }
      await action();
    }

    Widget body;
    if (surfaceMode.value == FeedSurfaceMode.school) {
      body = const SchoolFeedPage();
    } else if (feedState.isLoading && feedState.items.isEmpty) {
      body = const DlLoadingOverlay(message: 'Loading feed…');
    } else if (feedState.items.isEmpty) {
      body = ColoredBox(
        color: Colors.black,
        child: Center(
          child: Text(
            'No videos yet',
            style: TextStyle(color: Colors.white.withValues(alpha: 0.7)),
          ),
        ),
      );
    } else {
      body = PageView.builder(
        controller: pageController,
        scrollDirection: Axis.vertical,
        itemCount: feedState.items.length,
        onPageChanged: (index) {
          activeIndex.value = index;
          if (index >= feedState.items.length - 2) {
            ref.read(feedProvider.notifier).loadMore();
          }
        },
        itemBuilder: (context, index) {
          final item = feedState.items[index];
          return FeedVideoSlide(
            item: item,
            isActive: index == activeIndex.value,
            isMuted: isMuted.value,
            onLike: () => requireAuth(() async {
              final error = await ref.read(feedProvider.notifier).toggleLike(item.id);
              if (error != null && context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text(error), behavior: SnackBarBehavior.floating),
                );
              }
            }),
            onComment: () => FeedCommentsSheet.show(context, item),
            onSave: () => requireAuth(() async {
              final error = await ref.read(feedProvider.notifier).toggleSave(item.id);
              if (error != null && context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text(error), behavior: SnackBarBehavior.floating),
                );
              }
            }),
            onShare: () => FeedShareSheet.show(context, item),
          );
        },
      );
    }

    return Stack(
      fit: StackFit.expand,
      children: [
        body,
        Positioned(
          top: 0,
          left: 0,
          right: 0,
          child: FeedTopChrome(
            mode: surfaceMode.value,
            onModeChanged: (m) => surfaceMode.value = m,
            isMuted: isMuted.value,
            onMuteToggle: () => isMuted.value = !isMuted.value,
            showMute: isFeedVideos,
            onSearchTap: () => context.push(AppRoutes.search),
          ),
        ),
      ],
    );
  }
}
