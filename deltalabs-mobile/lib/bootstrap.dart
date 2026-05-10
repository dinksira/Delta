import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'core/config/app_config.dart';
import 'core/config/environment.dart';
import 'core/di/service_locator.dart';
import 'core/logging/app_logger.dart';

// Firebase imports — uncomment once you run `flutterfire configure`
// import 'package:firebase_core/firebase_core.dart';
// import 'package:firebase_crashlytics/firebase_crashlytics.dart';
// import 'firebase_options.dart';

/// Bootstrap the application with all required initializations.
/// Wraps the entire app in a zone to catch all uncaught errors.
Future<void> bootstrap(FutureOr<Widget> Function() builder) async {
  await runZonedGuarded(
    () async {
      WidgetsFlutterBinding.ensureInitialized();

      // Lock orientation to portrait by default
      await SystemChrome.setPreferredOrientations([
        DeviceOrientation.portraitUp,
        DeviceOrientation.portraitDown,
      ]);

      // Initialize environment config
      await AppConfig.initialize(Environment.current);

      // ── Firebase (enable after running `flutterfire configure`) ────────────
      // await Firebase.initializeApp(
      //   options: DefaultFirebaseOptions.currentPlatform,
      // );
      // if (!kDebugMode) {
      //   FlutterError.onError =
      //       FirebaseCrashlytics.instance.recordFlutterFatalError;
      //   PlatformDispatcher.instance.onError = (error, stack) {
      //     FirebaseCrashlytics.instance.recordError(error, stack, fatal: true);
      //     return true;
      //   };
      // }
      // ───────────────────────────────────────────────────────────────────────

      // Initialize service locator (GetIt)
      await ServiceLocator.initialize();

      AppLogger.info('Bootstrap complete — launching DeltaLabs');

      runApp(await builder());
    },
    (error, stackTrace) {
      AppLogger.error('Uncaught error', error: error, stackTrace: stackTrace);
      // Uncomment once Firebase is configured:
      // if (!kDebugMode) {
      //   FirebaseCrashlytics.instance.recordError(error, stackTrace);
      // }
    },
  );
}
