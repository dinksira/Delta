import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import '../core/routing/app_router.dart';
import '../core/theme/app_theme.dart';
import '../core/localization/app_localizations.dart';

/// Root application widget.
/// Wires together routing, theming, and localization.
class DeltaLabsApp extends ConsumerWidget {
  const DeltaLabsApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProvider);
    final themeMode = ref.watch(themeModeProvider);

    return MaterialApp.router(
      title: 'DeltaLabs',
      debugShowCheckedModeBanner: false,

      // Routing
      routerConfig: router,

      // Theming
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: themeMode,

      // Localization
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
    );
  }
}
