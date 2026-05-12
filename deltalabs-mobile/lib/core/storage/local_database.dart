import 'package:drift/drift.dart';
import 'package:drift_flutter/drift_flutter.dart';

// Generated file — run: dart run build_runner build
part 'local_database.g.dart';

// ── Table Definitions ─────────────────────────────────────────────────────────

/// Pending sync operations queue.
class SyncOperations extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get operationId => text().withLength(min: 36, max: 36)();
  TextColumn get entityType => text()();
  TextColumn get entityId => text()();
  TextColumn get operation => text()(); // CREATE | UPDATE | DELETE
  TextColumn get payload => text()(); // JSON string
  IntColumn get retryCount => integer().withDefault(const Constant(0))();
  IntColumn get maxRetries => integer().withDefault(const Constant(5))();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get scheduledAt => dateTime()();
  TextColumn get status => text().withDefault(const Constant('pending'))();
  // pending | processing | failed | completed
}

/// Offline cache metadata.
class CacheEntries extends Table {
  TextColumn get key => text()();
  TextColumn get data => text()(); // JSON string
  DateTimeColumn get cachedAt => dateTime()();
  DateTimeColumn get expiresAt => dateTime().nullable()();
  TextColumn get entityType => text()();

  @override
  Set<Column> get primaryKey => {key};
}

// ── Database ──────────────────────────────────────────────────────────────────

@DriftDatabase(tables: [SyncOperations, CacheEntries])
class LocalDatabase extends _$LocalDatabase {
  LocalDatabase() : super(_openConnection());

  @override
  int get schemaVersion => 1;

  @override
  MigrationStrategy get migration => MigrationStrategy(
        onCreate: (m) => m.createAll(),
        onUpgrade: (m, from, to) async {
          // Add migration steps here as schema evolves
        },
      );

  // ── Sync Operations ────────────────────────────────────────────────────────

  Future<List<SyncOperation>> getPendingSyncOperations() =>
      (select(syncOperations)
            ..where((t) => t.status.equals('pending'))
            ..orderBy([(t) => OrderingTerm.asc(t.createdAt)]))
          .get();

  Future<int> insertSyncOperation(SyncOperationsCompanion entry) =>
      into(syncOperations).insert(entry);

  Future<bool> updateSyncOperation(SyncOperation entry) =>
      update(syncOperations).replace(entry);

  Future<int> deleteSyncOperation(int id) =>
      (delete(syncOperations)..where((t) => t.id.equals(id))).go();

  // ── Cache ──────────────────────────────────────────────────────────────────

  Future<CacheEntry?> getCacheEntry(String key) =>
      (select(cacheEntries)..where((t) => t.key.equals(key)))
          .getSingleOrNull();

  Future<void> upsertCacheEntry(CacheEntriesCompanion entry) =>
      into(cacheEntries).insertOnConflictUpdate(entry);

  Future<int> deleteCacheEntry(String key) =>
      (delete(cacheEntries)..where((t) => t.key.equals(key))).go();

  Future<int> clearExpiredCache() => (delete(cacheEntries)
        ..where((t) => t.expiresAt.isSmallerThanValue(DateTime.now())))
      .go();
}

LazyDatabase _openConnection() {
  return LazyDatabase(() async {
    return driftDatabase(name: 'deltalabs_local.db');
  });
}
