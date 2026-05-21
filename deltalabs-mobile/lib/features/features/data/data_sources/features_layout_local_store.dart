import 'dart:convert';

import 'package:deltalabs_mobile/core/storage/local_database.dart';
import 'package:deltalabs_mobile/features/features/data/models/features_layout_model.dart';
import 'package:drift/drift.dart';

/// Device cache for features layout when `POST/PUT /features/layout` is unavailable.
class FeaturesLayoutLocalStore {
  FeaturesLayoutLocalStore({required LocalDatabase database})
      : _database = database;

  final LocalDatabase _database;
  static const _cacheKey = 'features_layout_v1';

  Future<FeaturesLayoutModel?> load() async {
    final entry = await _database.getCacheEntry(_cacheKey);
    if (entry == null) return null;
    final decoded = jsonDecode(entry.data);
    if (decoded is! Map<String, dynamic>) return null;
    return FeaturesLayoutModel.fromJson(decoded);
  }

  Future<FeaturesLayoutModel> save({
    required List<String> orderKeys,
    required List<String> hiddenKeys,
    required Map<String, String> labels,
  }) async {
    final model = FeaturesLayoutModel(
      orderKeys: orderKeys,
      hiddenKeys: hiddenKeys,
      labels: labels,
    );
    await _database.upsertCacheEntry(
      CacheEntriesCompanion(
        key: const Value(_cacheKey),
        data: Value(jsonEncode(model.toUpsertJson())),
        cachedAt: Value(DateTime.now()),
        entityType: const Value('features_layout'),
      ),
    );
    return model;
  }
}
