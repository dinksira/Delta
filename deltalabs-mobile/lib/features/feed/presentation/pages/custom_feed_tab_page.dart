import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/auth/presentation/providers/auth_provider.dart';
import 'package:deltalabs_mobile/features/feed/domain/entities/feed_custom_tab.dart';
import 'package:deltalabs_mobile/features/feed/domain/entities/feed_query_filters.dart';
import 'package:deltalabs_mobile/features/feed/presentation/models/feed_clip_filter_selection.dart';
import 'package:deltalabs_mobile/features/feed/presentation/providers/custom_feed_tab_provider.dart';
import 'package:deltalabs_mobile/features/feed/presentation/providers/custom_tab_feed_provider.dart';
import 'package:deltalabs_mobile/features/feed/presentation/widgets/custom_feed_filter_sheet.dart';
import 'package:deltalabs_mobile/features/feed/presentation/widgets/feed_auth_gate_dialog.dart';
import 'package:deltalabs_mobile/features/feed/presentation/widgets/feed_comments_sheet.dart';
import 'package:deltalabs_mobile/features/feed/presentation/widgets/feed_share_sheet.dart';
import 'package:deltalabs_mobile/features/feed/presentation/widgets/feed_video_slide.dart';
import 'package:deltalabs_mobile/shared/widgets/loading/dl_loading_indicator.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

/// Custom feed tab — saved label + filters, vertical clip feed (like web `/custom`).
class CustomFeedTabPage extends HookConsumerWidget {
  const CustomFeedTabPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tabAsync = ref.watch(customFeedTabNotifierProvider);

    return tabAsync.when(
      loading: () => const ColoredBox(
        color: Colors.black,
        child: Center(child: DlLoadingIndicator(size: DlLoadingSize.medium, onDark: true)),
      ),
      error: (e, _) => ColoredBox(
        color: Colors.black,
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Could not load custom feed',
                  style: TextStyle(color: Colors.white.withValues(alpha: 0.85)),
                ),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: () => ref.read(customFeedTabNotifierProvider.notifier).reload(),
                  child: const Text('Retry'),
                ),
              ],
            ),
          ),
        ),
      ),
      data: (tab) {
        if (tab == null) {
          return _CustomFeedSetupView(
            onSaved: (label, filters) async {
              await ref
                  .read(customFeedTabNotifierProvider.notifier)
                  .save(label: label, filters: filters);
              ref.invalidate(customTabFeedProvider);
            },
          );
        }
        return _CustomFeedViewer(tab: tab);
      },
    );
  }
}

class _CustomFeedSetupView extends HookConsumerWidget {
  const _CustomFeedSetupView({required this.onSaved});

  final Future<void> Function(String label, FeedQueryFilters filters) onSaved;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final labelController = useTextEditingController(text: 'Custom');
    final selection = useState(FeedClipFilterSelection.empty);
    final isSaving = useState(false);

    Future<void> submit() async {
      if (!ref.read(isAuthenticatedProvider)) {
        await FeedAuthGateDialog.show(context);
        return;
      }
      if (!selection.value.hasActiveFilters) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Choose at least one filter for your custom feed.'),
            behavior: SnackBarBehavior.floating,
          ),
        );
        return;
      }
      isSaving.value = true;
      await onSaved(
        labelController.text.trim().isEmpty ? 'Custom' : labelController.text.trim(),
        selection.value.toQueryFilters(),
      );
      isSaving.value = false;
    }

    return ColoredBox(
      color: AppColors.surfaceGrey,
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                'Create your custom feed',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Pick filters once — your Custom tab will always show matching clips.',
                style: TextStyle(color: AppColors.textSecondary, height: 1.4),
              ),
              const SizedBox(height: 24),
              TextField(
                controller: labelController,
                maxLength: 24,
                decoration: const InputDecoration(
                  labelText: 'Tab name',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: () => CustomFeedFilterSheet.show(
                  context,
                  initial: selection.value,
                  onApply: (next) => selection.value = next,
                ),
                icon: const Icon(Icons.tune_rounded),
                label: Text(
                  selection.value.hasActiveFilters
                      ? 'Edit filters'
                      : 'Choose filters',
                ),
              ),
              const Spacer(),
              FilledButton(
                onPressed: isSaving.value ? null : submit,
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                child: isSaving.value
                    ? const SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Text('Save custom feed'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CustomFeedViewer extends HookConsumerWidget {
  const _CustomFeedViewer({required this.tab});

  final FeedCustomTab tab;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final feedState = ref.watch(customTabFeedProvider);
    final pageController = usePageController();
    final activeIndex = useState(0);
    final isMuted = useState(false);

    useEffect(() {
      void listener() {
        final page = pageController.page?.round() ?? 0;
        if (page != activeIndex.value) {
          activeIndex.value = page;
          if (feedState.items.isNotEmpty && page >= feedState.items.length - 2) {
            ref.read(customTabFeedProvider.notifier).loadMore();
          }
        }
      }

      pageController.addListener(listener);
      return () => pageController.removeListener(listener);
    }, [pageController, feedState.items.length]);

    Future<void> requireAuth(Future<void> Function() action) async {
      if (!ref.read(isAuthenticatedProvider)) {
        await FeedAuthGateDialog.show(context);
        return;
      }
      await action();
    }

    Widget body;
    if (feedState.isLoading && feedState.items.isEmpty) {
      body = const Center(
        child: DlLoadingIndicator(size: DlLoadingSize.medium, onDark: true),
      );
    } else if (feedState.items.isEmpty) {
      body = Center(
        child: Text(
          'No clips match your filters',
          style: TextStyle(color: Colors.white.withValues(alpha: 0.7)),
        ),
      );
    } else {
      body = PageView.builder(
        controller: pageController,
        scrollDirection: Axis.vertical,
        itemCount: feedState.items.length,
        itemBuilder: (context, index) {
          final item = feedState.items[index];
          return FeedVideoSlide(
            item: item,
            isActive: index == activeIndex.value,
            isMuted: isMuted.value,
            onLike: () => requireAuth(() async {
              final error =
                  await ref.read(customTabFeedProvider.notifier).toggleLike(item.id);
              if (error != null && context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text(error), behavior: SnackBarBehavior.floating),
                );
              }
            }),
            onComment: () => FeedCommentsSheet.show(context, item),
            onSave: () => requireAuth(() async {
              final error =
                  await ref.read(customTabFeedProvider.notifier).toggleSave(item.id);
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
        ColoredBox(color: Colors.black, child: body),
        Positioned(
          top: MediaQuery.paddingOf(context).top + 56,
          right: 8,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              IconButton(
                onPressed: () => CustomFeedFilterSheet.show(
                  context,
                  initial: FeedClipFilterSelection.fromQueryFilters(tab.filters),
                  onApply: (selection) async {
                    if (!selection.hasActiveFilters) return;
                    await ref.read(customFeedTabNotifierProvider.notifier).save(
                          label: tab.label,
                          filters: selection.toQueryFilters(),
                        );
                    ref.invalidate(customTabFeedProvider);
                  },
                ),
                icon: const Icon(Icons.tune_rounded, color: Colors.white),
                style: IconButton.styleFrom(
                  backgroundColor: Colors.black.withValues(alpha: 0.35),
                ),
              ),
              IconButton(
                onPressed: () => isMuted.value = !isMuted.value,
                icon: Icon(
                  isMuted.value ? Icons.volume_off_rounded : Icons.volume_up_rounded,
                  color: Colors.white,
                ),
                style: IconButton.styleFrom(
                  backgroundColor: Colors.black.withValues(alpha: 0.35),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
