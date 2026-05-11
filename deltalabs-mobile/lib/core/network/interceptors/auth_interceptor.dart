import 'package:dio/dio.dart';

import 'package:deltalabs_mobile/core/storage/secure_storage.dart';
import 'package:deltalabs_mobile/core/logging/app_logger.dart';

/// Attaches the Bearer token to every outgoing request.
/// On 401, attempts a token refresh and retries the original request once.
class AuthInterceptor extends Interceptor {
  AuthInterceptor({required this.secureStorage});

  final SecureStorage secureStorage;

  // Prevent infinite refresh loops
  bool _isRefreshing = false;
  final List<_PendingRequest> _pendingRequests = [];

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
    if (err.response?.statusCode != 401) {
      handler.next(err);
      return;
    }

    // Avoid re-intercepting the refresh request itself
    if (err.requestOptions.path.contains('/auth/refresh')) {
      handler.next(err);
      return;
    }

    if (_isRefreshing) {
      // Queue the request until refresh completes
      _pendingRequests.add(_PendingRequest(err, handler));
      return;
    }

    _isRefreshing = true;

    try {
      final refreshToken = await secureStorage.getRefreshToken();
      if (refreshToken == null) {
        _rejectAll(err);
        handler.next(err);
        return;
      }

      // Perform token refresh
      final dio = Dio();
      final response = await dio.post(
        '${err.requestOptions.baseUrl}/auth/refresh',
        data: {'refresh_token': refreshToken},
      );

      final newAccessToken = response.data['access_token'] as String;
      final newRefreshToken = response.data['refresh_token'] as String?;

      await secureStorage.saveAccessToken(newAccessToken);
      if (newRefreshToken != null) {
        await secureStorage.saveRefreshToken(newRefreshToken);
      }

      // Retry original request
      err.requestOptions.headers['Authorization'] = 'Bearer $newAccessToken';
      final retryResponse = await dio.fetch(err.requestOptions);
      handler.resolve(retryResponse);

      // Retry all pending requests
      for (final pending in _pendingRequests) {
        pending.options.requestOptions.headers['Authorization'] =
            'Bearer $newAccessToken';
        try {
          final r = await dio.fetch(pending.options.requestOptions);
          pending.handler.resolve(r);
        } catch (e) {
          pending.handler.next(pending.options);
        }
      }
    } catch (e) {
      AppLogger.error('Token refresh failed', error: e);
      await secureStorage.clearTokens();
      _rejectAll(err);
      handler.next(err);
    } finally {
      _isRefreshing = false;
      _pendingRequests.clear();
    }
  }

  void _rejectAll(DioException err) {
    for (final pending in _pendingRequests) {
      pending.handler.next(err);
    }
  }
}

class _PendingRequest {
  const _PendingRequest(this.options, this.handler);
  final DioException options;
  final ErrorInterceptorHandler handler;
}
