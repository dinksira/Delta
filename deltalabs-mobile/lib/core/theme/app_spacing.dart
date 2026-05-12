/// Spacing and sizing token system.
/// All layout values come from this class — no magic numbers in widgets.
abstract class AppSpacing {
  // ── Base spacing scale (4pt grid) ─────────────────────────────────────────
  static const double xs = 4.0;
  static const double sm = 8.0;
  static const double md = 16.0;
  static const double lg = 24.0;
  static const double xl = 32.0;
  static const double xxl = 48.0;
  static const double xxxl = 64.0;

  // ── Border radius ─────────────────────────────────────────────────────────
  static const double radiusXs = 4.0;
  static const double radiusSm = 8.0;
  static const double radiusMd = 12.0;
  static const double radiusLg = 16.0;
  static const double radiusXl = 24.0;
  static const double radiusFull = 999.0;

  // ── Icon sizes ────────────────────────────────────────────────────────────
  static const double iconSm = 16.0;
  static const double iconMd = 24.0;
  static const double iconLg = 32.0;
  static const double iconXl = 48.0;

  // ── Component heights ─────────────────────────────────────────────────────
  static const double buttonHeight = 52.0;
  static const double inputHeight = 52.0;
  static const double appBarHeight = 56.0;
  static const double bottomNavHeight = 64.0;
  static const double cardMinHeight = 80.0;

  // ── Avatar sizes ──────────────────────────────────────────────────────────
  static const double avatarSm = 32.0;
  static const double avatarMd = 40.0;
  static const double avatarLg = 56.0;
  static const double avatarXl = 80.0;

  // ── Page padding ──────────────────────────────────────────────────────────
  static const double pagePaddingH = 16.0;
  static const double pagePaddingV = 24.0;

  // ── Feed item ─────────────────────────────────────────────────────────────
  static const double feedItemSpacing = 12.0;
  static const double feedThumbnailAspectRatio = 9 / 16;
}
