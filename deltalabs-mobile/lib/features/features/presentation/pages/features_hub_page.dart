import 'package:deltalabs_mobile/core/error/failures.dart';
import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/features/presentation/constants/feature_hub_categories.dart';
import 'package:deltalabs_mobile/features/features/presentation/feature_instance_navigation.dart';
import 'package:deltalabs_mobile/features/features/presentation/models/feature_card_ui.dart';
import 'package:deltalabs_mobile/features/features/presentation/models/feature_instance_ui.dart';
import 'package:deltalabs_mobile/features/features/presentation/providers/features_hub_provider.dart';
import 'package:deltalabs_mobile/features/features/presentation/widgets/feature_card_menu_popup.dart';
import 'package:deltalabs_mobile/features/features/presentation/widgets/feature_list_tile.dart';
import 'package:deltalabs_mobile/features/features/presentation/widgets/features_hub_error_view.dart';
import 'package:deltalabs_mobile/features/features/presentation/providers/features_shell_tab_provider.dart';
import 'package:deltalabs_mobile/features/workspace/data/models/my_school_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/providers/school_providers.dart';
import 'package:deltalabs_mobile/shared/widgets/loading/dl_loading_indicator.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Features hub — Plus tabs · All catalog · per-tab instances (Telegram list).
class FeaturesHubPage extends ConsumerStatefulWidget {
  const FeaturesHubPage({super.key});

  @override
  ConsumerState<FeaturesHubPage> createState() => _FeaturesHubPageState();
}

class _FeaturesHubPageState extends ConsumerState<FeaturesHubPage> {
  String get _selectedCategoryId =>
      ref.watch(featuresShellTabProvider).selectedCategoryId;

  bool get _isAllTab => _selectedCategoryId == FeatureHubCategories.all.id;

  static String _formatError(Object? error) {
    if (error is Failure) return error.message;
    return error?.toString() ?? 'Unknown error';
  }

  Future<void> _onCatalogTap(FeatureCardUi card) async {
    await addFeatureFromCatalog(context, ref, card);
  }

  Future<void> _confirmRemoveInstance(FeatureInstanceUi item) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Remove instance?'),
        content: Text(
          '"${item.displayTitle}" will be removed from ${_categoryLabel(_selectedCategoryId)}.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: AppColors.error),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Remove'),
          ),
        ],
      ),
    );
    if (ok == true && mounted) {
      await ref.read(featuresHubProvider.notifier).removeInstance(item.id);
    }
  }

  Future<void> _renameInstance(FeatureInstanceUi item) async {
    final controller = TextEditingController(text: item.displayTitle);
    final saved = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Rename'),
        content: TextField(
          controller: controller,
          autofocus: true,
          maxLength: 32,
          decoration: const InputDecoration(
            hintText: 'Instance name',
            border: OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Save'),
          ),
        ],
      ),
    );
    if (saved == true && mounted) {
      await ref
          .read(featuresHubProvider.notifier)
          .renameInstance(item.id, controller.text);
    }
    controller.dispose();
  }

  Future<void> _addInstanceForCurrentTab() async {
    if (_isAllTab) return;
    await ref.read(featuresHubProvider.notifier).addInstanceForCategory(
          _selectedCategoryId,
        );
  }

  void _showInstanceMenu(
    FeatureInstanceUi item,
    int index,
    int count,
    BuildContext anchor,
  ) {
    FeatureCardMenuPopup.show(
      context: context,
      anchorContext: anchor,
      verticalReorder: true,
      canMoveLeft: index > 0,
      canMoveRight: index < count - 1,
      onRename: () => _renameInstance(item),
      onMoveLeft: () => ref.read(featuresHubProvider.notifier).moveInstanceByOffset(
            item.id,
            _selectedCategoryId,
            -1,
          ),
      onMoveRight: () => ref.read(featuresHubProvider.notifier).moveInstanceByOffset(
            item.id,
            _selectedCategoryId,
            1,
          ),
      onRemove: () => _confirmRemoveInstance(item),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(featuresHubProvider);
    final catalog = state.catalogTemplates;
    final instances = state.instancesForCategory(_selectedCategoryId);
    final showLoadError = state.loadError != null && state.catalog.isEmpty;

    ref.listen(featuresHubProvider, (prev, next) {
      if (next.saveError != null && next.saveError != prev?.saveError) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Could not save: ${_formatError(next.saveError)}'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    });

    return Scaffold(
      backgroundColor: Colors.white,
      floatingActionButton: showLoadError || _isAllTab
          ? null
          : FloatingActionButton(
              onPressed: _addInstanceForCurrentTab,
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              tooltip: 'Add ${_categoryLabel(_selectedCategoryId)}',
              child: const Icon(Icons.add_rounded, size: 28),
            ),
      body: _buildBody(
        state: state,
        catalog: catalog,
        instances: instances,
        showLoadError: showLoadError,
      ),
    );
  }

  Widget _buildBody({
    required FeaturesHubState state,
    required List<FeatureCardUi> catalog,
    required List<FeatureInstanceUi> instances,
    required bool showLoadError,
  }) {
    if (state.isLoading && state.catalog.isEmpty) {
      return const Center(
        child: DlLoadingIndicator(
          size: DlLoadingSize.medium,
          onDark: false,
        ),
      );
    }

    if (showLoadError) {
      return FeaturesHubErrorView(
        error: state.loadError,
        isRetrying: state.isLoading,
        onRetry: () => ref.read(featuresHubProvider.notifier).load(),
      );
    }

    if (_isAllTab) {
      return _buildCatalogList(catalog);
    }

    return _buildInstanceList(instances);
  }

  Widget _buildCatalogList(List<FeatureCardUi> catalog) {
    if (catalog.isEmpty) {
      return const Center(
        child: Text(
          'No features available for your account.',
          style: TextStyle(color: AppColors.textSecondary, fontSize: 15),
        ),
      );
    }

    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: () => ref.read(featuresHubProvider.notifier).load(),
      child: ListView.separated(
        padding: const EdgeInsets.only(bottom: 24),
        itemCount: catalog.length,
        separatorBuilder: (_, __) => const FeatureListDivider(),
        itemBuilder: (context, index) {
          final card = catalog[index];
          final tabLabel =
              FeatureHubCategories.categoryForFeatureKey(card.id).label;
          return FeatureListTile.catalog(
            card: card,
            subtitle: 'Tap to add to $tabLabel',
            onTap: () => _onCatalogTap(card),
          );
        },
      ),
    );
  }

  Widget _buildInstanceList(List<FeatureInstanceUi> instances) {
    final schools = ref.watch(myActiveSchoolsProvider).asData?.value ?? const [];
    if (instances.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'No ${_categoryLabel(_selectedCategoryId)} yet',
                style: const TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Go to All and tap a feature, or use + to add one.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: AppColors.textSecondary.withValues(alpha: 0.9),
                  fontSize: 14,
                ),
              ),
            ],
          ),
        ),
      );
    }

    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: () => ref.read(featuresHubProvider.notifier).load(),
      child: ReorderableListView.builder(
        padding: const EdgeInsets.only(bottom: 88),
        itemCount: instances.length,
        onReorder: (oldIndex, newIndex) {
          if (newIndex > oldIndex) newIndex -= 1;
          ref.read(featuresHubProvider.notifier).reorderInstancesInCategory(
                _selectedCategoryId,
                oldIndex,
                newIndex,
              );
        },
        itemBuilder: (context, index) {
          final item = instances[index];
          return Column(
            key: ValueKey(item.id),
            children: [
              FeatureListTile.instance(
                instance: item,
                subtitle: _instanceSubtitle(item, schools),
                onTap: () => openFeatureInstance(context, ref, item),
                onMenuTap: (anchor) =>
                    _showInstanceMenu(item, index, instances.length, anchor),
              ),
              if (index < instances.length - 1) const FeatureListDivider(),
            ],
          );
        },
      ),
    );
  }

  String _categoryLabel(String id) {
    return FeatureHubCategories.tabs
        .firstWhere((t) => t.id == id, orElse: () => FeatureHubCategories.all)
        .label;
  }

  String? _instanceSubtitle(FeatureInstanceUi item, List<MySchoolModel> schools) {
    if (item.featureKey.toLowerCase() != 'school') return null;
    final sid = item.schoolId?.trim();
    if (sid != null && sid.isNotEmpty) {
      for (final s in schools) {
        if (s.schoolId == sid) return 'Last: ${s.name}';
      }
    }
    return 'Schools · offers · marketplace';
  }
}
