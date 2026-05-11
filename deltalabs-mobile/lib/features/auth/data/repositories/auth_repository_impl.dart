import 'dart:async';

import 'package:dartz/dartz.dart';
import 'package:rxdart/rxdart.dart';

import 'package:deltalabs_mobile/core/error/error_handler.dart';
import 'package:deltalabs_mobile/core/error/failures.dart';
import 'package:deltalabs_mobile/core/storage/secure_storage.dart';
import 'package:deltalabs_mobile/features/auth/domain/entities/user.dart';
import 'package:deltalabs_mobile/features/auth/domain/repositories/auth_repository.dart';
import 'package:deltalabs_mobile/features/auth/data/data_sources/auth_remote_data_source.dart';

/// Concrete implementation of [AuthRepository].
/// Coordinates between remote API and local secure storage.
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
  Future<Either<Failure, AuthTokens>> signIn({
    required String email,
    required String password,
    required String tenantId,
  }) async {
    try {
      final result = await remoteDataSource.signIn(
        email: email,
        password: password,
        tenantId: tenantId,
      );

      // Persist tokens securely
      await secureStorage.saveAccessToken(result.accessToken);
      await secureStorage.saveRefreshToken(result.refreshToken);
      await secureStorage.saveTenantId(tenantId);

      // Fetch and cache user profile
      final userResult = await getCurrentUser();
      userResult.fold(
        (_) => _authStateController.add(const AuthUnauthenticated()),
        (user) {
          if (user != null) {
            _authStateController.add(AuthAuthenticated(user: user));
          }
        },
      );

      return Right(result);
    } catch (e, st) {
      return Left(ErrorHandler.fromObject(e, st));
    }
  }

  @override
  Future<Either<Failure, User>> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    required String tenantId,
  }) async {
    try {
      final userModel = await remoteDataSource.register(
        email: email,
        password: password,
        firstName: firstName,
        lastName: lastName,
        tenantId: tenantId,
      );
      return Right(userModel.toDomain());
    } catch (e, st) {
      return Left(ErrorHandler.fromObject(e, st));
    }
  }

  @override
  Future<Either<Failure, void>> signOut() async {
    try {
      await remoteDataSource.signOut();
      await secureStorage.clearAll();
      _authStateController.add(const AuthUnauthenticated());
      return const Right(null);
    } catch (e, st) {
      // Always clear local state even if remote call fails
      await secureStorage.clearAll();
      _authStateController.add(const AuthUnauthenticated());
      return Left(ErrorHandler.fromObject(e, st));
    }
  }

  @override
  Future<Either<Failure, User?>> getCurrentUser() async {
    try {
      final token = await secureStorage.getAccessToken();
      if (token == null) return const Right(null);

      final userModel = await remoteDataSource.getCurrentUser();
      return Right(userModel.toDomain());
    } catch (e, st) {
      return Left(ErrorHandler.fromObject(e, st));
    }
  }

  @override
  Future<Either<Failure, AuthTokens>> refreshToken(String refreshToken) async {
    try {
      final tokens = await remoteDataSource.refreshToken(refreshToken);
      await secureStorage.saveAccessToken(tokens.accessToken);
      await secureStorage.saveRefreshToken(tokens.refreshToken);
      return Right(tokens);
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
