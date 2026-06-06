import 'dart:convert';

import 'package:deltalabs_mobile/core/storage/local_database.dart';
import 'package:deltalabs_mobile/features/features/data/models/feature_shell_tabs_model.dart';
import 'package:drift/drift.dart';

/// Device persistence for pinned Plus category tabs (Telegram-style bar).
class FeatureShellTabsLocalStore {
  FeatureShellTabsLocalStore({required LocalDatabase database}) : _database = database;

  final LocalDatabase _database;
  static const _cacheKey = 'feature_shell_tabs_v1';

  Future<List<String>> loadPinnedCategoryIds() async {
    final entry = await _database.getCacheEntry(_cacheKey);
    if (entry == null) return const [];
    final decoded = jsonDecode(entry.data);
    if (decoded is! Map<String, dynamic>) return const [];
    return FeatureShellTabsModel.fromJson(decoded).pinnedCategoryIds;
  }

  Future<List<String>> savePinnedCategoryIds(List<String> pinnedCategoryIds) async {
    final model = FeatureShellTabsModel(pinnedCategoryIds: pinnedCategoryIds);
    await _database.upsertCacheEntry(
      CacheEntriesCompanion(
        key: const Value(_cacheKey),
        data: Value(jsonEncode(model.toJson())),
        cachedAt: Value(DateTime.now()),
        entityType: const Value('feature_shell_tabs'),
      ),
    );
    return pinnedCategoryIds;
  }
}
