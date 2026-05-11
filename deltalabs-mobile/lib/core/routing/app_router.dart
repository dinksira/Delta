import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:deltalabs_mobile/features/auth/presentation/pages/splash_page.dart';
import 'package:deltalabs_mobile/features/auth/presentation/pages/login_page.dart';
import 'package:deltalabs_mobile/features/auth/presentation/pages/register_step1_page.dart';
import 'package:deltalabs_mobile/features/auth/presentation/pages/register_step2_page.dart';
import 'package:deltalabs_mobile/features/auth/presentation/pages/register_otp_page.dart';
import 'package:deltalabs_mobile/features/auth/presentation/pages/register_dob_page.dart';
import 'package:deltalabs_mobile/features/auth/presentation/pages/register_password_page.dart';
import 'package:deltalabs_mobile/features/auth/presentation/pages/forgot_password_page.dart';
import 'package:deltalabs_mobile/features/auth/presentation/pages/forgot_otp_page.dart';
import 'package:deltalabs_mobile/features/auth/presentation/pages/reset_password_page.dart';
import 'package:deltalabs_mobile/core/routing/app_routes.dart';

part 'app_router.g.dart';

@riverpod
GoRouter appRouter(Ref ref) {
  return GoRouter(
    initialLocation: AppRoutes.splash,
    debugLogDiagnostics: true,
    routes: [
      // ── Splash ─────────────────────────────────────────────────────────────
      GoRoute(
        path: AppRoutes.splash,
        name: 'splash',
        builder: (_, __) => const SplashPage(),
      ),

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

      // ── Main (placeholder until features are built) ────────────────────────
      GoRoute(
        path: AppRoutes.home,
        name: 'home',
        builder: (_, __) => const _PlaceholderPage(title: 'Home'),
      ),
    ],
    errorBuilder: (_, state) => Scaffold(
      body: Center(child: Text('Route not found: ${state.uri}')),
    ),
  );
}

class _PlaceholderPage extends StatelessWidget {
  const _PlaceholderPage({required this.title});
  final String title;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: Center(child: Text('$title — coming soon')),
    );
  }
}
