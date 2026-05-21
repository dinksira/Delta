import 'package:deltalabs_mobile/features/features/domain/entities/feature.dart';
import 'package:deltalabs_mobile/features/features/domain/entities/features_layout.dart';
import 'package:deltalabs_mobile/features/features/domain/repositories/features_repository.dart';
import 'package:deltalabs_mobile/features/features/presentation/constants/feature_visuals.dart';
import 'package:deltalabs_mobile/features/features/presentation/models/feature_card_ui.dart';
import 'package:deltalabs_mobile/features/features/presentation/providers/features_repository_provider.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class FeaturesHubState {
  const FeaturesHubState({
    this.catalog = const [],
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

  String displayTitle(String key) {
    final custom = labels[key]?.trim();
    if (custom != null && custom.isNotEmpty) return custom;
    final feature = catalogByKey[key];
    if (feature != null && feature.title.isNotEmpty) return feature.title;
    return key.replaceAll('_', ' ').replaceAllMapped(
          RegExp(r'\b\w'),
          (m) => m.group(0)!.toUpperCase(),
        );
  }

  List<FeatureCardUi> get visibleCards {
    final q = query.trim().toLowerCase();
    final byKey = catalogByKey;
    final hidden = hiddenSet;
    final ordered = <FeatureCardUi>[];

    void addKey(String id) {
      final f = byKey[id];
      if (f == null || hidden.contains(id)) return;
      final title = displayTitle(id);
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

  List<FeatureCardUi> get hiddenCards {
    return hiddenKeys
        .map((id) {
          final f = catalogByKey[id];
          if (f == null) return null;
          return FeatureCardUi(
            feature: f,
            visuals: FeatureVisuals.forKey(id),
            displayTitle: displayTitle(id),
          );
        })
        .whereType<FeatureCardUi>()
        .toList();
  }
}

class FeaturesHubNotifier extends Notifier<FeaturesHubState> {
  FeaturesRepository get _repo => ref.read(featuresRepositoryProvider);

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
      if (catalog.isEmpty) {
        state = state.copyWith(
          catalog: catalog,
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
        // Fall back to catalog order when layout endpoint is unavailable.
        layout = FeaturesLayout(
          orderKeys: catalog.map((f) => f.featureKey).toList(),
          hiddenKeys: const [],
          labels: const {},
        );
      }

      state = state.copyWith(
        catalog: catalog,
        orderKeys: List<String>.from(layout.orderKeys),
        hiddenKeys: List<String>.from(layout.hiddenKeys),
        labels: Map<String, String>.from(layout.labels),
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, loadError: e);
    }
  }

  void setQuery(String query) {
    state = state.copyWith(query: query);
  }

  List<String> _ensureOrder() {
    if (state.orderKeys.isNotEmpty) return List<String>.from(state.orderKeys);
    return state.catalog.map((f) => f.featureKey).toList();
  }

  Future<void> _persist({
    List<String>? orderKeys,
    List<String>? hiddenKeys,
    Map<String, String>? labels,
  }) async {
    if (state.catalog.isEmpty) return;

    final nextOrder = orderKeys ?? _ensureOrder();
    final allowed = state.catalog.map((f) => f.featureKey).toSet();
    final cleanOrder = nextOrder.where(allowed.contains).toList();
    final cleanHidden = (hiddenKeys ?? state.hiddenKeys)
        .where(allowed.contains)
        .toList();
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

  Future<void> reorder(int oldIndex, int newIndex) async {
    final visibleIds = state.visibleCards.map((c) => c.id).toList();
    if (oldIndex < 0 ||
        newIndex < 0 ||
        oldIndex >= visibleIds.length ||
        newIndex >= visibleIds.length ||
        oldIndex == newIndex) {
      return;
    }
    final activeId = visibleIds[oldIndex];
    final order = _ensureOrder();
    final oldOrderIdx = order.indexOf(activeId);
    final targetId = visibleIds[newIndex];
    final newOrderIdx = order.indexOf(targetId);
    if (oldOrderIdx < 0 || newOrderIdx < 0) return;

    final next = List<String>.from(order);
    next.removeAt(oldOrderIdx);
    next.insert(newOrderIdx, activeId);
    await _persist(orderKeys: next);
  }

  Future<void> moveByOffset(String id, int delta) async {
    final visible = state.visibleCards.map((c) => c.id).toList();
    final idx = visible.indexOf(id);
    if (idx < 0) return;
    final next = idx + delta;
    if (next < 0 || next >= visible.length) return;
    await reorder(idx, next);
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
    await _persist(orderKeys: order, hiddenKeys: hidden.toList());
  }

  Future<void> rename(String id, String name) async {
    final nextLabels = Map<String, String>.from(state.labels);
    final trimmed = name.trim();
    if (trimmed.isEmpty) {
      nextLabels.remove(id);
    } else {
      nextLabels[id] = trimmed.length > 32 ? trimmed.substring(0, 32) : trimmed;
    }
    await _persist(labels: nextLabels);
  }
}

final featuresHubProvider =
    NotifierProvider<FeaturesHubNotifier, FeaturesHubState>(
  FeaturesHubNotifier.new,
);
