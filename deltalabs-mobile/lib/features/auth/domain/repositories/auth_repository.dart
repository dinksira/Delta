import 'package:dartz/dartz.dart';

import 'package:deltalabs_mobile/core/error/failures.dart';
import 'package:deltalabs_mobile/features/auth/domain/entities/user.dart';

/// Auth repository contract.
/// The data layer provides the concrete implementation.
abstract class AuthRepository {
  /// Sign in with email and password.
  Future<Either<Failure, AuthTokens>> signIn({
    required String email,
    required String password,
    required String tenantId,
  });

  /// Register a new user.
  Future<Either<Failure, User>> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    required String tenantId,
  });

  /// Sign out and clear local session.
  Future<Either<Failure, void>> signOut();

  /// Get the currently authenticated user.
  Future<Either<Failure, User?>> getCurrentUser();

  /// Refresh the access token.
  Future<Either<Failure, AuthTokens>> refreshToken(String refreshToken);

  /// Check if a session is currently active.
  Future<bool> isAuthenticated();

  /// Stream of auth state changes.
  Stream<AuthState> get authStateStream;
}

/// Auth token pair returned on successful sign-in.
class AuthTokens {
  const AuthTokens({
    required this.accessToken,
    required this.refreshToken,
    required this.expiresAt,
  });

  final String accessToken;
  final String refreshToken;
  final DateTime expiresAt;
}

/// Represents the current authentication state.
sealed class AuthState {
  const AuthState();
}

class AuthAuthenticated extends AuthState {
  const AuthAuthenticated({required this.user});
  final User user;
}

class AuthUnauthenticated extends AuthState {
  const AuthUnauthenticated();
}

class AuthLoading extends AuthState {
  const AuthLoading();
}
