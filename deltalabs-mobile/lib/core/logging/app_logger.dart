import 'package:flutter/foundation.dart';
import 'package:logger/logger.dart';

import 'package:deltalabs_mobile/core/config/app_config.dart';

/// Centralized application logger.
/// In production, logs are suppressed and errors are forwarded to Crashlytics
/// via the bootstrap error handler.
class AppLogger {
  AppLogger._();

  static final Logger _logger = Logger(
    printer: PrettyPrinter(
      
    ),
    level: kDebugMode ? Level.trace : Level.warning,
    output: kDebugMode ? ConsoleOutput() : null,
  );

  static void trace(String message) {
    if (_shouldLog) _logger.t(message);
  }

  static void debug(String message) {
    if (_shouldLog) _logger.d(message);
  }

  static void info(String message) {
    if (_shouldLog) _logger.i(message);
  }

  static void warning(String message, {Object? error, StackTrace? stackTrace}) {
    if (_shouldLog) _logger.w(message, error: error, stackTrace: stackTrace);
  }

  static void error(String message, {Object? error, StackTrace? stackTrace}) {
    _logger.e(message, error: error, stackTrace: stackTrace);
  }

  static void fatal(String message, {Object? error, StackTrace? stackTrace}) {
    _logger.f(message, error: error, stackTrace: stackTrace);
  }

  static bool get _shouldLog {
    // AppConfig may not be initialized yet during very early bootstrap
    try {
      return AppConfig.instance.enableLogging;
    } catch (_) {
      return kDebugMode;
    }
  }
}
