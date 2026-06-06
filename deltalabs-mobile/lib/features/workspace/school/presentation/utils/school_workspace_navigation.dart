import 'package:deltalabs_mobile/core/routing/app_routes.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// Back navigation inside the school product (hub ↔ detail ↔ sub-routes).
abstract class SchoolWorkspaceNavigation {
  static String schoolHubLocation({String? featureInstanceId, Uri? uri}) {
    final instanceId =
        featureInstanceId?.trim().isNotEmpty == true
            ? featureInstanceId!.trim()
            : AppRoutes.instanceIdFrom(uri ?? Uri(path: '/'));
    if (instanceId != null && instanceId.isNotEmpty) {
      return AppRoutes.attachInstance(AppRoutes.workspaceSchool, instanceId);
    }
    return AppRoutes.workspaceSchool;
  }

  /// Back from school detail workspace → school hub (not the instance list).
  static void backFromDetail(BuildContext context, {String? featureInstanceId}) {
    final uri = GoRouterState.of(context).uri;
    final path = uri.path;

    if (path.contains('/department/') || path.contains('/class/')) {
      if (context.canPop()) {
        context.pop();
        return;
      }
    }

    context.go(schoolHubLocation(featureInstanceId: featureInstanceId, uri: uri));
  }
}
