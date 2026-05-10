import 'package:dartz/dartz.dart';

import '../error/failures.dart';

/// Base class for all use cases.
/// [Type] is the return type, [Params] is the input parameter type.
abstract class UseCase<Type, Params> {
  Future<Either<Failure, Type>> call(Params params);
}

/// Use case with no parameters.
abstract class NoParamsUseCase<Type> {
  Future<Either<Failure, Type>> call();
}

/// Use case that returns a stream (for realtime/reactive use cases).
abstract class StreamUseCase<Type, Params> {
  Stream<Either<Failure, Type>> call(Params params);
}

/// Sentinel type for use cases that take no parameters.
class NoParams {
  const NoParams();
}
