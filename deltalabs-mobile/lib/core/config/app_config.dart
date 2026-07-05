import 'package:deltalabs_mobile/core/config/environment.dart';

/// Central application configuration.
/// Populated at bootstrap time based on the active [Environment].
class AppConfig {
  AppConfig._();

  static late AppConfig _instance;
  static AppConfig get instance => _instance;

  late final Environment environment;
  late final String apiBaseUrl;
  late final String wsBaseUrl;
  late final String cdnBaseUrl;
  /// Public web app origin — hosts `/mock-feed-videos/*` static assets.
  late final String webAppBaseUrl;
  late final bool enableLogging;
  late final bool enableCrashReporting;
  late final bool enableAnalytics;
  late final int connectTimeoutMs;
  late final int receiveTimeoutMs;
  late final int maxRetryAttempts;

  /// Override at run time, e.g.
  /// `flutter run --dart-define=API_BASE_URL=http://10.0.2.2:8081/v1`
  /// Android emulator → `10.0.2.2`; iOS simulator → `127.0.0.1`; physical device → your PC LAN IP.
  static const String _apiBaseUrlOverride = String.fromEnvironment('API_BASE_URL');
  static const String _wsBaseUrlOverride = String.fromEnvironment('WS_BASE_URL');
  static const String _cdnBaseUrlOverride = String.fromEnvironment('CDN_BASE_URL');

  /// Local FastAPI default when developing against `uvicorn … --port 8081`.
  static const String _localDevApiBaseUrl = 'http://10.0.2.2:8081/v1';
  static const String _localDevWsBaseUrl = 'ws://10.0.2.2:8081/ws';
  static const String _localDevCdnBaseUrl = 'http://10.0.2.2:8081';

  static Future<void> initialize(Environment env) async {
    _instance = AppConfig._();
    _instance.environment = env;

    switch (env) {
      case Environment.development:
        _instance.apiBaseUrl = _resolveUrl(
          _apiBaseUrlOverride,
          _localDevApiBaseUrl,
        );
        _instance.wsBaseUrl = _resolveUrl(
          _wsBaseUrlOverride,
          _localDevWsBaseUrl,
        );
        _instance.cdnBaseUrl = _resolveUrl(
          _cdnBaseUrlOverride,
          _localDevCdnBaseUrl,
        );
        _instance.webAppBaseUrl = 'https://delta-labs-pi.vercel.app';
        _instance.enableLogging = true;
        _instance.enableCrashReporting = false;
        _instance.enableAnalytics = false;
        _instance.connectTimeoutMs = 30000;
        _instance.receiveTimeoutMs = 30000;
        _instance.maxRetryAttempts = 3;

      case Environment.staging:
        _instance.apiBaseUrl = _resolveUrl(
          _apiBaseUrlOverride,
          'https://api.staging.deltalabs.io/v1',
        );
        _instance.wsBaseUrl = _resolveUrl(
          _wsBaseUrlOverride,
          'wss://ws.staging.deltalabs.io',
        );
        _instance.cdnBaseUrl = _resolveUrl(
          _cdnBaseUrlOverride,
          'https://cdn.staging.deltalabs.io',
        );
        _instance.webAppBaseUrl = 'https://staging.deltalabs.io';
        _instance.enableLogging = true;
        _instance.enableCrashReporting = true;
        _instance.enableAnalytics = false;
        _instance.connectTimeoutMs = 20000;
        _instance.receiveTimeoutMs = 20000;
        _instance.maxRetryAttempts = 3;

      case Environment.production:
        _instance.apiBaseUrl = _resolveUrl(
          _apiBaseUrlOverride,
          'https://api.deltalabs.io/v1',
        );
        _instance.wsBaseUrl = _resolveUrl(
          _wsBaseUrlOverride,
          'wss://ws.deltalabs.io',
        );
        _instance.cdnBaseUrl = _resolveUrl(
          _cdnBaseUrlOverride,
          'https://cdn.deltalabs.io',
        );
        _instance.webAppBaseUrl = 'https://deltalabs.io';
        _instance.enableLogging = false;
        _instance.enableCrashReporting = true;
        _instance.enableAnalytics = true;
        _instance.connectTimeoutMs = 15000;
        _instance.receiveTimeoutMs = 15000;
        _instance.maxRetryAttempts = 5;
    }
  }

  static String _resolveUrl(String override, String fallback) {
    final trimmed = override.trim();
    return trimmed.isNotEmpty ? trimmed : fallback;
  }
}
