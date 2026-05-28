import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/features/presentation/constants/feature_visuals.dart';
import 'package:deltalabs_mobile/features/workspace/presentation/widgets/workspace_scaffold.dart';
import 'package:deltalabs_mobile/features/workspace/workspace_launch_args.dart';
import 'package:flutter/material.dart';

/// Placeholder for catalog features without a native mobile workspace yet.
class WorkspacePlaceholderPage extends StatelessWidget {
  const WorkspacePlaceholderPage({
    required this.args,
    super.key,
  });

  final WorkspaceLaunchArgs args;

  @override
  Widget build(BuildContext context) {
    final visuals = FeatureVisuals.forKey(args.featureKey);
    final webPath = args.webRoutePath?.trim();

    return WorkspaceScaffold(
      title: args.displayTitle,
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  color: visuals.chipBackground,
                  shape: BoxShape.circle,
                ),
                child: Icon(visuals.icon, size: 34, color: visuals.chipForeground),
              ),
              const SizedBox(height: 20),
              Text(
                args.displayTitle,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(height: 10),
              const Text(
                'This workspace is available on the web today. '
                'A native mobile experience is on the way.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 14,
                  height: 1.45,
                ),
              ),
              if (webPath != null && webPath.isNotEmpty) ...[
                const SizedBox(height: 16),
                Text(
                  'Web route: $webPath',
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: AppColors.textHint,
                    fontSize: 12,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
