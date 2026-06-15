import 'package:deltalabs_mobile/core/routing/app_routes.dart';
import 'package:deltalabs_mobile/features/features/presentation/feature_instance_navigation.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_simple_back_header.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// Back affordance when a school hub route was opened from a feature instance.
class SchoolInstanceBackBar extends StatelessWidget {
  const SchoolInstanceBackBar({super.key});

  static bool showsForUri(Uri uri) {
    final instanceId = AppRoutes.instanceIdFrom(uri);
    if (instanceId == null || instanceId.isEmpty) return false;
    return uri.path.startsWith('/workspace/school') &&
        !uri.path.contains('/detail/');
  }

  @override
  Widget build(BuildContext context) {
    final uri = GoRouterState.of(context).uri;
    if (!showsForUri(uri)) return const SizedBox.shrink();

    return SchoolSimpleBackHeader(
      title: 'School instances',
      onBack: () => goToFeaturesHubTab(context, 'school'),
    );
  }
}
