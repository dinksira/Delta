import 'package:deltalabs_mobile/features/workspace/presentation/pages/school_workspace_page.dart';
import 'package:deltalabs_mobile/features/workspace/presentation/pages/workspace_placeholder_page.dart';
import 'package:deltalabs_mobile/features/workspace/workspace_launch_args.dart';
import 'package:deltalabs_mobile/features/workspace/workspace_routes.dart';
import 'package:flutter/material.dart';

/// Resolves `feature_key` to the correct workspace screen.
class WorkspacePage extends StatelessWidget {
  const WorkspacePage({
    required this.featureKey,
    this.args,
    super.key,
  });

  final String featureKey;
  final WorkspaceLaunchArgs? args;

  @override
  Widget build(BuildContext context) {
    final key = WorkspaceRoutes.normalizeFeatureKey(featureKey);
    final launch = args ??
        WorkspaceLaunchArgs(
          featureKey: key,
          displayTitle: _fallbackTitle(key),
        );

    if (WorkspaceRoutes.hasNativeWorkspace(key)) {
      return SchoolWorkspacePage(args: launch);
    }

    return WorkspacePlaceholderPage(args: launch);
  }

  static String _fallbackTitle(String key) {
    return key.replaceAll('_', ' ').replaceAllMapped(
          RegExp(r'\b\w'),
          (m) => m.group(0)!.toUpperCase(),
        );
  }
}
