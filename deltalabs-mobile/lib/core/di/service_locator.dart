import 'package:deltalabs_mobile/core/config/app_config.dart';
import 'package:deltalabs_mobile/core/network/api_client.dart';
import 'package:deltalabs_mobile/core/network/interceptors/auth_interceptor.dart';
import 'package:deltalabs_mobile/core/network/interceptors/retry_interceptor.dart';
import 'package:deltalabs_mobile/core/realtime/websocket_manager.dart';
import 'package:deltalabs_mobile/core/storage/local_database.dart';
import 'package:deltalabs_mobile/core/storage/secure_storage.dart';
import 'package:deltalabs_mobile/core/sync/sync_engine.dart';
import 'package:get_it/get_it.dart';

final GetIt sl = GetIt.instance;

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
    sl.registerSingleton<LocalDatabase>(LocalDatabase());
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
