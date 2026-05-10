import 'package:flutter/material.dart';

/// Token-based color system.
/// All colors are defined as semantic tokens, not raw hex values.
class AppColorTokens {
  const AppColorTokens({
    required this.primary,
    required this.onPrimary,
    required this.primaryContainer,
    required this.onPrimaryContainer,
    required this.secondary,
    required this.onSecondary,
    required this.secondaryContainer,
    required this.onSecondaryContainer,
    required this.tertiary,
    required this.onTertiary,
    required this.tertiaryContainer,
    required this.onTertiaryContainer,
    required this.error,
    required this.onError,
    required this.errorContainer,
    required this.onErrorContainer,
    required this.surface,
    required this.onSurface,
    required this.surfaceVariant,
    required this.onSurfaceVariant,
    required this.outline,
    required this.outlineVariant,
    required this.shadow,
    required this.scrim,
    required this.inverseSurface,
    required this.onInverseSurface,
    required this.inversePrimary,
    required this.success,
    required this.warning,
    required this.info,
  });

  final Color primary;
  final Color onPrimary;
  final Color primaryContainer;
  final Color onPrimaryContainer;
  final Color secondary;
  final Color onSecondary;
  final Color secondaryContainer;
  final Color onSecondaryContainer;
  final Color tertiary;
  final Color onTertiary;
  final Color tertiaryContainer;
  final Color onTertiaryContainer;
  final Color error;
  final Color onError;
  final Color errorContainer;
  final Color onErrorContainer;
  final Color surface;
  final Color onSurface;
  final Color surfaceVariant;
  final Color onSurfaceVariant;
  final Color outline;
  final Color outlineVariant;
  final Color shadow;
  final Color scrim;
  final Color inverseSurface;
  final Color onInverseSurface;
  final Color inversePrimary;
  final Color success;
  final Color warning;
  final Color info;
}

abstract class AppColors {
  static const AppColorTokens light = AppColorTokens(
    primary: Color(0xFF1A1A2E),
    onPrimary: Color(0xFFFFFFFF),
    primaryContainer: Color(0xFFD8E2FF),
    onPrimaryContainer: Color(0xFF001160),
    secondary: Color(0xFF4A6CF7),
    onSecondary: Color(0xFFFFFFFF),
    secondaryContainer: Color(0xFFDDE1FF),
    onSecondaryContainer: Color(0xFF001160),
    tertiary: Color(0xFF7B5EA7),
    onTertiary: Color(0xFFFFFFFF),
    tertiaryContainer: Color(0xFFEDDCFF),
    onTertiaryContainer: Color(0xFF2D0060),
    error: Color(0xFFBA1A1A),
    onError: Color(0xFFFFFFFF),
    errorContainer: Color(0xFFFFDAD6),
    onErrorContainer: Color(0xFF410002),
    surface: Color(0xFFFAFAFF),
    onSurface: Color(0xFF1A1A2E),
    surfaceVariant: Color(0xFFE1E2EC),
    onSurfaceVariant: Color(0xFF44464F),
    outline: Color(0xFF74777F),
    outlineVariant: Color(0xFFC4C6D0),
    shadow: Color(0xFF000000),
    scrim: Color(0xFF000000),
    inverseSurface: Color(0xFF2F3033),
    onInverseSurface: Color(0xFFF2F0F4),
    inversePrimary: Color(0xFFB4C5FF),
    success: Color(0xFF1B873A),
    warning: Color(0xFFF59E0B),
    info: Color(0xFF0EA5E9),
  );

  static const AppColorTokens dark = AppColorTokens(
    primary: Color(0xFFB4C5FF),
    onPrimary: Color(0xFF002096),
    primaryContainer: Color(0xFF0031CC),
    onPrimaryContainer: Color(0xFFDDE1FF),
    secondary: Color(0xFFBBC4FF),
    onSecondary: Color(0xFF0E1F99),
    secondaryContainer: Color(0xFF2A3DB0),
    onSecondaryContainer: Color(0xFFDDE1FF),
    tertiary: Color(0xFFD4BBFF),
    onTertiary: Color(0xFF430E76),
    tertiaryContainer: Color(0xFF5B278E),
    onTertiaryContainer: Color(0xFFEDDCFF),
    error: Color(0xFFFFB4AB),
    onError: Color(0xFF690005),
    errorContainer: Color(0xFF93000A),
    onErrorContainer: Color(0xFFFFDAD6),
    surface: Color(0xFF121318),
    onSurface: Color(0xFFE3E2E6),
    surfaceVariant: Color(0xFF44464F),
    onSurfaceVariant: Color(0xFFC4C6D0),
    outline: Color(0xFF8E9099),
    outlineVariant: Color(0xFF44464F),
    shadow: Color(0xFF000000),
    scrim: Color(0xFF000000),
    inverseSurface: Color(0xFFE3E2E6),
    onInverseSurface: Color(0xFF2F3033),
    inversePrimary: Color(0xFF1A1A2E),
    success: Color(0xFF6EE7A0),
    warning: Color(0xFFFBBF24),
    info: Color(0xFF38BDF8),
  );
}
