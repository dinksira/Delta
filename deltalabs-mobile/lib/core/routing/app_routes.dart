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
  static const String workspaceSchoolMarketplaceListing =
      '/workspace/school/marketplace/:listingId';

  static String workspaceSchoolDetailPath(String schoolId) =>
      '/workspace/school/detail/${Uri.encodeComponent(schoolId)}';

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
