/// Centralized route path constants.
abstract class AppRoutes {
  // ── Auth ───────────────────────────────────────────────────────────────────
  static const String login = '/auth/login';
  static const String forgotPassword = '/auth/forgot-password';
  static const String forgotOtp = '/auth/forgot-otp';
  static const String resetPassword = '/auth/reset-password';

  // ── Register flow ──────────────────────────────────────────────────────────
  static const String registerStep1 = '/auth/register/step1';
  static const String registerStep2 = '/auth/register/step2';
  static const String registerOtp = '/auth/register/otp';
  static const String registerDob = '/auth/register/dob';
  static const String registerPassword = '/auth/register/password';

  // ── Main ───────────────────────────────────────────────────────────────────
  static const String home = '/home';
  static const String feed = '/feed';
  static const String featuresHub = '/feed?surface=features';
  static String featuresHubWithTab(String tabId) {
    final id = tabId.trim();
    if (id.isEmpty || id == 'all') return featuresHub;
    return '$feed?surface=features&tab=${Uri.encodeComponent(id)}';
  }
  static const String search = '/search';
  static const String searchViewer = '/search/viewer';
  static const String featuresSearch = '/features/search';

  // ── Feature workspaces (full-screen above feed shell) ─────────────────────
  static const String workspace = '/workspace/:featureKey';
  static const String workspaceSchool = '/workspace/school';
  static const String workspaceSchoolOffers = '/workspace/school/offers';
  static const String workspaceSchoolMarketplace = '/workspace/school/marketplace';
  static const String workspaceSchoolArchive = '/workspace/school/archive';
  static const String workspaceSchoolCreate = '/workspace/school/create';
  static const String workspaceSchoolEdit = '/workspace/school/edit/:schoolId';
  static const String workspaceSchoolEditPrefix = '/workspace/school/edit';
  static const String workspaceSchoolDetail = '/workspace/school/detail/:schoolId';
  static const String workspaceSchoolDetailPrefix = '/workspace/school/detail';
  static const String workspaceSchoolDepartment =
      '/workspace/school/detail/:schoolId/department/:departmentItemId';
  static const String workspaceSchoolClass =
      '/workspace/school/detail/:schoolId/class/:classItemId';
  static const String workspaceSchoolStudent =
      '/workspace/school/detail/:schoolId/student/:studentItemId';
  static const String workspaceSchoolClassSession =
      '/workspace/school/detail/:schoolId/class/:classItemId/session/:sessionId';
  static const String workspaceSchoolManagementTable =
      '/workspace/school/detail/:schoolId/management-tables/:instanceId';
  static const String workspaceSchoolMarketplaceListing =
      '/workspace/school/marketplace/:listingId';

  /// Query key tagging navigation with a feature instance (browser-tab session).
  static const String instanceQueryKey = 'instance';

  static String? instanceIdFrom(Uri uri) => uri.queryParameters[instanceQueryKey];

  static String attachInstance(String location, String instanceId) {
    final uri = Uri.parse(location);
    final params = Map<String, String>.from(uri.queryParameters);
    params[instanceQueryKey] = instanceId;
    return uri.replace(queryParameters: params).toString();
  }

  static String workspaceSchoolDetailPath(String schoolId) =>
      '/workspace/school/detail/${Uri.encodeComponent(schoolId)}';

  static String workspaceSchoolDetailUri(
    String schoolId, {
    String? view,
    List<String> pathIds = const [],
    String? departmentItemId,
    String? instanceId,
  }) {
    if (departmentItemId != null && departmentItemId.trim().isNotEmpty) {
      final uri = Uri(
        path: workspaceSchoolDepartmentPath(schoolId, departmentItemId),
        queryParameters: {
          if (view != null && view.isNotEmpty && view != 'all') 'view': view,
          if (pathIds.isNotEmpty) 'path': pathIds.join(','),
          if (instanceId != null && instanceId.isNotEmpty)
            instanceQueryKey: instanceId,
        },
      );
      return uri.toString();
    }
    final uri = Uri(
      path: workspaceSchoolDetailPath(schoolId),
      queryParameters: {
        if (view != null && view.isNotEmpty && view != 'all') 'view': view,
        if (pathIds.isNotEmpty) 'path': pathIds.join(','),
        if (instanceId != null && instanceId.isNotEmpty) instanceQueryKey: instanceId,
      },
    );
    return uri.toString();
  }

  static List<String> parseWorkspacePathIds(String? raw) {
    if (raw == null || raw.trim().isEmpty) return const [];
    return raw.split(',').map((s) => s.trim()).where((s) => s.isNotEmpty).toList();
  }

  static String workspaceSchoolDepartmentPath(
    String schoolId,
    String departmentItemId,
  ) =>
      '/workspace/school/detail/${Uri.encodeComponent(schoolId)}/department/${Uri.encodeComponent(departmentItemId)}';

  static String workspaceSchoolClassPath(String schoolId, String classItemId) =>
      '/workspace/school/detail/${Uri.encodeComponent(schoolId)}/class/${Uri.encodeComponent(classItemId)}';

  static String workspaceSchoolStudentPath(String schoolId, String studentItemId) =>
      '/workspace/school/detail/${Uri.encodeComponent(schoolId)}/student/${Uri.encodeComponent(studentItemId)}';

  static String workspaceSchoolStudentUri(
    String schoolId,
    String studentItemId, {
    String? instanceId,
  }) {
    final uri = Uri(
      path: workspaceSchoolStudentPath(schoolId, studentItemId),
      queryParameters: {
        if (instanceId != null && instanceId.isNotEmpty) instanceQueryKey: instanceId,
      },
    );
    return uri.toString();
  }

  static const String classWorkspaceTabQueryKey = 'tab';

  static String workspaceSchoolClassUri(
    String schoolId,
    String classItemId, {
    String? tab,
    String? instanceId,
  }) {
    final uri = Uri(
      path: workspaceSchoolClassPath(schoolId, classItemId),
      queryParameters: {
        if (tab != null && tab.isNotEmpty && tab != 'overview') classWorkspaceTabQueryKey: tab,
        if (instanceId != null && instanceId.isNotEmpty) instanceQueryKey: instanceId,
      },
    );
    return uri.toString();
  }

  static String workspaceSchoolClassSessionPath(
    String schoolId,
    String classItemId,
    String sessionId,
  ) =>
      '/workspace/school/detail/${Uri.encodeComponent(schoolId)}/class/${Uri.encodeComponent(classItemId)}/session/${Uri.encodeComponent(sessionId)}';

  static String workspaceSchoolClassSessionUri(
    String schoolId,
    String classItemId,
    String sessionId, {
    String? instanceId,
  }) {
    final uri = Uri(
      path: workspaceSchoolClassSessionPath(schoolId, classItemId, sessionId),
      queryParameters: {
        if (instanceId != null && instanceId.isNotEmpty) instanceQueryKey: instanceId,
      },
    );
    return uri.toString();
  }

  static String parseClassWorkspaceTab(String? raw) {
    const allowed = {'overview', 'sessions', 'people', 'academics', 'resources'};
    final tab = raw?.trim().toLowerCase() ?? '';
    if (allowed.contains(tab)) return tab;
    return 'overview';
  }

  static String workspaceSchoolManagementTablePath(
    String schoolId,
    String instanceId,
  ) =>
      '/workspace/school/detail/${Uri.encodeComponent(schoolId)}/management-tables/${Uri.encodeComponent(instanceId)}';

  static String workspaceSchoolManagementTableUri(
    String schoolId,
    String managementTableInstanceId, {
    String? featureInstanceId,
    String? itemTitle,
    List<String> pathIds = const [],
    String? view,
    String? departmentItemId,
  }) {
    final uri = Uri(
      path: workspaceSchoolManagementTablePath(schoolId, managementTableInstanceId),
      queryParameters: {
        if (featureInstanceId != null && featureInstanceId.isNotEmpty)
          instanceQueryKey: featureInstanceId,
        if (itemTitle != null && itemTitle.isNotEmpty) 'title': itemTitle,
        if (pathIds.isNotEmpty) 'path': pathIds.join(','),
        if (view != null && view.isNotEmpty && view != 'all') 'view': view,
        if (departmentItemId != null && departmentItemId.trim().isNotEmpty)
          'dept': departmentItemId.trim(),
      },
    );
    return uri.toString();
  }

  static String workspaceSchoolEditPath(String schoolId) =>
      '/workspace/school/edit/${Uri.encodeComponent(schoolId)}';

  static String workspaceSchoolMarketplaceListingPath(String listingId) =>
      '/workspace/school/marketplace/${Uri.encodeComponent(listingId)}';

  static String workspacePath(String featureKey) =>
      '/workspace/${Uri.encodeComponent(featureKey.trim().toLowerCase())}';
  static const String classes = '/classes';
  static const String library = '/library';
  static const String profile = '/profile';

  // ── Classes ────────────────────────────────────────────────────────────────
  static const String classDetail = '/classes/:classId';
  static const String liveClass = '/classes/:classId/live';

  // ── Exams ──────────────────────────────────────────────────────────────────
  static const String exams = '/exams';
  static const String examDetail = '/exams/:examId';
  static const String liveExam = '/exams/:examId/live';

  // ── Chat ───────────────────────────────────────────────────────────────────
  static const String chat = '/chat';
  static const String chatRoom = '/chat/:roomId';

  // ── Settings ───────────────────────────────────────────────────────────────
  static const String settings = '/settings';
}
