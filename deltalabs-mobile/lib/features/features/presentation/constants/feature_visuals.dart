import 'package:flutter/material.dart';

/// Icon + chip colors per catalog feature key (aligned with web Features hub).
class FeatureVisuals {
  const FeatureVisuals({
    required this.icon,
    required this.chipBackground,
    required this.chipForeground,
  });

  final IconData icon;
  final Color chipBackground;
  final Color chipForeground;

  static const _map = <String, FeatureVisuals>{
    'school': FeatureVisuals(
      icon: Icons.calendar_month_rounded,
      chipBackground: Color(0xFFE8EEF2),
      chipForeground: Color(0xFF1A3C4D),
    ),
    'course': FeatureVisuals(
      icon: Icons.hub_rounded,
      chipBackground: Color(0xFFFFEDD5),
      chipForeground: Color(0xFFC2410C),
    ),
    'competitions': FeatureVisuals(
      icon: Icons.biotech_rounded,
      chipBackground: Color(0xFFE0E7FF),
      chipForeground: Color(0xFF3730A3),
    ),
    'tutorials': FeatureVisuals(
      icon: Icons.person_rounded,
      chipBackground: Color(0xFFD1FAE5),
      chipForeground: Color(0xFF047857),
    ),
    'research': FeatureVisuals(
      icon: Icons.layers_rounded,
      chipBackground: Color(0xFFFEF3C7),
      chipForeground: Color(0xFFB45309),
    ),
    'rent_lab': FeatureVisuals(
      icon: Icons.science_rounded,
      chipBackground: Color(0xFFFFE4E6),
      chipForeground: Color(0xFFBE123C),
    ),
    'certification': FeatureVisuals(
      icon: Icons.verified_rounded,
      chipBackground: Color(0xFFCFFAFE),
      chipForeground: Color(0xFF0E7490),
    ),
    'chatroom': FeatureVisuals(
      icon: Icons.forum_rounded,
      chipBackground: Color(0xFFCCFBF1),
      chipForeground: Color(0xFF0F766E),
    ),
    'planner': FeatureVisuals(
      icon: Icons.event_note_rounded,
      chipBackground: Color(0xFFEDE9FE),
      chipForeground: Color(0xFF6D28D9),
    ),
    'specialization': FeatureVisuals(
      icon: Icons.school_rounded,
      chipBackground: Color(0xFFFCE7F3),
      chipForeground: Color(0xFF9D174D),
    ),
  };

  static FeatureVisuals forKey(String key) {
    return _map[key.toLowerCase()] ??
        const FeatureVisuals(
          icon: Icons.widgets_rounded,
          chipBackground: Color(0xFFE8EEF2),
          chipForeground: Color(0xFF1A3C4D),
        );
  }
}
