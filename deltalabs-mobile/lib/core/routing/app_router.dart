import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'app_routes.dart';
import 'guards/auth_guard.dart';

part 'app_router.g.dart';

/// Root router provider.
/// Rebuilds when auth state changes to redirect unauthenticated users.
@riverpod
GoRouter appRouter(AppRouterRef ref) {
  final authGuard = AuthGuard(ref);

  return GoRouter(
    initialLocation: AppRoutes.splash,
    debugLogDiagnostics: true,
    redirect: authGuard.redirect,
    refreshListenable: authGuard,
    routes: [
      // ── Splash ─────────────────────────────────────────────────────────────
      GoRoute(
        path: AppRoutes.splash,
        name: 'splash',
        builder: (context, state) => const _SplashPlaceholder(),
      ),

      // ── Auth ───────────────────────────────────────────────────────────────
      GoRoute(
        path: AppRoutes.login,
        name: 'login',
        builder: (context, state) => const _PlaceholderPage(title: 'Login'),
      ),
      GoRoute(
        path: AppRoutes.register,
        name: 'register',
        builder: (context, state) => const _PlaceholderPage(title: 'Register'),
      ),

      // ── Main Shell ─────────────────────────────────────────────────────────
      ShellRoute(
        builder: (context, state, child) => _MainShell(child: child),
        routes: [
          GoRoute(
            path: AppRoutes.home,
            name: 'home',
            builder: (context, state) => const _PlaceholderPage(title: 'Home'),
          ),
          GoRoute(
            path: AppRoutes.feed,
            name: 'feed',
            builder: (context, state) => const _PlaceholderPage(title: 'Feed'),
          ),
          GoRoute(
            path: AppRoutes.classes,
            name: 'classes',
            builder: (context, state) => const _PlaceholderPage(title: 'Classes'),
          ),
          GoRoute(
            path: AppRoutes.library,
            name: 'library',
            builder: (context, state) => const _PlaceholderPage(title: 'Library'),
          ),
          GoRoute(
            path: AppRoutes.profile,
            name: 'profile',
            builder: (context, state) => const _PlaceholderPage(title: 'Profile'),
          ),
        ],
      ),
    ],
    errorBuilder: (context, state) => _ErrorPage(error: state.error),
  );
}

// ── Placeholder widgets (replaced as features are implemented) ────────────────

class _SplashPlaceholder extends StatelessWidget {
  const _SplashPlaceholder();

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Text(
          'DeltaLabs',
          style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }
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

class _MainShell extends StatelessWidget {
  const _MainShell({required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) => child;
}

class _ErrorPage extends StatelessWidget {
  const _ErrorPage({this.error});
  final Exception? error;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Text('Navigation error: ${error?.toString() ?? 'Unknown'}'),
      ),
    );
  }
}
