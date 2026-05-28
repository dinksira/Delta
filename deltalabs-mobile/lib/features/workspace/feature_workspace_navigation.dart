import 'package:deltalabs_mobile/features/features/presentation/models/feature_card_ui.dart';
import 'package:deltalabs_mobile/features/features/presentation/providers/features_hub_provider.dart';
import 'package:deltalabs_mobile/features/workspace/workspace_launch_args.dart';
import 'package:deltalabs_mobile/features/workspace/workspace_routes.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

/// Opens a feature workspace from the hub (gates + routing by `feature_key`).
void openFeatureWorkspace(
  BuildContext context,
  WidgetRef ref,
  FeatureCardUi card,
) {
  if (card.disabled) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${card.displayTitle} is not available for your account.'),
        behavior: SnackBarBehavior.floating,
      ),
    );
    return;
  }

  final hidden = ref.read(featuresHubProvider).hiddenSet;
  if (hidden.contains(card.id)) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          '${card.displayTitle} is hidden. Add it back from the + button on Features.',
        ),
        behavior: SnackBarBehavior.floating,
      ),
    );
    return;
  }

  final path = WorkspaceRoutes.resolvePushPath(
    featureKey: card.id,
    webRoutePath: card.feature.routePath,
  );

  context.push(
    path,
    extra: WorkspaceLaunchArgs(
      featureKey: card.id,
      displayTitle: card.displayTitle,
      webRoutePath: card.feature.routePath,
    ),
  );
}
