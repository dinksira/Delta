import 'dart:async';
import 'dart:convert';

import 'package:deltalabs_mobile/core/logging/app_logger.dart';
import 'package:deltalabs_mobile/core/network/api_client.dart';
import 'package:deltalabs_mobile/core/storage/local_database.dart';
import 'package:drift/drift.dart';
import 'package:uuid/uuid.dart';

enum SyncStatus { idle, syncing, error }

/// Offline-first sync engine.
/// Queues mutations locally and flushes them to the server when online.
/// Implements optimistic UI by applying changes locally before server confirmation.
class SyncEngine {
  SyncEngine({
    required ApiClient apiClient,
    required LocalDatabase database,
  })  : _apiClient = apiClient,
        _database = database;

  final ApiClient _apiClient;
  final LocalDatabase _database;
  final _uuid = const Uuid();

  Timer? _syncTimer;
  bool _isSyncing = false;

  static const Duration _syncInterval = Duration(seconds: 30);

  /// Start periodic background sync.
  void startPeriodicSync() {
    _syncTimer?.cancel();
    _syncTimer = Timer.periodic(_syncInterval, (_) => flush());
  }

  void stopPeriodicSync() {
    _syncTimer?.cancel();
  }

  /// Enqueue a mutation for later sync.
  /// Returns the local operation ID for optimistic UI tracking.
  Future<String> enqueue({
    required String entityType,
    required String entityId,
    required String operation, // CREATE | UPDATE | DELETE
    required Map<String, dynamic> payload,
  }) async {
    final operationId = _uuid.v4();
    final now = DateTime.now();

    await _database.insertSyncOperation(
      SyncOperationsCompanion.insert(
        operationId: operationId,
        entityType: entityType,
        entityId: entityId,
        operation: operation,
        payload: jsonEncode(payload),
        createdAt: now,
        scheduledAt: now,
        status: const Value('pending'),
      ),
    );

    AppLogger.debug('Enqueued sync operation: $operationId ($operation $entityType/$entityId)');
    return operationId;
  }

  /// Flush all pending operations to the server.
  Future<void> flush() async {
    if (_isSyncing) return;
    _isSyncing = true;

    try {
      final pending = await _database.getPendingSyncOperations();
      if (pending.isEmpty) return;

      AppLogger.info('Flushing ${pending.length} pending sync operations');

      for (final op in pending) {
        await _processOperation(op);
      }
    } catch (e) {
      AppLogger.error('Sync flush error', error: e);
    } finally {
      _isSyncing = false;
    }
  }

  Future<void> _processOperation(SyncOperation op) async {
    try {
      // Mark as processing
      await _database.updateSyncOperation(
        op.copyWith(status: 'processing'),
      );

      final payload = jsonDecode(op.payload) as Map<String, dynamic>;

      await _apiClient.post(
        '/sync',
        data: {
          'operation_id': op.operationId,
          'entity_type': op.entityType,
          'entity_id': op.entityId,
          'operation': op.operation,
          'payload': payload,
          'created_at': op.createdAt.toIso8601String(),
        },
      );

      // Success — remove from queue
      await _database.deleteSyncOperation(op.id);
      AppLogger.debug('Sync operation completed: ${op.operationId}');
    } catch (e) {
      final newRetryCount = op.retryCount + 1;

      if (newRetryCount >= op.maxRetries) {
        await _database.updateSyncOperation(
          op.copyWith(status: 'failed', retryCount: newRetryCount),
        );
        AppLogger.error(
          'Sync operation permanently failed: ${op.operationId}',
          error: e,
        );
      } else {
        // Exponential backoff for retry
        final nextRetry = DateTime.now().add(
          Duration(minutes: 1 << newRetryCount),
        );
        await _database.updateSyncOperation(
          op.copyWith(
            status: 'pending',
            retryCount: newRetryCount,
            scheduledAt: nextRetry,
          ),
        );
        AppLogger.warning(
          'Sync operation failed, will retry at $nextRetry: ${op.operationId}',
          error: e,
        );
      }
    }
  }

  void dispose() {
    stopPeriodicSync();
  }
}
