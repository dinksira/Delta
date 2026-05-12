import 'package:dartz/dartz.dart';

import 'package:deltalabs_mobile/core/domain/use_case.dart';
import 'package:deltalabs_mobile/core/error/failures.dart';
import 'package:deltalabs_mobile/features/auth/domain/repositories/auth_repository.dart';

class SignInParams {
  const SignInParams({
    required this.identity,
    required this.password,
  });

  /// Username, email, or phone number — backend accepts any.
  final String identity;
  final String password;
}

/// Signs in a user and persists the session token.
class SignInUseCase extends UseCase<AuthSession, SignInParams> {
  SignInUseCase({required this.repository});

  final AuthRepository repository;

  @override
  Future<Either<Failure, AuthSession>> call(SignInParams params) {
    return repository.signIn(
      identity: params.identity,
      password: params.password,
    );
  }
}
