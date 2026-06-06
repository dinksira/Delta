import 'package:deltalabs_mobile/core/routing/app_routes.dart';
import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/features/presentation/feature_instance_navigation.dart';
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

    return Material(
      color: AppColors.surfaceGrey,
      child: InkWell(
        onTap: () => goToFeaturesHubTab(context, 'school'),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(4, 2, 16, 6),
          child: Row(
            children: [
              IconButton(
                onPressed: () => goToFeaturesHubTab(context, 'school'),
                icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18),
                color: AppColors.primary,
                visualDensity: VisualDensity.compact,
                tooltip: 'School instances',
              ),
              const Expanded(
                child: Text(
                  'School instances',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: AppColors.primary,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
