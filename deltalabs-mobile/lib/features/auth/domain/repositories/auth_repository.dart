import 'package:dartz/dartz.dart';

import 'package:deltalabs_mobile/core/error/failures.dart';

/// Auth repository contract matching the DeltaLabs backend API.
/// Uses opaque session tokens — no refresh token.
abstract class AuthRepository {
  /// Sign in with identity (username/email/phone) and password.
  Future<Either<Failure, AuthSession>> signIn({
    required String identity,
    required String password,
  });

  /// Sign out and clear local session.
  Future<Either<Failure, void>> signOut();

  /// Get the currently authenticated user from the active session.
  Future<Either<Failure, AuthUser?>> getCurrentUser();

  /// Check if a session token is stored locally.
  Future<bool> isAuthenticated();

  /// Stream of auth state changes.
  Stream<AuthState> get authStateStream;
}

/// Session issued on successful login.
class AuthSession {
  const AuthSession({
    required this.accessToken,
    required this.sessionId,
    required this.userId,
    required this.expiresAt,
    required this.user,
  });

  final String accessToken;
  final String sessionId;
  final String userId;
  final DateTime expiresAt;
  final AuthUser user;
}

/// Public user data returned by the backend.
class AuthUser {
  const AuthUser({
    required this.userId,
    required this.username,
    this.email,
    this.phoneE164,
    required this.isVerified,
  });

  final String userId;
  final String username;
  final String? email;
  final String? phoneE164;
  final bool isVerified;
}

/// Represents the current authentication state.
sealed class AuthState {
  const AuthState();
}

class AuthAuthenticated extends AuthState {
  const AuthAuthenticated({required this.user});
  final AuthUser user;
}

class AuthUnauthenticated extends AuthState {
  const AuthUnauthenticated();
}

class AuthLoading extends AuthState {
  const AuthLoading();
}
