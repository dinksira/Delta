/// Centralized route path constants.
/// All navigation paths are defined here to avoid magic strings.
abstract class AppRoutes {
  // ── Core ───────────────────────────────────────────────────────────────────
  static const String splash = '/';
  static const String onboarding = '/onboarding';

  // ── Auth ───────────────────────────────────────────────────────────────────
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String forgotPassword = '/auth/forgot-password';
  static const String resetPassword = '/auth/reset-password';
  static const String tenantSelect = '/auth/tenant';

  // ── Main ───────────────────────────────────────────────────────────────────
  static const String home = '/home';
  static const String feed = '/feed';
  static const String classes = '/classes';
  static const String library = '/library';
  static const String profile = '/profile';

  // ── Classes ────────────────────────────────────────────────────────────────
  static const String classDetail = '/classes/:classId';
  static const String liveClass = '/classes/:classId/live';
  static const String classRecording = '/classes/:classId/recording/:recordingId';

  // ── Exams ──────────────────────────────────────────────────────────────────
  static const String exams = '/exams';
  static const String examDetail = '/exams/:examId';
  static const String liveExam = '/exams/:examId/live';
  static const String examResults = '/exams/:examId/results';

  // ── Tutoring ───────────────────────────────────────────────────────────────
  static const String tutoring = '/tutoring';
  static const String tutoringSession = '/tutoring/:sessionId';

  // ── Chat ───────────────────────────────────────────────────────────────────
  static const String chat = '/chat';
  static const String chatRoom = '/chat/:roomId';

  // ── Library ────────────────────────────────────────────────────────────────
  static const String libraryItem = '/library/:itemId';

  // ── ERP ────────────────────────────────────────────────────────────────────
  static const String erp = '/erp';
  static const String erpHr = '/erp/hr';
  static const String erpFinance = '/erp/finance';
  static const String erpResources = '/erp/resources';

  // ── Settings ───────────────────────────────────────────────────────────────
  static const String settings = '/settings';
  static const String notifications = '/settings/notifications';
  static const String security = '/settings/security';
}
