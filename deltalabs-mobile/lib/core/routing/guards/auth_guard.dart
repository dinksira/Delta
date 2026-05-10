import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import 'package:deltalabs_mobile/core/routing/app_routes.dart';

/// Route guard that redirects unauthenticated users to login.
/// Implements [Listenable] so GoRouter can react to auth state changes.
class AuthGuard extends ChangeNotifier {
  AuthGuard(this._ref) {
    // Listen to auth state changes and notify GoRouter to re-evaluate redirects
    // TODO: Replace with actual auth state provider once auth feature is implemented
    // _ref.listen(authStateProvider, (_, __) => notifyListeners());
  }

  final Ref _ref;

  /// Called by GoRouter on every navigation attempt.
  /// Returns a redirect path or null to allow navigation.
  String? redirect(BuildContext context, GoRouterState state) {
    final isAuthenticated = _isAuthenticated();
    final isOnAuthRoute = _isAuthRoute(state.matchedLocation);
    final isOnSplash = state.matchedLocation == AppRoutes.splash;

    // Allow splash to handle its own navigation
    if (isOnSplash) return null;

    // Redirect unauthenticated users to login
    if (!isAuthenticated && !isOnAuthRoute) {
      return AppRoutes.login;
    }

    // Redirect authenticated users away from auth routes
    if (isAuthenticated && isOnAuthRoute) {
      return AppRoutes.home;
    }

    return null;
  }

  bool _isAuthenticated() {
    // TODO: Replace with actual auth state check
    // return _ref.read(authStateProvider).isAuthenticated;
    return false; // Default to unauthenticated until auth feature is built
  }

  bool _isAuthRoute(String location) {
    return location.startsWith('/auth');
  }
}
