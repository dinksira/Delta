import 'package:deltalabs_mobile/core/routing/app_routes.dart';
import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/workspace/presentation/pages/workspace_placeholder_page.dart';
import 'package:deltalabs_mobile/features/workspace/workspace_launch_args.dart';
import 'package:deltalabs_mobile/features/workspace/workspace_routes.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

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
      return _SchoolWorkspaceRedirect(args: launch);
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

/// Legacy `/workspace/school` via `:featureKey` — forward to the school hub route.
class _SchoolWorkspaceRedirect extends StatefulWidget {
  const _SchoolWorkspaceRedirect({required this.args});

  final WorkspaceLaunchArgs args;

  @override
  State<_SchoolWorkspaceRedirect> createState() => _SchoolWorkspaceRedirectState();
}

class _SchoolWorkspaceRedirectState extends State<_SchoolWorkspaceRedirect> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      context.go(AppRoutes.workspaceSchool);
    });
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: AppColors.surfaceGrey,
      body: Center(child: CircularProgressIndicator(color: AppColors.primary)),
    );
  }
}
