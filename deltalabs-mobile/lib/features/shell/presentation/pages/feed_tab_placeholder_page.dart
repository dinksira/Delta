import 'package:flutter/material.dart';

/// Placeholder for non-video feed tabs until those surfaces are built.
class FeedTabPlaceholderPage extends StatelessWidget {
  const FeedTabPlaceholderPage({
    required this.icon,
    required this.title,
    required this.subtitle,
    super.key,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: Colors.white,
      child: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(icon, size: 56, color: const Color(0xFF1A3C4D).withValues(alpha: 0.85)),
                const SizedBox(height: 20),
                Text(
                  title,
                  style: const TextStyle(
                    color: Color(0xFF1A3C4D),
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  subtitle,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Colors.black.withValues(alpha: 0.45),
                    fontSize: 14,
                    height: 1.45,
                  ),
                ),
              ],
            ),
          ),
      ),
    );
  }
}
