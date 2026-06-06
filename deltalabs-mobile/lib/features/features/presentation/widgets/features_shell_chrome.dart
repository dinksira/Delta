import 'package:deltalabs_mobile/core/routing/app_routes.dart';
import 'package:deltalabs_mobile/features/features/presentation/constants/feature_hub_categories.dart';
import 'package:deltalabs_mobile/features/features/presentation/feature_instance_navigation.dart';
import 'package:deltalabs_mobile/features/features/presentation/providers/features_hub_provider.dart';
import 'package:deltalabs_mobile/features/features/presentation/providers/features_shell_tab_provider.dart';
import 'package:deltalabs_mobile/features/features/presentation/widgets/features_plus_tab_bar.dart';
import 'package:deltalabs_mobile/shared/widgets/loading/dl_loading_indicator.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

/// Persistent Plus-style category tabs — shown on the hub and every workspace route.
class FeaturesShellChrome extends ConsumerWidget {
  const FeaturesShellChrome({super.key});

  static bool isWorkspacePath(String path) => path.startsWith('/workspace');

  static bool isSchoolWorkspaceDetailPath(String path) =>
      path.startsWith(AppRoutes.workspaceSchoolDetailPrefix);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final hub = ref.watch(featuresHubProvider);
    final shellTab = ref.watch(featuresShellTabProvider);
    final showLoadError = hub.loadError != null && hub.catalog.isEmpty;

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (!showLoadError)
          FeaturesPlusTabBar(
            selectedId: shellTab.selectedCategoryId,
            counts: hub.instanceTabCounts,
            pinnedTabs: hub.pinnedCategories,
            showLoadingHint: hub.isLoading && hub.catalog.isEmpty,
            onSelected: (id) => _onTabSelected(context, ref, id),
            onReorderPinned: (oldIndex, newIndex) {
              ref.read(featuresHubProvider.notifier).reorderPinnedCategories(
                    oldIndex,
                    newIndex,
                  );
            },
            onUnpin: (categoryId) => _onUnpinTab(context, ref, categoryId),
          ),
        if (hub.isSaving && !showLoadError) const DlLinearLoadingBar(),
      ],
    );
  }

  Future<void> _onUnpinTab(
    BuildContext context,
    WidgetRef ref,
    String categoryId,
  ) async {
    final removed =
        await ref.read(featuresHubProvider.notifier).unpinCategory(categoryId);
    if (!removed || !context.mounted) return;

    final selected = ref.read(featuresShellTabProvider).selectedCategoryId;
    if (selected != categoryId) return;

    ref.read(featuresShellTabProvider.notifier).select(FeatureHubCategories.all.id);
    final path = GoRouterState.of(context).uri.path;
    if (!isWorkspacePath(path)) {
      context.go(AppRoutes.featuresHub);
    }
  }

  void _onTabSelected(BuildContext context, WidgetRef ref, String id) {
    final hub = ref.read(featuresHubProvider);
    if (id != FeatureHubCategories.all.id && !hub.isCategoryPinned(id)) {
      id = FeatureHubCategories.all.id;
    }

    final previous = ref.read(featuresShellTabProvider).selectedCategoryId;
    ref.read(featuresShellTabProvider.notifier).select(id);

    final path = GoRouterState.of(context).uri.path;
    if (!isWorkspacePath(path)) return;

    // Re-tap School on hub routes → instance list. Detail uses its own back → hub.
    if (id == 'school' &&
        id == previous &&
        path.startsWith('/workspace/school') &&
        !isSchoolWorkspaceDetailPath(path)) {
      goToFeaturesHubTab(context, 'school');
      return;
    }

    if (id == previous) return;
    if (id == 'school' && isSchoolWorkspaceDetailPath(path)) return;

    goToFeaturesHubTab(context, id);
  }
}
