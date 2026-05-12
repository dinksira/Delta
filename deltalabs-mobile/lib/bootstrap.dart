import 'dart:async';

import 'package:deltalabs_mobile/core/config/app_config.dart';
import 'package:deltalabs_mobile/core/config/environment.dart';
import 'package:deltalabs_mobile/core/di/service_locator.dart';
import 'package:deltalabs_mobile/core/logging/app_logger.dart';
import 'package:deltalabs_mobile/core/routing/app_routes.dart';
import 'package:deltalabs_mobile/core/storage/secure_storage.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

// The initial route determined before runApp — no flash, no redirect
String initialAppRoute = AppRoutes.login;

Future<void> bootstrap(FutureOr<Widget> Function() builder) async {
  await runZonedGuarded(
    () async {
      WidgetsFlutterBinding.ensureInitialized();

      await SystemChrome.setPreferredOrientations([
        DeviceOrientation.portraitUp,
        DeviceOrientation.portraitDown,
      ]);

      SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
      SystemChrome.setSystemUIOverlayStyle(
        const SystemUiOverlayStyle(
          statusBarColor: Colors.transparent,
          statusBarIconBrightness: Brightness.dark,
          systemNavigationBarColor: Colors.transparent,
          systemNavigationBarIconBrightness: Brightness.dark,
          systemNavigationBarDividerColor: Colors.transparent,
        ),
      );

      await AppConfig.initialize(Environment.current);
      await ServiceLocator.initialize();

      // Check local token BEFORE runApp — determines initial route instantly
      // No network call, no flash, no redirect
      final token = await SecureStorage().getAccessToken();
      initialAppRoute = token != null ? AppRoutes.home : AppRoutes.login;

      AppLogger.info(
        'Bootstrap complete — launching DeltaLabs at $initialAppRoute',
      );

      runApp(await builder());
    },
    (error, stackTrace) {
      AppLogger.error('Uncaught error', error: error, stackTrace: stackTrace);
    },
  );
}
