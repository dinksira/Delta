import 'package:deltalabs_mobile/core/di/service_locator.dart';
import 'package:deltalabs_mobile/features/features/data/data_sources/feature_instances_local_store.dart';
import 'package:deltalabs_mobile/features/features/data/data_sources/feature_shell_tabs_local_store.dart';
import 'package:deltalabs_mobile/features/features/domain/entities/feature.dart';
import 'package:deltalabs_mobile/features/features/domain/entities/feature_instance.dart';
import 'package:deltalabs_mobile/features/features/domain/entities/features_layout.dart';
import 'package:deltalabs_mobile/features/features/domain/repositories/features_repository.dart';
import 'package:deltalabs_mobile/features/features/presentation/constants/feature_hub_categories.dart';
import 'package:deltalabs_mobile/features/features/presentation/constants/feature_visuals.dart';
import 'package:deltalabs_mobile/features/features/presentation/models/feature_card_ui.dart';
import 'package:deltalabs_mobile/features/features/presentation/models/feature_instance_ui.dart';
import 'package:deltalabs_mobile/features/features/presentation/providers/features_repository_provider.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';

class FeaturesHubState {
  const FeaturesHubState({
    this.catalog = const [],
    this.instances = const [],
    this.pinnedCategoryIds = const [],
    this.orderKeys = const [],
    this.hiddenKeys = const [],
    this.labels = const {},
    this.query = '',
    this.isLoading = false,
    this.loadError,
    this.saveError,
    this.isSaving = false,
  });

  final List<Feature> catalog;
  final List<FeatureInstance> instances;

  /// Category tabs shown in the Plus bar (excludes [FeatureHubCategories.all]).
  final List<String> pinnedCategoryIds;
  final List<String> orderKeys;
  final List<String> hiddenKeys;
  final Map<String, String> labels;
  final String query;
  final bool isLoading;
  final Object? loadError;
  final Object? saveError;
  final bool isSaving;

  FeaturesHubState copyWith({
    List<Feature>? catalog,
    List<FeatureInstance>? instances,
    List<String>? pinnedCategoryIds,
    List<String>? orderKeys,
    List<String>? hiddenKeys,
    Map<String, String>? labels,
    String? query,
    bool? isLoading,
    Object? loadError,
    Object? saveError,
    bool? isSaving,
    bool clearLoadError = false,
    bool clearSaveError = false,
  }) {
    return FeaturesHubState(
      catalog: catalog ?? this.catalog,
      instances: instances ?? this.instances,
      pinnedCategoryIds: pinnedCategoryIds ?? this.pinnedCategoryIds,
      orderKeys: orderKeys ?? this.orderKeys,
      hiddenKeys: hiddenKeys ?? this.hiddenKeys,
      labels: labels ?? this.labels,
      query: query ?? this.query,
      isLoading: isLoading ?? this.isLoading,
      loadError: clearLoadError ? null : (loadError ?? this.loadError),
      saveError: clearSaveError ? null : (saveError ?? this.saveError),
      isSaving: isSaving ?? this.isSaving,
    );
  }

  Map<String, Feature> get catalogByKey {
    return {for (final f in catalog) f.featureKey: f};
  }

  Set<String> get hiddenSet => hiddenKeys.toSet();

  String catalogTitle(String key) {
    final custom = labels[key]?.trim();
    if (custom != null && custom.isNotEmpty) return custom;
    final feature = catalogByKey[key];
    if (feature != null && feature.title.isNotEmpty) return feature.title;
    return key.replaceAll('_', ' ').replaceAllMapped(
          RegExp(r'\b\w'),
          (m) => m.group(0)!.toUpperCase(),
        );
  }

  /// Catalog templates shown on the **All** tab.
  List<FeatureCardUi> get catalogTemplates {
    final q = query.trim().toLowerCase();
    final byKey = catalogByKey;
    final hidden = hiddenSet;
    final ordered = <FeatureCardUi>[];

    void addKey(String id) {
      final f = byKey[id];
      if (f == null || hidden.contains(id)) return;
      final title = catalogTitle(id);
      if (q.isNotEmpty &&
          !'$title ${f.description} $id'.toLowerCase().contains(q)) {
        return;
      }
      ordered.add(
        FeatureCardUi(
          feature: f,
          visuals: FeatureVisuals.forKey(id),
          displayTitle: title,
        ),
      );
    }

    for (final id in orderKeys) {
      addKey(id);
    }
    for (final f in catalog) {
      if (ordered.any((c) => c.id == f.featureKey)) continue;
      addKey(f.featureKey);
    }
    return ordered;
  }

  List<FeatureInstanceUi> instancesForCategory(String categoryId) {
    if (categoryId == FeatureHubCategories.all.id) return const [];
    return instances
        .where((i) => FeatureHubCategories.matchesCategory(categoryId, i.featureKey))
        .map((instance) => _instanceUi(instance))
        .whereType<FeatureInstanceUi>()
        .toList();
  }

  FeatureInstanceUi? instanceUiForId(String instanceId) {
    final id = instanceId.trim();
    if (id.isEmpty) return null;
    for (final instance in instances) {
      if (instance.id == id) return _instanceUi(instance);
    }
    return null;
  }

  FeatureInstanceUi? _instanceUi(FeatureInstance instance) {
    final feature = catalogByKey[instance.featureKey];
    if (feature == null) return null;
    return FeatureInstanceUi(
      instance: instance,
      feature: feature,
      displayTitle: _instanceTitle(instance, feature.featureKey),
    );
  }

  String _instanceTitle(FeatureInstance instance, String featureKey) {
    final custom = instance.label?.trim();
    if (custom != null && custom.isNotEmpty) return custom;
    return catalogTitle(featureKey);
  }

  Map<String, int> get instanceTabCounts {
    final counts = <String, int>{
      FeatureHubCategories.all.id: catalogTemplates.length,
    };
    for (final id in pinnedCategoryIds) {
      counts[id] = instancesForCategory(id).length;
    }
    return counts;
  }

  List<FeatureHubCategory> get pinnedCategories {
    return pinnedCategoryIds
        .map((id) {
          for (final tab in FeatureHubCategories.tabs) {
            if (tab.id == id && tab.id != FeatureHubCategories.all.id) {
              return tab;
            }
          }
          return null;
        })
        .whereType<FeatureHubCategory>()
        .toList(growable: false);
  }

  bool isCategoryPinned(String categoryId) {
    if (categoryId == FeatureHubCategories.all.id) return true;
    return pinnedCategoryIds.contains(categoryId);
  }

  List<FeatureCardUi> get visibleCards => catalogTemplates;

  List<FeatureCardUi> get hiddenCards {
    return hiddenKeys
        .map((id) {
          final f = catalogByKey[id];
          if (f == null) return null;
          return FeatureCardUi(
            feature: f,
            visuals: FeatureVisuals.forKey(id),
            displayTitle: catalogTitle(id),
          );
        })
        .whereType<FeatureCardUi>()
        .toList();
  }
}

class FeaturesHubNotifier extends Notifier<FeaturesHubState> {
  FeaturesRepository get _repo => ref.read(featuresRepositoryProvider);
  FeatureInstancesLocalStore get _instancesStore => sl<FeatureInstancesLocalStore>();
  FeatureShellTabsLocalStore get _shellTabsStore => sl<FeatureShellTabsLocalStore>();
  static const _uuid = Uuid();

  @override
  FeaturesHubState build() {
    Future.microtask(load);
    return const FeaturesHubState(isLoading: true);
  }

  Future<void> load() async {
    state = state.copyWith(
      isLoading: true,
      clearLoadError: true,
      clearSaveError: true,
    );
    try {
      final catalog = await _repo.fetchFeatures();
      final instances = await _instancesStore.load();
      var pinnedCategoryIds = await _shellTabsStore.loadPinnedCategoryIds();
      pinnedCategoryIds = _sanitizePinnedCategoryIds(pinnedCategoryIds);
      if (pinnedCategoryIds.isEmpty && instances.isNotEmpty) {
        pinnedCategoryIds = _pinnedFromInstances(instances);
        await _shellTabsStore.savePinnedCategoryIds(pinnedCategoryIds);
      }

      if (catalog.isEmpty) {
        state = state.copyWith(
          catalog: catalog,
          instances: instances,
          pinnedCategoryIds: pinnedCategoryIds,
          orderKeys: const [],
          hiddenKeys: const [],
          labels: const {},
          isLoading: false,
        );
        return;
      }

      var layout = FeaturesLayout.empty;
      try {
        layout = await _repo.fetchLayout();
      } catch (_) {
        layout = FeaturesLayout(
          orderKeys: catalog.map((f) => f.featureKey).toList(),
          hiddenKeys: const [],
          labels: const {},
        );
      }

      state = state.copyWith(
        catalog: catalog,
        instances: instances,
        pinnedCategoryIds: pinnedCategoryIds,
        orderKeys: List<String>.from(layout.orderKeys),
        hiddenKeys: List<String>.from(layout.hiddenKeys),
        labels: Map<String, String>.from(layout.labels),
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, loadError: e);
    }
  }

  Future<String?> addInstance(String featureKey) async {
    final key = featureKey.toLowerCase();
    final feature = state.catalogByKey[key];
    if (feature == null) return null;

    final categoryId = FeatureHubCategories.categoryIdForFeatureKey(key);
    await pinCategory(categoryId);
    final label = _defaultInstanceLabel(key);
    final instance = FeatureInstance(
      id: _uuid.v4(),
      featureKey: key,
      categoryId: categoryId,
      label: label,
      createdAt: DateTime.now(),
    );

    final next = [...state.instances, instance];
    await _persistInstances(next);
    return instance.id;
  }

  Future<String?> addInstanceForCategory(String categoryId) async {
    final featureKey = FeatureHubCategories.primaryFeatureKeyForCategory(categoryId);
    if (featureKey == null) return null;
    return addInstance(featureKey);
  }

  String _defaultInstanceLabel(String featureKey) {
    final base = state.catalogTitle(featureKey);
    final sameType =
        state.instances.where((i) => i.featureKey.toLowerCase() == featureKey).length;
    if (sameType == 0) return base;
    return '$base ${sameType + 1}';
  }

  Future<void> removeInstance(String instanceId) async {
    final next =
        state.instances.where((i) => i.id != instanceId).toList(growable: false);
    await _persistInstances(next);
  }

  Future<void> renameInstance(String instanceId, String name) async {
    final trimmed = name.trim();
    final next = state.instances.map((i) {
      if (i.id != instanceId) return i;
      if (trimmed.isEmpty) return i.copyWith(clearLabel: true);
      final label = trimmed.length > 32 ? trimmed.substring(0, 32) : trimmed;
      return i.copyWith(label: label);
    }).toList(growable: false);
    await _persistInstances(next);
  }

  Future<void> bindInstanceSchool(String instanceId, String schoolId) async {
    final next = state.instances.map((i) {
      if (i.id != instanceId) return i;
      return i.copyWith(schoolId: schoolId);
    }).toList(growable: false);
    await _persistInstances(next);
  }

  Future<void> saveInstanceLocation(String instanceId, String lastLocation) async {
    final trimmed = lastLocation.trim();
    if (trimmed.isEmpty) return;

    var changed = false;
    final next = state.instances.map((i) {
      if (i.id != instanceId) return i;
      if (i.lastLocation == trimmed) return i;
      changed = true;
      return i.copyWith(lastLocation: trimmed);
    }).toList(growable: false);

    if (!changed) return;
    await _persistInstances(next);
  }

  FeatureInstance? instanceById(String instanceId) {
    for (final i in state.instances) {
      if (i.id == instanceId) return i;
    }
    return null;
  }

  Future<void> reorderInstancesInCategory(
    String categoryId,
    int oldIndex,
    int newIndex,
  ) async {
    final visible = state.instancesForCategory(categoryId);
    if (oldIndex < 0 ||
        newIndex < 0 ||
        oldIndex >= visible.length ||
        newIndex >= visible.length ||
        oldIndex == newIndex) {
      return;
    }

    final movedId = visible[oldIndex].id;
    final targetId = visible[newIndex].id;
    final all = List<FeatureInstance>.from(state.instances);
    final oldGlobal = all.indexWhere((i) => i.id == movedId);
    final newGlobal = all.indexWhere((i) => i.id == targetId);
    if (oldGlobal < 0 || newGlobal < 0) return;

    final item = all.removeAt(oldGlobal);
    all.insert(newGlobal, item);
    await _persistInstances(all);
  }

  Future<void> moveInstanceByOffset(String instanceId, String categoryId, int delta) async {
    final visible = state.instancesForCategory(categoryId);
    final idx = visible.indexWhere((i) => i.id == instanceId);
    if (idx < 0) return;
    final next = idx + delta;
    if (next < 0 || next >= visible.length) return;
    await reorderInstancesInCategory(categoryId, idx, next);
  }

  Future<void> _persistInstances(List<FeatureInstance> instances) async {
    final previous = state.instances;
    state = state.copyWith(instances: instances, isSaving: true, clearSaveError: true);
    try {
      final saved = await _instancesStore.save(instances);
      state = state.copyWith(instances: saved, isSaving: false);
    } catch (e) {
      state = state.copyWith(instances: previous, isSaving: false, saveError: e);
    }
  }

  void setQuery(String query) {
    state = state.copyWith(query: query);
  }

  List<String> _ensureOrder() {
    if (state.orderKeys.isNotEmpty) return List<String>.from(state.orderKeys);
    return state.catalog.map((f) => f.featureKey).toList();
  }

  Future<void> _persistLayout({
    List<String>? orderKeys,
    List<String>? hiddenKeys,
    Map<String, String>? labels,
  }) async {
    if (state.catalog.isEmpty) return;

    final nextOrder = orderKeys ?? _ensureOrder();
    final allowed = state.catalog.map((f) => f.featureKey).toSet();
    final cleanOrder = nextOrder.where(allowed.contains).toList();
    final cleanHidden = (hiddenKeys ?? state.hiddenKeys).where(allowed.contains).toList();
    final cleanLabels = Map<String, String>.from(labels ?? state.labels)
      ..removeWhere((key, _) => !allowed.contains(key));

    final previousOrder = List<String>.from(state.orderKeys);
    final previousHidden = List<String>.from(state.hiddenKeys);
    final previousLabels = Map<String, String>.from(state.labels);

    state = state.copyWith(
      orderKeys: cleanOrder,
      hiddenKeys: cleanHidden,
      labels: cleanLabels,
      isSaving: true,
      clearSaveError: true,
    );

    try {
      final saved = await _repo.saveLayout(
        orderKeys: cleanOrder,
        hiddenKeys: cleanHidden,
        labels: cleanLabels,
      );
      state = state.copyWith(
        orderKeys: List<String>.from(saved.orderKeys),
        hiddenKeys: List<String>.from(saved.hiddenKeys),
        labels: Map<String, String>.from(saved.labels),
        isSaving: false,
      );
    } catch (e) {
      state = state.copyWith(
        orderKeys: previousOrder,
        hiddenKeys: previousHidden,
        labels: previousLabels,
        isSaving: false,
        saveError: e,
      );
    }
  }

  Future<void> pinCategory(String categoryId) async {
    final id = categoryId.trim();
    if (id.isEmpty || id == FeatureHubCategories.all.id) return;
    if (state.pinnedCategoryIds.contains(id)) return;

    final next = [...state.pinnedCategoryIds, id];
    await _persistPinnedCategories(next);
  }

  Future<bool> unpinCategory(String categoryId) async {
    final id = categoryId.trim();
    if (id.isEmpty || id == FeatureHubCategories.all.id) return false;

    final next =
        state.pinnedCategoryIds.where((c) => c != id).toList(growable: false);
    if (next.length == state.pinnedCategoryIds.length) return false;
    await _persistPinnedCategories(next);
    return true;
  }

  Future<void> reorderPinnedCategories(int oldIndex, int newIndex) async {
    final pinned = List<String>.from(state.pinnedCategoryIds);
    if (oldIndex < 0 ||
        newIndex < 0 ||
        oldIndex >= pinned.length ||
        newIndex >= pinned.length ||
        oldIndex == newIndex) {
      return;
    }

    final item = pinned.removeAt(oldIndex);
    pinned.insert(newIndex, item);
    await _persistPinnedCategories(pinned);
  }

  Future<void> movePinnedCategoryByOffset(String categoryId, int delta) async {
    final pinned = state.pinnedCategoryIds;
    final idx = pinned.indexOf(categoryId);
    if (idx < 0) return;
    final next = idx + delta;
    if (next < 0 || next >= pinned.length) return;
    await reorderPinnedCategories(idx, next);
  }

  List<String> _sanitizePinnedCategoryIds(List<String> raw) {
    const allowed = FeatureHubCategories.tabs;
    final seen = <String>{};
    final clean = <String>[];
    for (final id in raw) {
      if (id == FeatureHubCategories.all.id) continue;
      if (seen.contains(id)) continue;
      final exists = allowed.any((t) => t.id == id && t.id != FeatureHubCategories.all.id);
      if (!exists) continue;
      seen.add(id);
      clean.add(id);
    }
    return clean;
  }

  List<String> _pinnedFromInstances(List<FeatureInstance> instances) {
    final seen = <String>{};
    final pinned = <String>[];
    for (final instance in instances) {
      final id = instance.categoryId.trim();
      if (id.isEmpty || id == FeatureHubCategories.all.id || seen.contains(id)) {
        continue;
      }
      final exists = FeatureHubCategories.tabs.any((t) => t.id == id);
      if (!exists) continue;
      seen.add(id);
      pinned.add(id);
    }
    return pinned;
  }

  Future<void> _persistPinnedCategories(List<String> pinnedCategoryIds) async {
    final previous = state.pinnedCategoryIds;
    final clean = _sanitizePinnedCategoryIds(pinnedCategoryIds);
    state = state.copyWith(pinnedCategoryIds: clean, isSaving: true, clearSaveError: true);
    try {
      final saved = await _shellTabsStore.savePinnedCategoryIds(clean);
      state = state.copyWith(
        pinnedCategoryIds: _sanitizePinnedCategoryIds(saved),
        isSaving: false,
      );
    } catch (e) {
      state = state.copyWith(
        pinnedCategoryIds: previous,
        isSaving: false,
        saveError: e,
      );
    }
  }

  Future<void> setHidden(String id, bool hide) async {
    final hidden = Set<String>.from(state.hiddenKeys);
    if (hide) {
      hidden.add(id);
    } else {
      hidden.remove(id);
    }
    final order = _ensureOrder();
    if (!order.contains(id)) order.add(id);
    await _persistLayout(orderKeys: order, hiddenKeys: hidden.toList());
  }
}

final featuresHubProvider =
    NotifierProvider<FeaturesHubNotifier, FeaturesHubState>(
  FeaturesHubNotifier.new,
);
