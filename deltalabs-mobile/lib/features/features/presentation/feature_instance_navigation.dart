import 'package:deltalabs_mobile/core/routing/app_routes.dart';
import 'package:deltalabs_mobile/features/features/presentation/constants/feature_hub_categories.dart';
import 'package:deltalabs_mobile/features/features/presentation/feature_instance_session.dart';
import 'package:deltalabs_mobile/features/features/presentation/models/feature_card_ui.dart';
import 'package:deltalabs_mobile/features/features/presentation/models/feature_instance_ui.dart';
import 'package:deltalabs_mobile/features/features/presentation/providers/features_hub_provider.dart';
import 'package:deltalabs_mobile/features/features/presentation/providers/features_shell_tab_provider.dart';
import 'package:deltalabs_mobile/features/workspace/data/models/my_school_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/providers/school_providers.dart';
import 'package:deltalabs_mobile/features/workspace/workspace_launch_args.dart';
import 'package:deltalabs_mobile/features/workspace/workspace_routes.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

/// Navigate to the features hub on a category tab (pins the tab when needed).
void goToFeaturesHubTab(BuildContext context, String tabId) {
  final container = ProviderScope.containerOf(context, listen: false);
  final id = tabId.trim().isEmpty || tabId == FeatureHubCategories.all.id
      ? FeatureHubCategories.all.id
      : tabId.trim();

  if (id != FeatureHubCategories.all.id) {
    container.read(featuresHubProvider.notifier).pinCategory(id);
  }
  container.read(featuresShellTabProvider.notifier).select(id);
  if (context.mounted) {
    context.go(AppRoutes.featuresHubWithTab(id));
  }
}

/// Opens a saved feature instance workspace (restores last session when available).
Future<void> openFeatureInstance(
  BuildContext context,
  WidgetRef ref,
  FeatureInstanceUi item,
) async {
  if (item.disabled) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${item.displayTitle} is not available for your account.'),
        behavior: SnackBarBehavior.floating,
      ),
    );
    return;
  }

  final key = item.featureKey.toLowerCase();
  ref.read(featuresShellTabProvider.notifier).select(item.categoryId);
  await ref.read(featuresHubProvider.notifier).pinCategory(item.categoryId);

  if (key == 'school') {
    await _openSchoolInstance(context, ref, item);
    return;
  }

  final path = WorkspaceRoutes.resolvePushPath(
    featureKey: key,
    webRoutePath: item.feature.routePath,
  );

  await context.push(
    path,
    extra: WorkspaceLaunchArgs(
      featureKey: key,
      displayTitle: item.displayTitle,
      webRoutePath: item.feature.routePath,
    ),
  );
}

Future<void> _openSchoolInstance(
  BuildContext context,
  WidgetRef ref,
  FeatureInstanceUi item,
) async {
  final instance = item.instance;
  final isFirstOpen =
      instance.lastLocation == null || instance.lastLocation!.trim().isEmpty;

  if (!isFirstOpen) {
    final lastLocation = instance.lastLocation!.trim();
    if (FeatureInstanceSession.locationMatchesInstance(instance, lastLocation)) {
      List<MySchoolModel> schools = const [];
      try {
        schools = await ref.read(myActiveSchoolsProvider.future);
      } catch (_) {}

      if (!context.mounted) return;
      final school = FeatureInstanceSession.schoolForLocation(lastLocation, schools);
      await context.push(lastLocation, extra: school);
      return;
    }
  }

  // First open — school hub (list, offers, marketplace, archive).
  if (!context.mounted) return;
  await context.push(
    AppRoutes.attachInstance(AppRoutes.workspaceSchool, item.id),
  );
}

/// Tap on catalog template (All tab): create instance + return target tab id.
Future<String?> addFeatureFromCatalog(
  BuildContext context,
  WidgetRef ref,
  FeatureCardUi card,
) async {
  if (card.disabled) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${card.displayTitle} is not available for your account.'),
        behavior: SnackBarBehavior.floating,
      ),
    );
    return null;
  }

  final categoryId = FeatureHubCategories.categoryIdForFeatureKey(card.id);
  await ref.read(featuresHubProvider.notifier).addInstance(card.id);
  ref.read(featuresShellTabProvider.notifier).select(categoryId);

  return categoryId;
}
