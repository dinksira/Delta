import 'package:deltalabs_mobile/core/routing/app_routes.dart';
import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/features/presentation/providers/features_hub_provider.dart';
import 'package:deltalabs_mobile/features/features/presentation/feature_instance_navigation.dart';
import 'package:deltalabs_mobile/features/features/presentation/widgets/features_shell_header.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

/// Wraps every `/workspace/*` route — same features header + session persistence.
class FeaturesWorkspaceShell extends ConsumerStatefulWidget {
  const FeaturesWorkspaceShell({required this.child, super.key});

  final Widget child;

  @override
  ConsumerState<FeaturesWorkspaceShell> createState() =>
      _FeaturesWorkspaceShellState();
}

class _FeaturesWorkspaceShellState extends ConsumerState<FeaturesWorkspaceShell> {
  String? _lastPersistedKey;

  @override
  Widget build(BuildContext context) {
    _persistInstanceSession(context);

    return ColoredBox(
      color: AppColors.surfaceGrey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          FeaturesShellHeader(
            onFeaturesSwitchTap: () {
              final uri = GoRouterState.of(context).uri;
              final instanceId = AppRoutes.instanceIdFrom(uri);
              if (context.canPop()) {
                context.pop();
                return;
              }
              if (instanceId != null && instanceId.isNotEmpty) {
                goToFeaturesHubTab(context, 'school');
                return;
              }
              context.go(AppRoutes.featuresHub);
            },
          ),
          Expanded(child: widget.child),
        ],
      ),
    );
  }

  void _persistInstanceSession(BuildContext context) {
    final uri = GoRouterState.of(context).uri;
    final instanceId = AppRoutes.instanceIdFrom(uri);
    if (instanceId == null || instanceId.isEmpty) return;

    final key = '$instanceId|${uri}';
    if (key == _lastPersistedKey) return;
    _lastPersistedKey = key;

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      ref.read(featuresHubProvider.notifier).saveInstanceLocation(
            instanceId,
            uri.toString(),
          );
    });
  }
}
