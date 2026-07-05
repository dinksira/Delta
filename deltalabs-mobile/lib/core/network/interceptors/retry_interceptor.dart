import 'package:deltalabs_mobile/core/logging/app_logger.dart';
import 'package:dio/dio.dart';

/// Automatically retries failed requests with exponential backoff.
/// Only retries on network errors and 5xx server errors.
class RetryInterceptor extends Interceptor {
  RetryInterceptor({this.maxRetries = 3});

  final int maxRetries;

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final attempt = err.requestOptions.extra['_retryCount'] as int? ?? 0;

    final shouldRetry = _shouldRetry(err) && attempt < maxRetries;

    if (!shouldRetry) {
      handler.next(err);
      return;
    }

    final nextAttempt = attempt + 1;
    final delay = _backoffDelay(nextAttempt);

    AppLogger.warning(
      'Retrying request (attempt $nextAttempt/$maxRetries) '
      'after ${delay.inMilliseconds}ms: ${err.requestOptions.path}',
    );

    await Future<void>.delayed(delay);

    err.requestOptions.extra['_retryCount'] = nextAttempt;

    try {
      final dio = Dio();
      final response = await dio.fetch(err.requestOptions);
      handler.resolve(response);
    } on DioException catch (retryErr) {
      handler.next(retryErr);
    }
  }

  bool _shouldRetry(DioException err) {
    final data = err.response?.data;
    if (err.response?.statusCode == 503 && _isSuspendedHostingResponse(data)) {
      return false;
    }
    return switch (err.type) {
      DioExceptionType.connectionTimeout => true,
      DioExceptionType.receiveTimeout => true,
      DioExceptionType.connectionError => true,
      DioExceptionType.badResponse =>
        (err.response?.statusCode ?? 0) >= 500,
      _ => false,
    };
  }

  bool _isSuspendedHostingResponse(dynamic data) {
    if (data is! String) return false;
    final lower = data.toLowerCase();
    return lower.contains('service suspended') || lower.contains('service has been suspended');
  }

  Duration _backoffDelay(int attempt) {
    // Exponential backoff: 1s, 2s, 4s, ...
    return Duration(milliseconds: 1000 * (1 << (attempt - 1)));
  }
}
