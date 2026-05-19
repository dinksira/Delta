import 'package:flutter/material.dart';

/// Shared layout measurements for the TikTok-style feed overlay.
abstract final class FeedLayout {
  static const double progressBarThickness = 2.5;

  /// Touch target above the scrubber line (line sits on the bottom edge).
  static const double progressTouchHeight = 20;

  /// Padding from the bottom of the feed body (above tab bar).
  static const double captionBottomPadding = 0;

  /// Matches caption / action rail horizontal inset.
  static const double overlayPaddingLeft = 16;
  static const double overlayPaddingRight = 12;

  static double topChromeHeight(BuildContext context) {
    final top = MediaQuery.paddingOf(context).top;
    return top + 52;
  }
}
