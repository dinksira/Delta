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

  static Future<void> initialize(Environment env) async {
    _instance = AppConfig._();
    _instance.environment = env;

    switch (env) {
      case Environment.development:
        _instance.apiBaseUrl = 'https://delta-labs.onrender.com/v1';
        _instance.wsBaseUrl = 'wss://delta-labs.onrender.com/ws';
        _instance.cdnBaseUrl = 'https://delta-labs.onrender.com';
        _instance.webAppBaseUrl = 'https://delta-labs-pi.vercel.app';
        _instance.enableLogging = true;
        _instance.enableCrashReporting = false;
        _instance.enableAnalytics = false;
        _instance.connectTimeoutMs = 30000;
        _instance.receiveTimeoutMs = 30000;
        _instance.maxRetryAttempts = 3;

      case Environment.staging:
        _instance.apiBaseUrl = 'https://api.staging.deltalabs.io/v1';
        _instance.wsBaseUrl = 'wss://ws.staging.deltalabs.io';
        _instance.cdnBaseUrl = 'https://cdn.staging.deltalabs.io';
        _instance.webAppBaseUrl = 'https://staging.deltalabs.io';
        _instance.enableLogging = true;
        _instance.enableCrashReporting = true;
        _instance.enableAnalytics = false;
        _instance.connectTimeoutMs = 20000;
        _instance.receiveTimeoutMs = 20000;
        _instance.maxRetryAttempts = 3;

      case Environment.production:
        _instance.apiBaseUrl = 'https://api.deltalabs.io/v1';
        _instance.wsBaseUrl = 'wss://ws.deltalabs.io';
        _instance.cdnBaseUrl = 'https://cdn.deltalabs.io';
        _instance.webAppBaseUrl = 'https://deltalabs.io';
        _instance.enableLogging = false;
        _instance.enableCrashReporting = true;
        _instance.enableAnalytics = true;
        _instance.connectTimeoutMs = 15000;
        _instance.receiveTimeoutMs = 15000;
        _instance.maxRetryAttempts = 5;
    }
  }
}
