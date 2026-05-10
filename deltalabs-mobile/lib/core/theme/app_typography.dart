import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'app_colors.dart';

/// Typography system using Inter font family.
/// All text styles are defined as static constants for consistent usage.
abstract class AppTypography {
  static TextTheme textTheme(AppColorTokens colors) {
    return GoogleFonts.interTextTheme(
      TextTheme(
        displayLarge: displayLarge.copyWith(color: colors.onSurface),
        displayMedium: displayMedium.copyWith(color: colors.onSurface),
        displaySmall: displaySmall.copyWith(color: colors.onSurface),
        headlineLarge: headlineLarge.copyWith(color: colors.onSurface),
        headlineMedium: headlineMedium.copyWith(color: colors.onSurface),
        headlineSmall: headlineSmall.copyWith(color: colors.onSurface),
        titleLarge: titleLarge.copyWith(color: colors.onSurface),
        titleMedium: titleMedium.copyWith(color: colors.onSurface),
        titleSmall: titleSmall.copyWith(color: colors.onSurface),
        bodyLarge: bodyLarge.copyWith(color: colors.onSurface),
        bodyMedium: bodyMedium.copyWith(color: colors.onSurface),
        bodySmall: bodySmall.copyWith(color: colors.onSurfaceVariant),
        labelLarge: labelLarge.copyWith(color: colors.onSurface),
        labelMedium: labelMedium.copyWith(color: colors.onSurface),
        labelSmall: labelSmall.copyWith(color: colors.onSurfaceVariant),
      ),
    );
  }

  // Display
  static const TextStyle displayLarge = TextStyle(
    fontSize: 57,
    fontWeight: FontWeight.w400,
    letterSpacing: -0.25,
    height: 1.12,
  );
  static const TextStyle displayMedium = TextStyle(
    fontSize: 45,
    fontWeight: FontWeight.w400,
    letterSpacing: 0,
    height: 1.16,
  );
  static const TextStyle displaySmall = TextStyle(
    fontSize: 36,
    fontWeight: FontWeight.w400,
    letterSpacing: 0,
    height: 1.22,
  );

  // Headline
  static const TextStyle headlineLarge = TextStyle(
    fontSize: 32,
    fontWeight: FontWeight.w600,
    letterSpacing: 0,
    height: 1.25,
  );
  static const TextStyle headlineMedium = TextStyle(
    fontSize: 28,
    fontWeight: FontWeight.w600,
    letterSpacing: 0,
    height: 1.29,
  );
  static const TextStyle headlineSmall = TextStyle(
    fontSize: 24,
    fontWeight: FontWeight.w600,
    letterSpacing: 0,
    height: 1.33,
  );

  // Title
  static const TextStyle titleLarge = TextStyle(
    fontSize: 22,
    fontWeight: FontWeight.w600,
    letterSpacing: 0,
    height: 1.27,
  );
  static const TextStyle titleMedium = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.w600,
    letterSpacing: 0.15,
    height: 1.5,
  );
  static const TextStyle titleSmall = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w600,
    letterSpacing: 0.1,
    height: 1.43,
  );

  // Body
  static const TextStyle bodyLarge = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.w400,
    letterSpacing: 0.5,
    height: 1.5,
  );
  static const TextStyle bodyMedium = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w400,
    letterSpacing: 0.25,
    height: 1.43,
  );
  static const TextStyle bodySmall = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.w400,
    letterSpacing: 0.4,
    height: 1.33,
  );

  // Label
  static const TextStyle labelLarge = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w600,
    letterSpacing: 0.1,
    height: 1.43,
  );
  static const TextStyle labelMedium = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.w600,
    letterSpacing: 0.5,
    height: 1.33,
  );
  static const TextStyle labelSmall = TextStyle(
    fontSize: 11,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.5,
    height: 1.45,
  );
}
