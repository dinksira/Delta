import 'dart:async';

import 'package:deltalabs_mobile/core/routing/app_routes.dart';
import 'package:deltalabs_mobile/features/feed/domain/entities/feed_item.dart';
import 'package:deltalabs_mobile/features/search/presentation/models/search_viewer_args.dart';
import 'package:deltalabs_mobile/features/search/presentation/providers/search_providers.dart';
import 'package:deltalabs_mobile/features/search/presentation/widgets/search_user_row.dart';
import 'package:deltalabs_mobile/features/search/presentation/widgets/search_video_tile.dart';
import 'package:deltalabs_mobile/shared/widgets/loading/dl_loading_indicator.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

/// TikTok-style full-screen search: discover → results grid → clip viewer.
class SearchPage extends HookConsumerWidget {
  const SearchPage({this.initialQuery, super.key});

  final String? initialQuery;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final controller = useTextEditingController(text: initialQuery ?? '');
    final focusNode = useFocusNode();
    final debouncedQ = useState(initialQuery?.trim() ?? '');
    final tab = useState(SearchResultsTab.top);

    useEffect(() {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        focusNode.requestFocus();
      });
      if (initialQuery != null && initialQuery!.trim().isNotEmpty) {
        ref.read(activeSearchProvider.notifier).setQuery(initialQuery!.trim());
        tab.value = SearchResultsTab.top;
      }
      return null;
    }, const []);

    useEffect(() {
      final timer = Timer(const Duration(milliseconds: 400), () {
        final next = controller.text.trim();
        if (debouncedQ.value != next) {
          debouncedQ.value = next;
          ref.read(activeSearchProvider.notifier).setQuery(next);
          ref.read(activeSearchProvider.notifier).setTab(tab.value);
        }
      });
      return timer.cancel;
    }, [controller.text, tab.value]);

    void submitSearch() {
      final q = controller.text.trim();
      if (q.isEmpty) return;
      ref.read(searchHistoryProvider.notifier).add(q);
      debouncedQ.value = q;
      ref.read(activeSearchProvider.notifier).setQuery(q);
      ref.read(activeSearchProvider.notifier).setTab(tab.value);
      FocusScope.of(context).unfocus();
    }

    void openClip(int index, List<FeedItem> clips) {
      context.push(
        AppRoutes.searchViewer,
        extra: SearchViewerArgs(clips: clips, initialIndex: index),
      );
    }

    final active = ref.watch(activeSearchProvider);
    final resultsAsync = ref.watch(searchResultsProvider);
    final history = ref.watch(searchHistoryProvider);
    final hasQuery = active.q.isNotEmpty;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Scaffold(
        backgroundColor: Colors.black,
        body: SafeArea(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _SearchBar(
                controller: controller,
                focusNode: focusNode,
                onBack: () => context.pop(),
                onClear: () {
                  controller.clear();
                  debouncedQ.value = '';
                  ref.read(activeSearchProvider.notifier).setQuery('');
                },
                onSubmitted: submitSearch,
              ),
              if (!hasQuery) ...[
                Expanded(child: _RecentSearches(
                  history: history,
                  onTap: (q) {
                    controller.text = q;
                    debouncedQ.value = q;
                    ref.read(activeSearchProvider.notifier).setQuery(q);
                    ref.read(searchHistoryProvider.notifier).add(q);
                  },
                  onRemove: (q) => ref.read(searchHistoryProvider.notifier).remove(q),
                )),
              ] else ...[
                _SearchTabs(
                  current: tab.value,
                  onChanged: (t) {
                    tab.value = t;
                    ref.read(activeSearchProvider.notifier).setTab(t);
                  },
                ),
                Expanded(
                  child: resultsAsync.when(
                    loading: () => const Center(
                      child: DlLoadingIndicator(size: DlLoadingSize.medium, onDark: true),
                    ),
                    error: (_, __) => Center(
                      child: Text(
                        'Search failed. Try again.',
                        style: TextStyle(color: Colors.white.withValues(alpha: 0.7)),
                      ),
                    ),
                    data: (data) {
                      if (data == null) {
                        return const SizedBox.shrink();
                      }
                      if (tab.value == SearchResultsTab.users) {
                        if (data.users.isEmpty) {
                          return _EmptyResults(query: active.q);
                        }
                        return ListView.separated(
                          itemCount: data.users.length,
                          separatorBuilder: (_, __) => Divider(
                            height: 1,
                            color: Colors.white.withValues(alpha: 0.08),
                          ),
                          itemBuilder: (_, i) => SearchUserRow(user: data.users[i]),
                        );
                      }
                      if (data.clips.isEmpty) {
                        return _EmptyResults(query: active.q);
                      }
                      return GridView.builder(
                        padding: const EdgeInsets.fromLTRB(2, 4, 2, 16),
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          mainAxisSpacing: 2,
                          crossAxisSpacing: 2,
                          childAspectRatio: 3 / 4,
                        ),
                        itemCount: data.clips.length,
                        itemBuilder: (_, i) => SearchVideoTile(
                          item: data.clips[i],
                          onTap: () => openClip(i, data.clips),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _SearchBar extends StatelessWidget {
  const _SearchBar({
    required this.controller,
    required this.focusNode,
    required this.onBack,
    required this.onClear,
    required this.onSubmitted,
  });

  final TextEditingController controller;
  final FocusNode focusNode;
  final VoidCallback onBack;
  final VoidCallback onClear;
  final VoidCallback onSubmitted;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(4, 4, 12, 8),
      child: Row(
        children: [
          IconButton(
            onPressed: onBack,
            icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 22),
          ),
          Expanded(
            child: TextField(
              controller: controller,
              focusNode: focusNode,
              style: const TextStyle(color: Colors.white, fontSize: 16),
              cursorColor: Colors.white,
              textInputAction: TextInputAction.search,
              onSubmitted: (_) => onSubmitted(),
              decoration: InputDecoration(
                hintText: 'Search',
                hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.45)),
                filled: true,
                fillColor: const Color(0xFF2C2C2E),
                isDense: true,
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide.none,
                ),
                suffixIcon: ValueListenableBuilder<TextEditingValue>(
                  valueListenable: controller,
                  builder: (_, value, __) {
                    if (value.text.isEmpty) return const SizedBox.shrink();
                    return IconButton(
                      onPressed: onClear,
                      icon: Icon(Icons.cancel, color: Colors.white.withValues(alpha: 0.5), size: 20),
                    );
                  },
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SearchTabs extends StatelessWidget {
  const _SearchTabs({
    required this.current,
    required this.onChanged,
  });

  final SearchResultsTab current;
  final ValueChanged<SearchResultsTab> onChanged;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Row(
        children: [
          _TabChip(
            label: 'Top',
            selected: current == SearchResultsTab.top,
            onTap: () => onChanged(SearchResultsTab.top),
          ),
          const SizedBox(width: 24),
          _TabChip(
            label: 'Users',
            selected: current == SearchResultsTab.users,
            onTap: () => onChanged(SearchResultsTab.users),
          ),
        ],
      ),
    );
  }
}

class _TabChip extends StatelessWidget {
  const _TabChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label,
            style: TextStyle(
              color: selected ? Colors.white : Colors.white.withValues(alpha: 0.45),
              fontSize: 15,
              fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
            ),
          ),
          const SizedBox(height: 6),
          AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            height: 2,
            width: selected ? 28 : 0,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(1),
            ),
          ),
        ],
      ),
    );
  }
}

class _RecentSearches extends StatelessWidget {
  const _RecentSearches({
    required this.history,
    required this.onTap,
    required this.onRemove,
  });

  final List<String> history;
  final ValueChanged<String> onTap;
  final ValueChanged<String> onRemove;

  @override
  Widget build(BuildContext context) {
    if (history.isEmpty) {
      return Center(
        child: Text(
          'Search for videos, users, and more',
          style: TextStyle(color: Colors.white.withValues(alpha: 0.5), fontSize: 14),
        ),
      );
    }

    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 8),
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(12, 8, 12, 4),
          child: Text(
            'Recent searches',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.55),
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        ...history.map(
          (q) => ListTile(
            leading: Icon(Icons.history, color: Colors.white.withValues(alpha: 0.5), size: 22),
            title: Text(q, style: const TextStyle(color: Colors.white, fontSize: 15)),
            trailing: IconButton(
              icon: Icon(Icons.close, color: Colors.white.withValues(alpha: 0.4), size: 18),
              onPressed: () => onRemove(q),
            ),
            onTap: () => onTap(q),
          ),
        ),
      ],
    );
  }
}

class _EmptyResults extends StatelessWidget {
  const _EmptyResults({required this.query});

  final String query;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Text(
          'No results for "$query"',
          textAlign: TextAlign.center,
          style: TextStyle(color: Colors.white.withValues(alpha: 0.6), fontSize: 14),
        ),
      ),
    );
  }
}
