/// Base class for all infrastructure-level exceptions.
/// These are caught at the data layer and converted to [Failure] objects.
abstract class AppException implements Exception {
  const AppException({required this.message, this.code});

  final String message;
  final String? code;

  @override
  String toString() => '$runtimeType: $message (code: $code)';
}

class NetworkException extends AppException {
  const NetworkException({required super.message, super.code});
}

class TimeoutException extends AppException {
  const TimeoutException({super.message = 'Request timed out', super.code});
}

class NoInternetException extends AppException {
  const NoInternetException({super.message = 'No internet connection', super.code});
}

class ServerException extends AppException {
  const ServerException({required super.message, super.code, this.statusCode});
  final int? statusCode;
}

class UnauthorizedException extends AppException {
  const UnauthorizedException({super.message = 'Unauthorized', super.code = '401'});
}

class ForbiddenException extends AppException {
  const ForbiddenException({super.message = 'Access denied', super.code = '403'});
}

class CacheException extends AppException {
  const CacheException({required super.message, super.code});
}

class DatabaseException extends AppException {
  const DatabaseException({required super.message, super.code});
}

class AuthException extends AppException {
  const AuthException({required super.message, super.code});
}

class ValidationException extends AppException {
  const ValidationException({
    required super.message,
    super.code,
    this.fieldErrors,
  });
  final Map<String, List<String>>? fieldErrors;
}
