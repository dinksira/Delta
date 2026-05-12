import 'package:dartz/dartz.dart';
import 'package:deltalabs_mobile/core/error/error_handler.dart';
import 'package:deltalabs_mobile/core/error/failures.dart';
import 'package:deltalabs_mobile/core/storage/secure_storage.dart';
import 'package:deltalabs_mobile/features/auth/data/data_sources/auth_remote_data_source.dart';
import 'package:deltalabs_mobile/features/auth/domain/repositories/auth_repository.dart';
import 'package:rxdart/rxdart.dart';

/// Concrete implementation of [AuthRepository].
/// Coordinates between the remote API and local secure storage.
/// The backend uses opaque session tokens — no refresh token.
class AuthRepositoryImpl implements AuthRepository {
  AuthRepositoryImpl({
    required this.remoteDataSource,
    required this.secureStorage,
  });

  final AuthRemoteDataSource remoteDataSource;
  final SecureStorage secureStorage;

  final _authStateController = BehaviorSubject<AuthState>.seeded(
    const AuthLoading(),
  );

  @override
  Stream<AuthState> get authStateStream => _authStateController.stream;

  @override
  Future<Either<Failure, AuthSession>> signIn({
    required String identity,
    required String password,
  }) async {
    try {
      final session = await remoteDataSource.signIn(
        identity: identity,
        password: password,
      );

      // Persist session token and user id securely
      await secureStorage.saveAccessToken(session.accessToken);
      await secureStorage.saveUserId(session.userId);

      _authStateController.add(AuthAuthenticated(user: session.user));

      return Right(session);
    } catch (e, st) {
      return Left(ErrorHandler.fromObject(e, st));
    }
  }

  @override
  Future<Either<Failure, void>> signOut() async {
    try {
      final token = await secureStorage.getAccessToken();
      if (token != null) {
        await remoteDataSource.signOut(token);
      }
    } catch (_) {
      // Always clear local state even if remote call fails
    } finally {
      await secureStorage.clearAll();
      _authStateController.add(const AuthUnauthenticated());
    }
    return const Right(null);
  }

  @override
  Future<Either<Failure, AuthUser?>> getCurrentUser() async {
    try {
      final token = await secureStorage.getAccessToken();
      if (token == null) return const Right(null);

      final user = await remoteDataSource.getSession(token);
      _authStateController.add(AuthAuthenticated(user: user));
      return Right(user);
    } catch (e, st) {
      return Left(ErrorHandler.fromObject(e, st));
    }
  }

  @override
  Future<bool> isAuthenticated() async {
    final token = await secureStorage.getAccessToken();
    return token != null;
  }
}
