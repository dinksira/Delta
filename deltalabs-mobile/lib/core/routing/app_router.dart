import 'package:deltalabs_mobile/bootstrap.dart';
import 'package:deltalabs_mobile/core/routing/app_routes.dart';
import 'package:deltalabs_mobile/features/auth/presentation/pages/forgot_otp_page.dart';
import 'package:deltalabs_mobile/features/auth/presentation/pages/forgot_password_page.dart';
import 'package:deltalabs_mobile/features/auth/presentation/pages/login_page.dart';
import 'package:deltalabs_mobile/features/auth/presentation/pages/register_dob_page.dart';
import 'package:deltalabs_mobile/features/auth/presentation/pages/register_otp_page.dart';
import 'package:deltalabs_mobile/features/auth/presentation/pages/register_password_page.dart';
import 'package:deltalabs_mobile/features/auth/presentation/pages/register_step1_page.dart';
import 'package:deltalabs_mobile/features/auth/presentation/pages/register_step2_page.dart';
import 'package:deltalabs_mobile/features/auth/presentation/pages/reset_password_page.dart';
import 'package:deltalabs_mobile/features/auth/presentation/providers/auth_provider.dart';
import 'package:deltalabs_mobile/features/search/presentation/models/search_viewer_args.dart';
import 'package:deltalabs_mobile/features/search/presentation/pages/search_clip_viewer_page.dart';
import 'package:deltalabs_mobile/features/features/presentation/shell/features_workspace_shell.dart';
import 'package:deltalabs_mobile/features/features/presentation/pages/features_search_page.dart';
import 'package:deltalabs_mobile/features/workspace/data/models/my_school_model.dart';
import 'package:deltalabs_mobile/features/workspace/presentation/pages/workspace_page.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/pages/school_archive_page.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/pages/school_create_page.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/pages/school_edit_page.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/pages/school_class_session_room_page.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/pages/school_class_workspace_page.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/pages/school_department_workspace_page.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/pages/school_home_page.dart';
import 'package:deltalabs_mobile/features/workspace/school/management_table/presentation/pages/school_management_table_page.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/pages/school_marketplace_listing_page.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/pages/school_marketplace_page.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/pages/school_offers_page.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/pages/school_workspace_page.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/shell/school_hub_shell.dart';
import 'package:deltalabs_mobile/features/workspace/workspace_launch_args.dart';
import 'package:deltalabs_mobile/features/search/presentation/pages/search_page.dart';
import 'package:deltalabs_mobile/features/shell/presentation/pages/main_shell_page.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'app_router.g.dart';

// Auth-only routes — redirect to feed when already logged in
const _authRoutes = {
  AppRoutes.login,
  AppRoutes.registerStep1,
  AppRoutes.registerStep2,
  AppRoutes.registerOtp,
  AppRoutes.registerDob,
  AppRoutes.registerPassword,
  AppRoutes.forgotPassword,
  AppRoutes.forgotOtp,
  AppRoutes.resetPassword,
};

@riverpod
GoRouter appRouter(Ref ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: initialAppRoute,
    debugLogDiagnostics: true,
    redirect: (context, state) {
      if (authState.isLoading) return null;

      final user = authState.when(
        data: (u) => u,
        loading: () => null,
        error: (_, __) => null,
      );
      final isLoggedIn = user != null;
      final location = state.matchedLocation;
      final isAuthRoute = _authRoutes.contains(location);

      if (isLoggedIn && isAuthRoute) return AppRoutes.feed;
      if (!isLoggedIn && !isAuthRoute) return AppRoutes.login;

      return null;
    },
    routes: [
      // ── Auth ───────────────────────────────────────────────────────────────
      GoRoute(
        path: AppRoutes.login,
        name: 'login',
        builder: (_, __) => const LoginPage(),
      ),
      GoRoute(
        path: AppRoutes.forgotPassword,
        name: 'forgot-password',
        builder: (_, __) => const ForgotPasswordPage(),
      ),
      GoRoute(
        path: AppRoutes.forgotOtp,
        name: 'forgot-otp',
        builder: (_, __) => const ForgotOtpPage(),
      ),
      GoRoute(
        path: AppRoutes.resetPassword,
        name: 'reset-password',
        builder: (_, __) => const ResetPasswordPage(),
      ),

      // ── Register flow ──────────────────────────────────────────────────────
      GoRoute(
        path: AppRoutes.registerStep1,
        name: 'register-step1',
        builder: (_, __) => const RegisterStep1Page(),
      ),
      GoRoute(
        path: AppRoutes.registerStep2,
        name: 'register-step2',
        builder: (_, __) => const RegisterStep2Page(),
      ),
      GoRoute(
        path: AppRoutes.registerOtp,
        name: 'register-otp',
        builder: (_, __) => const RegisterOtpPage(),
      ),
      GoRoute(
        path: AppRoutes.registerDob,
        name: 'register-dob',
        builder: (_, __) => const RegisterDobPage(),
      ),
      GoRoute(
        path: AppRoutes.registerPassword,
        name: 'register-password',
        builder: (_, __) => const RegisterPasswordPage(),
      ),

      // ── Main (TikTok-style shell — no top nav) ─────────────────────────────
      GoRoute(
        path: AppRoutes.feed,
        name: 'feed',
        builder: (_, state) {
          final surface = state.uri.queryParameters['surface'];
          return MainShellPage(
            initialSurface: surface == 'features'
                ? ShellSurface.features
                : ShellSurface.feed,
          );
        },
      ),
      // Legacy alias — bookmarks / bootstrap may still point here
      GoRoute(
        path: AppRoutes.home,
        name: 'home',
        redirect: (_, __) => AppRoutes.feed,
      ),

      // ── Search (TikTok-style full screen) ──────────────────────────────────
      GoRoute(
        path: AppRoutes.search,
        name: 'search',
        builder: (_, state) => SearchPage(
          initialQuery: state.uri.queryParameters['q'],
        ),
      ),
      GoRoute(
        path: AppRoutes.featuresSearch,
        name: 'features-search',
        builder: (_, __) => const FeaturesSearchPage(),
      ),

      // ── Feature workspaces (persistent category tabs on top) ───────────────
      ShellRoute(
        builder: (_, __, child) => FeaturesWorkspaceShell(child: child),
        routes: [
          ShellRoute(
            builder: (_, __, child) => SchoolHubShell(child: child),
            routes: [
              GoRoute(
                path: AppRoutes.workspaceSchool,
                pageBuilder: (_, __) =>
                    const NoTransitionPage(child: SchoolHomePage()),
                routes: [
                  GoRoute(
                    path: 'offers',
                    pageBuilder: (_, __) =>
                        const NoTransitionPage(child: SchoolOffersPage()),
                  ),
                  GoRoute(
                    path: 'marketplace',
                    pageBuilder: (_, __) =>
                        const NoTransitionPage(child: SchoolMarketplacePage()),
                  ),
                  GoRoute(
                    path: 'archive',
                    pageBuilder: (_, __) =>
                        const NoTransitionPage(child: SchoolArchivePage()),
                  ),
                ],
              ),
            ],
          ),
          GoRoute(
            path: AppRoutes.workspaceSchoolDetail,
            name: 'school-detail',
            builder: (_, state) {
              final schoolId = state.pathParameters['schoolId'] ?? '';
              final extra = state.extra;
              final view = state.uri.queryParameters['view'];
              final pathIds =
                  AppRoutes.parseWorkspacePathIds(state.uri.queryParameters['path']);
              return SchoolWorkspacePage(
                schoolId: schoolId,
                school: extra is MySchoolModel ? extra : null,
                initialView: view,
                initialPathIds: pathIds,
              );
            },
          ),
          GoRoute(
            path: AppRoutes.workspaceSchoolDepartment,
            name: 'school-department',
            builder: (_, state) {
              final schoolId = state.pathParameters['schoolId'] ?? '';
              final departmentItemId = state.pathParameters['departmentItemId'] ?? '';
              final extra = state.extra;
              final view = state.uri.queryParameters['view'];
              final pathIds =
                  AppRoutes.parseWorkspacePathIds(state.uri.queryParameters['path']);
              return SchoolDepartmentWorkspacePage(
                schoolId: schoolId,
                departmentItemId: departmentItemId,
                school: extra is MySchoolModel ? extra : null,
                initialView: view,
                initialPathIds: pathIds,
              );
            },
          ),
          GoRoute(
            path: AppRoutes.workspaceSchoolClass,
            name: 'school-class',
            builder: (_, state) {
              final schoolId = state.pathParameters['schoolId'] ?? '';
              final classItemId = state.pathParameters['classItemId'] ?? '';
              final extra = state.extra;
              final tab = AppRoutes.parseClassWorkspaceTab(
                state.uri.queryParameters[AppRoutes.classWorkspaceTabQueryKey],
              );
              return SchoolClassWorkspacePage(
                schoolId: schoolId,
                classItemId: classItemId,
                school: extra is MySchoolModel ? extra : null,
                initialTab: tab,
              );
            },
            routes: [
              GoRoute(
                path: 'session/:sessionId',
                name: 'school-class-session',
                builder: (_, state) {
                  final schoolId = state.pathParameters['schoolId'] ?? '';
                  final classItemId = state.pathParameters['classItemId'] ?? '';
                  final sessionId = state.pathParameters['sessionId'] ?? '';
                  final extra = state.extra;
                  return SchoolClassSessionRoomPage(
                    schoolId: schoolId,
                    classItemId: classItemId,
                    sessionId: sessionId,
                    school: extra is MySchoolModel ? extra : null,
                  );
                },
              ),
            ],
          ),
          GoRoute(
            path: AppRoutes.workspaceSchoolManagementTable,
            name: 'school-management-table',
            builder: (_, state) {
              final schoolId = state.pathParameters['schoolId'] ?? '';
              final instanceId = state.pathParameters['instanceId'] ?? '';
              final extra = state.extra;
              final itemTitle = state.uri.queryParameters['title'];
              final pathIds = AppRoutes.parseWorkspacePathIds(
                state.uri.queryParameters['path'],
              );
              final workspaceView = state.uri.queryParameters['view'];
              final departmentItemId = state.uri.queryParameters['dept'];
              final featureInstanceId = AppRoutes.instanceIdFrom(state.uri);
              return SchoolManagementTablePage(
                schoolId: schoolId,
                instanceId: instanceId,
                school: extra is MySchoolModel ? extra : null,
                workspaceItemTitle: itemTitle,
                pathIds: pathIds,
                workspaceView: workspaceView,
                departmentItemId: departmentItemId,
                featureInstanceId: featureInstanceId,
              );
            },
          ),
          GoRoute(
            path: AppRoutes.workspaceSchoolMarketplaceListing,
            name: 'school-marketplace-listing',
            builder: (_, state) {
              final listingId = state.pathParameters['listingId'] ?? '';
              return SchoolMarketplaceListingPage(listingId: listingId);
            },
          ),
          GoRoute(
            path: AppRoutes.workspace,
            name: 'workspace',
            builder: (_, state) {
              final key = state.pathParameters['featureKey'] ?? '';
              final extra = state.extra;
              return WorkspacePage(
                featureKey: key,
                args: extra is WorkspaceLaunchArgs ? extra : null,
              );
            },
          ),
        ],
      ),

      // ── School create / edit (full screen — outside features chrome) ───────
      GoRoute(
        path: AppRoutes.workspaceSchoolCreate,
        name: 'school-create',
        pageBuilder: (_, __) => const MaterialPage(
          fullscreenDialog: true,
          child: SchoolCreatePage(),
        ),
      ),
      GoRoute(
        path: AppRoutes.workspaceSchoolEdit,
        name: 'school-edit',
        pageBuilder: (_, state) {
          final schoolId = state.pathParameters['schoolId'] ?? '';
          final extra = state.extra;
          final page = extra is MySchoolModel
              ? SchoolEditPage(school: extra)
              : SchoolEditPage(
                  school: MySchoolModel(
                    schoolId: schoolId,
                    orgId: '',
                    name: '',
                    slug: '',
                    schoolType: '',
                    archived: false,
                    roleKeys: const [],
                  ),
                );
          return MaterialPage(fullscreenDialog: true, child: page);
        },
      ),

      GoRoute(
        path: AppRoutes.searchViewer,
        name: 'search-viewer',
        builder: (_, state) {
          final extra = state.extra;
          if (extra is! SearchViewerArgs) {
            return const Scaffold(
              backgroundColor: Colors.black,
              body: Center(child: Text('Missing clip', style: TextStyle(color: Colors.white))),
            );
          }
          return SearchClipViewerPage(args: extra);
        },
      ),
    ],
    errorBuilder: (_, state) => Scaffold(
      body: Center(child: Text('Route not found: ${state.uri}')),
    ),
  );
}
