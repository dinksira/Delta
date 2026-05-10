import 'package:flutter/material.dart';

/// DeltaLabs brand color tokens.
abstract class AppColors {
  // ── Brand ──────────────────────────────────────────────────────────────────
  static const Color primary = Color(0xFF1A3C4D);
  static const Color primaryLight = Color(0xFF2A5570);
  static const Color primaryDark = Color(0xFF0F2530);

  // ── Accent (links, highlights) ────────────────────────────────────────────
  static const Color accent = Color(0xFF1A3C4D);

  // ── Backgrounds ───────────────────────────────────────────────────────────
  static const Color background = Color(0xFFFFFFFF);
  static const Color surfaceGrey = Color(0xFFF5F5F5);

  // ── Text ──────────────────────────────────────────────────────────────────
  static const Color textPrimary = Color(0xFF1A1A1A);
  static const Color textSecondary = Color(0xFF8A8A8A);
  static const Color textHint = Color(0xFFB0B0B0);
  static const Color textLink = Color(0xFF1A3C4D);

  // ── Input ─────────────────────────────────────────────────────────────────
  static const Color inputBorder = Color(0xFFC5D5E8);
  static const Color inputBorderFocused = Color(0xFF1A3C4D);
  static const Color inputFill = Color(0xFFFFFFFF);

  // ── Divider ───────────────────────────────────────────────────────────────
  static const Color divider = Color(0xFFE0E0E0);

  // ── Social button border ──────────────────────────────────────────────────
  static const Color socialBorder = Color(0xFFE8E8E8);

  // ── Error ─────────────────────────────────────────────────────────────────
  static const Color error = Color(0xFFE53935);
}
