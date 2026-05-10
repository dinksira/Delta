import 'package:dartz/dartz.dart';

import '../../../../core/domain/use_case.dart';
import '../../../../core/error/failures.dart';
import '../entities/user.dart';
import '../repositories/auth_repository.dart';

class SignInParams {
  const SignInParams({
    required this.email,
    required this.password,
    required this.tenantId,
  });

  final String email;
  final String password;
  final String tenantId;
}

/// Signs in a user and persists the session tokens.
class SignInUseCase extends UseCase<AuthTokens, SignInParams> {
  SignInUseCase({required this.repository});

  final AuthRepository repository;

  @override
  Future<Either<Failure, AuthTokens>> call(SignInParams params) {
    return repository.signIn(
      email: params.email,
      password: params.password,
      tenantId: params.tenantId,
    );
  }
}
