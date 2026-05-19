import 'package:deltalabs_mobile/features/auth/presentation/providers/auth_provider.dart';
import 'package:deltalabs_mobile/features/feed/domain/entities/feed_item.dart';
import 'package:deltalabs_mobile/features/feed/presentation/providers/feed_repository_provider.dart';
import 'package:deltalabs_mobile/features/feed/presentation/widgets/feed_auth_gate_dialog.dart';
import 'package:deltalabs_mobile/features/feed/presentation/widgets/feed_comments_sheet.dart';
import 'package:deltalabs_mobile/features/feed/presentation/widgets/feed_share_sheet.dart';
import 'package:deltalabs_mobile/features/feed/presentation/widgets/feed_video_slide.dart';
import 'package:deltalabs_mobile/features/search/presentation/models/search_viewer_args.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

/// Full-screen vertical player opened from search (TikTok-style).
class SearchClipViewerPage extends HookConsumerWidget {
  const SearchClipViewerPage({required this.args, super.key});

  final SearchViewerArgs args;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pageController = usePageController(initialPage: args.initialIndex);
    final activeIndex = useState(args.initialIndex);
    final isMuted = useState(false);
    final clips = useState<List<FeedItem>>(args.clips);
    final top = MediaQuery.paddingOf(context).top;

    Future<void> requireAuth(Future<void> Function() action) async {
      if (!ref.read(isAuthenticatedProvider)) {
        await FeedAuthGateDialog.show(context);
        return;
      }
      await action();
    }

    void updateClip(String id, FeedItem Function(FeedItem) transform) {
      clips.value = clips.value
          .map((c) => c.id == id ? transform(c) : c)
          .toList(growable: false);
    }

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Scaffold(
        backgroundColor: Colors.black,
        body: Stack(
          fit: StackFit.expand,
          children: [
            PageView.builder(
              controller: pageController,
              scrollDirection: Axis.vertical,
              itemCount: clips.value.length,
              onPageChanged: (i) => activeIndex.value = i,
              itemBuilder: (context, index) {
                final item = clips.value[index];
                return FeedVideoSlide(
                  item: item,
                  isActive: index == activeIndex.value,
                  isMuted: isMuted.value,
                  bottomInset: MediaQuery.paddingOf(context).bottom,
                  onLike: () => requireAuth(() async {
                    final previous = item;
                    final optimistic = !item.isLiked;
                    updateClip(
                      item.id,
                      (c) => c.copyWith(
                        isLiked: optimistic,
                        likeCount: optimistic
                            ? c.likeCount + 1
                            : (c.likeCount > 0 ? c.likeCount - 1 : 0),
                      ),
                    );
                    final result =
                        await ref.read(feedRepositoryProvider).toggleLike(item.id);
                    result.fold(
                      (f) {
                        updateClip(item.id, (_) => previous);
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text(f.message)),
                          );
                        }
                      },
                      (engagement) => updateClip(
                        item.id,
                        (c) => c.copyWith(
                          isLiked: engagement.active,
                          likeCount: engagement.count,
                        ),
                      ),
                    );
                  }),
                  onComment: () => FeedCommentsSheet.show(context, item),
                  onSave: () => requireAuth(() async {
                    final previous = item;
                    updateClip(item.id, (c) => c.copyWith(isSaved: !c.isSaved));
                    final result =
                        await ref.read(feedRepositoryProvider).toggleSave(item.id);
                    result.fold(
                      (f) {
                        updateClip(item.id, (_) => previous);
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text(f.message)),
                          );
                        }
                      },
                      (engagement) => updateClip(
                        item.id,
                        (c) => c.copyWith(isSaved: engagement.active),
                      ),
                    );
                  }),
                  onShare: () => FeedShareSheet.show(context, item),
                );
              },
            ),
            Positioned(
              top: top + 4,
              left: 4,
              child: IconButton(
                onPressed: () => context.pop(),
                icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white),
              ),
            ),
            Positioned(
              top: top + 4,
              right: 4,
              child: IconButton(
                onPressed: () => isMuted.value = !isMuted.value,
                icon: Icon(
                  isMuted.value ? Icons.volume_off_rounded : Icons.volume_up_rounded,
                  color: Colors.white,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
