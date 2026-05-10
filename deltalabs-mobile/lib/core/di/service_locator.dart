import 'package:get_it/get_it.dart';

import '../config/app_config.dart';
import '../network/api_client.dart';
import '../network/interceptors/auth_interceptor.dart';
import '../network/interceptors/retry_interceptor.dart';
import '../storage/secure_storage.dart';
import '../storage/local_database.dart';
import '../realtime/websocket_manager.dart';
import '../sync/sync_engine.dart';

/// Global service locator instance.
final GetIt sl = GetIt.instance;

/// Registers all application-level singletons and factories.
/// Called once during [bootstrap] before the app widget tree is built.
class ServiceLocator {
  ServiceLocator._();

  static Future<void> initialize() async {
    await _registerCore();
    await _registerNetwork();
    await _registerStorage();
    await _registerRealtime();
    await _registerSync();
  }

  static Future<void> _registerCore() async {
    // AppConfig is already initialized before this point
    sl.registerSingleton<AppConfig>(AppConfig.instance);
  }

  static Future<void> _registerNetwork() async {
    sl.registerSingleton<SecureStorage>(SecureStorage());

    sl.registerSingleton<AuthInterceptor>(
      AuthInterceptor(secureStorage: sl<SecureStorage>()),
    );

    sl.registerSingleton<RetryInterceptor>(
      RetryInterceptor(maxRetries: AppConfig.instance.maxRetryAttempts),
    );

    sl.registerSingleton<ApiClient>(
      ApiClient(
        baseUrl: AppConfig.instance.apiBaseUrl,
        authInterceptor: sl<AuthInterceptor>(),
        retryInterceptor: sl<RetryInterceptor>(),
        connectTimeoutMs: AppConfig.instance.connectTimeoutMs,
        receiveTimeoutMs: AppConfig.instance.receiveTimeoutMs,
      ),
    );
  }

  static Future<void> _registerStorage() async {
    final db = LocalDatabase();
    sl.registerSingleton<LocalDatabase>(db);
  }

  static Future<void> _registerRealtime() async {
    sl.registerSingleton<WebSocketManager>(
      WebSocketManager(wsBaseUrl: AppConfig.instance.wsBaseUrl),
    );
  }

  static Future<void> _registerSync() async {
    sl.registerSingleton<SyncEngine>(
      SyncEngine(
        apiClient: sl<ApiClient>(),
        database: sl<LocalDatabase>(),
      ),
    );
  }
}
