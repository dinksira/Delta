import 'dart:async';

import 'package:deltalabs_mobile/core/routing/app_routes.dart';
import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_marketplace_item_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/providers/school_providers.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_hub_search_bar.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_state_panel.dart';
import 'package:deltalabs_mobile/shared/widgets/loading/dl_loading_indicator.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

class SchoolMarketplacePage extends HookConsumerWidget {
  const SchoolMarketplacePage({super.key});

  static const _views = ['community', 'bids', 'listings'];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final viewIndex = useState(0);
    final search = useState('');
    final debouncedSearch = useState('');
    final view = _views[viewIndex.value];

    useEffect(() {
      final timer = Timer(const Duration(milliseconds: 350), () {
        debouncedSearch.value = search.value.trim();
      });
      return timer.cancel;
    }, [search.value]);

    final query = (view: view, search: debouncedSearch.value);
    final listingsAsync = ref.watch(schoolMarketplaceProvider(query));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
          child: SchoolHubSearchBar(
            hintText: 'Search marketplace',
            onChanged: (v) => search.value = v,
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 40,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: _views.length,
            separatorBuilder: (_, __) => const SizedBox(width: 8),
            itemBuilder: (context, index) {
              final labels = ['Community', 'My bids', 'My listings'];
              return FilterChip(
                label: Text(labels[index]),
                selected: viewIndex.value == index,
                onSelected: (_) => viewIndex.value = index,
                selectedColor: AppColors.primary.withValues(alpha: 0.15),
                checkmarkColor: AppColors.primary,
                labelStyle: TextStyle(
                  color: viewIndex.value == index
                      ? AppColors.primary
                      : AppColors.textSecondary,
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),
                backgroundColor: Colors.white,
                side: BorderSide(color: AppColors.inputBorder.withValues(alpha: 0.7)),
              );
            },
          ),
        ),
        const SizedBox(height: 8),
        Expanded(
          child: listingsAsync.when(
            loading: () => const Center(child: DlLoadingIndicator()),
            error: (e, _) => SchoolStatePanel(
              icon: Icons.error_outline_rounded,
              title: 'Could not load marketplace',
              message: 'Try again in a moment.',
              actionLabel: 'Retry',
              onAction: () => ref.invalidate(schoolMarketplaceProvider(query)),
            ),
            data: (page) {
              final items = page.items;
              if (items.isEmpty) {
                return SchoolStatePanel(
                  icon: Icons.storefront_outlined,
                  title: 'Nothing here yet',
                  message: view == 'community'
                      ? 'No community listings match your filters.'
                      : 'No items in this tab.',
                );
              }
              return RefreshIndicator(
                color: AppColors.primary,
                onRefresh: () async => ref.invalidate(schoolMarketplaceProvider(query)),
                child: ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                  itemCount: items.length + 1,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    if (index == 0) {
                      return Text(
                        '${page.total} listing${page.total == 1 ? '' : 's'}',
                        style: const TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                      );
                    }
                    final item = items[index - 1];
                    return _ListingTile(
                      item: item,
                      onTap: () => context.push(
                        AppRoutes.workspaceSchoolMarketplaceListingPath(item.id),
                      ),
                    );
                  },
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

class _ListingTile extends StatelessWidget {
  const _ListingTile({required this.item, required this.onTap});

  final SchoolMarketplaceItemModel item;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(14),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.inputBorder.withValues(alpha: 0.7)),
          ),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                item.title,
                style: const TextStyle(
                  color: AppColors.primary,
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                item.schoolName,
                style: const TextStyle(color: AppColors.textSecondary),
              ),
              const SizedBox(height: 8),
              Text(
                '${item.currency} ${item.price.toStringAsFixed(0)} · ${item.status}',
                style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
              ),
              if (item.description.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(
                  item.description,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(color: AppColors.textHint),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
