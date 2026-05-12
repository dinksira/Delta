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
import 'package:deltalabs_mobile/features/home/presentation/pages/home_page.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'app_router.g.dart';

// Auth-only routes — redirect to home if already logged in
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
      // Auth is still resolving — don't redirect, initial route is already correct
      if (authState.isLoading) return null;

      final user = authState.when(
        data: (u) => u,
        loading: () => null,
        error: (_, __) => null,
      );
      final isLoggedIn = user != null;
      final isAuthRoute = _authRoutes.contains(state.matchedLocation);

      if (isLoggedIn && isAuthRoute) return AppRoutes.home;
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

      // ── Main ───────────────────────────────────────────────────────────────
      GoRoute(
        path: AppRoutes.home,
        name: 'home',
        builder: (_, __) => const HomePage(),
      ),
    ],
    errorBuilder: (_, state) => Scaffold(
      body: Center(child: Text('Route not found: ${state.uri}')),
    ),
  );
}
