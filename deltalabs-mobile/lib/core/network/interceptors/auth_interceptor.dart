import 'package:deltalabs_mobile/core/logging/app_logger.dart';
import 'package:deltalabs_mobile/core/storage/secure_storage.dart';
import 'package:dio/dio.dart';

/// Attaches the Bearer session token to every outgoing request.
/// On 401, clears the local session — the backend uses opaque tokens
/// with no refresh endpoint, so the user must log in again.
class AuthInterceptor extends Interceptor {
  AuthInterceptor({required this.secureStorage});

  final SecureStorage secureStorage;

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await secureStorage.getAccessToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    if (err.response?.statusCode == 401) {
      // Session expired or revoked — clear local token
      AppLogger.warning('Session expired — clearing local token');
      await secureStorage.clearAll();
    }
    handler.next(err);
  }
}
