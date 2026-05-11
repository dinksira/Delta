import 'dart:io';

import 'package:dio/dio.dart';

import 'package:deltalabs_mobile/core/error/exceptions.dart';
import 'package:deltalabs_mobile/core/error/failures.dart';
import 'package:deltalabs_mobile/core/logging/app_logger.dart';

/// Converts raw exceptions into typed [Failure] objects.
/// Used in repository implementations to normalize errors across layers.
class ErrorHandler {
  ErrorHandler._();

  /// Maps a [DioException] to a domain [Failure].
  static Failure fromDioException(DioException e) {
    AppLogger.error('DioException: ${e.type}', error: e, stackTrace: e.stackTrace);

    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return const TimeoutFailure();

      case DioExceptionType.connectionError:
        return const NoInternetFailure();

      case DioExceptionType.badResponse:
        return _fromStatusCode(e.response?.statusCode, e.response?.data);

      case DioExceptionType.cancel:
        return const NetworkFailure(message: 'Request cancelled', code: 'CANCELLED');

      default:
        return UnknownFailure(message: e.message ?? 'Network error');
    }
  }

  /// Maps an [AppException] to a domain [Failure].
  static Failure fromException(AppException e) {
    return switch (e) {
      NetworkException() => NetworkFailure(message: e.message, code: e.code),
      TimeoutException() => TimeoutFailure(message: e.message, code: e.code),
      NoInternetException() => NoInternetFailure(message: e.message, code: e.code),
      ServerException() => ServerFailure(message: e.message, code: e.code, statusCode: e.statusCode),
      UnauthorizedException() => UnauthorizedFailure(message: e.message, code: e.code),
      ForbiddenException() => ForbiddenFailure(message: e.message, code: e.code),
      CacheException() => CacheFailure(message: e.message, code: e.code),
      DatabaseException() => DatabaseFailure(message: e.message, code: e.code),
      AuthException() => AuthFailure(message: e.message, code: e.code),
      ValidationException() => ValidationFailure(
          message: e.message,
          code: e.code,
          fieldErrors: e.fieldErrors,
        ),
      _ => UnknownFailure(message: e.message),
    };
  }

  /// Maps a generic [Object] to a domain [Failure].
  static Failure fromObject(Object e, StackTrace stackTrace) {
    AppLogger.error('Unhandled error', error: e, stackTrace: stackTrace);

    if (e is DioException) return fromDioException(e);
    if (e is AppException) return fromException(e);
    if (e is SocketException) return const NoInternetFailure();

    return const UnknownFailure();
  }

  static Failure _fromStatusCode(int? statusCode, dynamic data) {
    final message = _extractMessage(data);
    final code = statusCode?.toString();

    return switch (statusCode) {
      400 => ValidationFailure(message: message ?? 'Bad request', code: code),
      401 => UnauthorizedFailure(message: message ?? 'Unauthorized', code: code),
      403 => ForbiddenFailure(message: message ?? 'Access denied', code: code),
      404 => NotFoundFailure(message: message ?? 'Not found', code: code),
      409 => ConflictFailure(message: message ?? 'Conflict', code: code),
      422 => ValidationFailure(message: message ?? 'Validation error', code: code),
      final s when s != null && s >= 500 => ServerFailure(
          message: message ?? 'Server error',
          code: code,
          statusCode: statusCode,
        ),
      _ => ServerFailure(
          message: message ?? 'Unexpected response',
          code: code,
          statusCode: statusCode,
        ),
    };
  }

  static String? _extractMessage(dynamic data) {
    if (data is Map<String, dynamic>) {
      return data['message'] as String? ??
          data['error'] as String? ??
          data['detail'] as String?;
    }
    return null;
  }
}
