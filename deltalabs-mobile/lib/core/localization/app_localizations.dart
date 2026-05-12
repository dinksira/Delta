import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

/// Localization configuration.
/// ARB files live in lib/l10n/ and are generated via `flutter gen-l10n`.
class AppLocalizations {
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates = [
    // Generated delegate — uncomment after running flutter gen-l10n
    // AppLocalizations.delegate,
    GlobalMaterialLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
  ];

  static const List<Locale> supportedLocales = [
    Locale('en'), // English
    Locale('ar'), // Arabic
    Locale('fr'), // French
    Locale('es'), // Spanish
  ];
}
