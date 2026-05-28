import 'package:deltalabs_mobile/core/routing/app_routes.dart';

/// Maps catalog `feature_key` → mobile workspace routes (stable, not display labels).
abstract class WorkspaceRoutes {
  WorkspaceRoutes._();

  static const Set<String> nativeWorkspaceKeys = {'school'};

  static String pathForFeatureKey(String featureKey) {
    return AppRoutes.workspacePath(normalizeFeatureKey(featureKey));
  }

  static String normalizeFeatureKey(String featureKey) {
    return featureKey.trim().toLowerCase();
  }

  /// Whether this key has a dedicated native workspace screen (vs generic placeholder).
  static bool hasNativeWorkspace(String featureKey) {
    return nativeWorkspaceKeys.contains(normalizeFeatureKey(featureKey));
  }

  /// Convert web catalog `routePath` (e.g. `/features/school`) to mobile path when known.
  static String? mobilePathFromWebRoute(String? webRoutePath) {
    if (webRoutePath == null || webRoutePath.isEmpty) return null;
    final normalized = webRoutePath.trim().toLowerCase();
    if (normalized.startsWith('/features/school')) {
      return AppRoutes.workspaceSchool;
    }
    if (normalized.startsWith('/features/course')) {
      return AppRoutes.workspacePath('course');
    }
    if (normalized.startsWith('/features/competitions')) {
      return AppRoutes.workspacePath('competitions');
    }
    if (normalized.startsWith('/features/tutorials')) {
      return AppRoutes.workspacePath('tutorials');
    }
    if (normalized.startsWith('/features/research')) {
      return AppRoutes.workspacePath('research');
    }
    if (normalized.startsWith('/features/rent-lab')) {
      return AppRoutes.workspacePath('rent_lab');
    }
    if (normalized.startsWith('/features/certification')) {
      return AppRoutes.workspacePath('certification');
    }
    if (normalized.startsWith('/features/chatroom')) {
      return AppRoutes.workspacePath('chatroom');
    }
    if (normalized.startsWith('/features/planner')) {
      return AppRoutes.workspacePath('planner');
    }
    if (normalized.startsWith('/features/specialization')) {
      return AppRoutes.workspacePath('specialization');
    }
    return null;
  }

  static String resolvePushPath({
    required String featureKey,
    String? webRoutePath,
  }) {
    final key = normalizeFeatureKey(featureKey);
    if (hasNativeWorkspace(key)) {
      return AppRoutes.workspaceSchool;
    }
    return mobilePathFromWebRoute(webRoutePath) ?? pathForFeatureKey(key);
  }
}
