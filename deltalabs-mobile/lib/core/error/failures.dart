import 'package:equatable/equatable.dart';

/// Base class for all domain-level failures.
/// Used with [Either] from dartz for functional error handling.
abstract class Failure extends Equatable {
  const Failure({required this.message, this.code});

  final String message;
  final String? code;

  @override
  List<Object?> get props => [message, code];
}

// ── Network Failures ──────────────────────────────────────────────────────────

class NetworkFailure extends Failure {
  const NetworkFailure({required super.message, super.code});
}

class TimeoutFailure extends Failure {
  const TimeoutFailure({super.message = 'Request timed out', super.code});
}

class NoInternetFailure extends Failure {
  const NoInternetFailure({super.message = 'No internet connection', super.code});
}

class ServerFailure extends Failure {
  const ServerFailure({required super.message, super.code, this.statusCode});
  final int? statusCode;

  @override
  List<Object?> get props => [...super.props, statusCode];
}

class UnauthorizedFailure extends Failure {
  const UnauthorizedFailure({super.message = 'Unauthorized', super.code = '401'});
}

class ForbiddenFailure extends Failure {
  const ForbiddenFailure({super.message = 'Access denied', super.code = '403'});
}

class NotFoundFailure extends Failure {
  const NotFoundFailure({super.message = 'Resource not found', super.code = '404'});
}

// ── Cache / Storage Failures ──────────────────────────────────────────────────

class CacheFailure extends Failure {
  const CacheFailure({required super.message, super.code});
}

class DatabaseFailure extends Failure {
  const DatabaseFailure({required super.message, super.code});
}

// ── Auth Failures ─────────────────────────────────────────────────────────────

class AuthFailure extends Failure {
  const AuthFailure({required super.message, super.code});
}

class SessionExpiredFailure extends Failure {
  const SessionExpiredFailure({super.message = 'Session expired', super.code});
}

// ── Validation Failures ───────────────────────────────────────────────────────

class ValidationFailure extends Failure {
  const ValidationFailure({required super.message, super.code, this.fieldErrors});
  final Map<String, List<String>>? fieldErrors;

  @override
  List<Object?> get props => [...super.props, fieldErrors];
}

// ── Sync Failures ─────────────────────────────────────────────────────────────

class SyncFailure extends Failure {
  const SyncFailure({required super.message, super.code});
}

class ConflictFailure extends Failure {
  const ConflictFailure({required super.message, super.code});
}

// ── Unknown ───────────────────────────────────────────────────────────────────

class UnknownFailure extends Failure {
  const UnknownFailure({super.message = 'An unexpected error occurred', super.code});
}
