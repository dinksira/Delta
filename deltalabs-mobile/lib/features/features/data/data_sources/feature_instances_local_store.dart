import 'dart:convert';

import 'package:deltalabs_mobile/core/storage/local_database.dart';
import 'package:deltalabs_mobile/features/features/data/models/feature_instances_model.dart';
import 'package:deltalabs_mobile/features/features/domain/entities/feature_instance.dart';
import 'package:drift/drift.dart';

/// Device persistence for feature workspace instances (shortcuts per tab).
class FeatureInstancesLocalStore {
  FeatureInstancesLocalStore({required LocalDatabase database}) : _database = database;

  final LocalDatabase _database;
  static const _cacheKey = 'feature_instances_v1';

  Future<List<FeatureInstance>> load() async {
    final entry = await _database.getCacheEntry(_cacheKey);
    if (entry == null) return const [];
    final decoded = jsonDecode(entry.data);
    if (decoded is! Map<String, dynamic>) return const [];
    return FeatureInstancesModel.fromJson(decoded).instances;
  }

  Future<List<FeatureInstance>> save(List<FeatureInstance> instances) async {
    final model = FeatureInstancesModel(instances: instances);
    await _database.upsertCacheEntry(
      CacheEntriesCompanion(
        key: const Value(_cacheKey),
        data: Value(jsonEncode(model.toJson())),
        cachedAt: Value(DateTime.now()),
        entityType: const Value('feature_instances'),
      ),
    );
    return instances;
  }
}
