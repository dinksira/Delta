import 'package:deltalabs_mobile/core/routing/app_routes.dart';
import 'package:deltalabs_mobile/features/features/domain/entities/feature_instance.dart';
import 'package:deltalabs_mobile/features/workspace/data/models/my_school_model.dart';

/// Helpers for per-instance session restore (browser-tab behaviour).
abstract class FeatureInstanceSession {
  static bool locationMatchesInstance(FeatureInstance instance, String location) {
    final trimmed = location.trim();
    if (trimmed.isEmpty) return false;

    final uri = Uri.parse(trimmed);
    if (AppRoutes.instanceIdFrom(uri) != instance.id) return false;
    return uri.path.startsWith('/workspace/school');
  }

  /// Resolves [MySchoolModel] for detail/department/class routes (hub routes need no extra).
  static MySchoolModel? schoolForLocation(
    String location,
    List<MySchoolModel> schools,
  ) {
    if (!_isSchoolDetailRoute(location)) return null;

    final uri = Uri.parse(location);
    final segments = uri.pathSegments;
    final detailIndex = segments.indexOf('detail');
    if (detailIndex < 0 || detailIndex + 1 >= segments.length) return null;

    final schoolId = Uri.decodeComponent(segments[detailIndex + 1]);
    for (final s in schools) {
      if (s.schoolId == schoolId) return s;
    }
    return null;
  }

  static bool _isSchoolDetailRoute(String location) {
    return Uri.parse(location).path.contains('/detail/');
  }

  static String ensureInstanceQuery(String location, String instanceId) {
    final uri = Uri.parse(location);
    if (AppRoutes.instanceIdFrom(uri) == instanceId) return location;
    return AppRoutes.attachInstance(location, instanceId);
  }
}
