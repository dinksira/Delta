import 'package:flutter/material.dart';

/// School-scoped feed — placeholder until school APIs are wired.
class SchoolFeedPage extends StatelessWidget {
  const SchoolFeedPage({super.key});

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.paddingOf(context).bottom;

    return ColoredBox(
      color: Colors.black,
      child: Center(
        child: Padding(
          padding: EdgeInsets.fromLTRB(32, 120, 32, 80 + bottom),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.school_rounded, size: 56, color: Colors.white.withValues(alpha: 0.85)),
              const SizedBox(height: 20),
              const Text(
                'School feed',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Clips and updates from your enrolled schools will show here.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.6),
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
