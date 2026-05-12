import 'package:deltalabs_mobile/core/localization/app_localizations.dart';
import 'package:deltalabs_mobile/core/routing/app_router.dart';
import 'package:deltalabs_mobile/core/theme/app_theme.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

class DeltaLabsApp extends ConsumerWidget {
  const DeltaLabsApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProvider);

    return MaterialApp.router(
      title: 'DeltaLabs',
      debugShowCheckedModeBanner: false,
      routerConfig: router,
      theme: AppTheme.light,
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
    );
  }
}
