import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'core/config/app_config.dart';
import 'core/config/environment.dart';
import 'core/di/service_locator.dart';
import 'core/logging/app_logger.dart';

// Firebase — uncomment after running `flutterfire configure`
// import 'package:firebase_core/firebase_core.dart';
// import 'package:firebase_crashlytics/firebase_crashlytics.dart';
// import 'firebase_options.dart';

Future<void> bootstrap(FutureOr<Widget> Function() builder) async {
  await runZonedGuarded(
    () async {
      WidgetsFlutterBinding.ensureInitialized();

      await SystemChrome.setPreferredOrientations([
        DeviceOrientation.portraitUp,
        DeviceOrientation.portraitDown,
      ]);

      await AppConfig.initialize(Environment.current);

      // await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);

      await ServiceLocator.initialize();

      AppLogger.info('Bootstrap complete — launching DeltaLabs');

      runApp(await builder());
    },
    (error, stackTrace) {
      AppLogger.error('Uncaught error', error: error, stackTrace: stackTrace);
    },
  );
}
