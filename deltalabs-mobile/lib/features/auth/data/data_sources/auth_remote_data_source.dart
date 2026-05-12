import 'package:deltalabs_mobile/core/network/api_client.dart';
import 'package:deltalabs_mobile/features/auth/domain/repositories/auth_repository.dart';
import 'package:dio/dio.dart';

abstract class AuthRemoteDataSource {
  /// POST /auth/login — { identity, password } → AuthSession
  Future<AuthSession> signIn({
    required String identity,
    required String password,
  });

  /// POST /auth/logout — revokes the current session on the server
  Future<void> signOut(String accessToken);

  /// GET /auth/session — resolves the current session from bearer token
  Future<AuthUser> getSession(String accessToken);
}

class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  AuthRemoteDataSourceImpl({required this.apiClient});

  final ApiClient apiClient;

  @override
  Future<AuthSession> signIn({
    required String identity,
    required String password,
  }) async {
    final response = await apiClient.post<Map<String, dynamic>>(
      '/auth/login',
      data: {
        'identity': identity,
        'password': password,
      },
    );

    final data = response.data!;
    final session = data['session'] as Map<String, dynamic>;
    final user = data['user'] as Map<String, dynamic>;

    return AuthSession(
      accessToken: data['access_token'] as String,
      sessionId: session['session_id'] as String,
      userId: session['user_id'] as String,
      expiresAt: DateTime.parse(session['expires_at'] as String),
      user: AuthUser(
        userId: user['user_id'] as String,
        username: user['username'] as String,
        email: user['email'] as String?,
        phoneE164: user['phone_e164'] as String?,
        isVerified: user['is_verified'] as bool? ?? false,
      ),
    );
  }

  @override
  Future<void> signOut(String accessToken) async {
    await apiClient.post<Map<String, dynamic>>(
      '/auth/logout',
      options: Options(headers: {'Authorization': 'Bearer $accessToken'}),
    );
  }

  @override
  Future<AuthUser> getSession(String accessToken) async {
    final response = await apiClient.get<Map<String, dynamic>>(
      '/auth/session',
      options: Options(headers: {'Authorization': 'Bearer $accessToken'}),
    );

    final data = response.data!;
    final user = data['user'] as Map<String, dynamic>;

    return AuthUser(
      userId: user['user_id'] as String,
      username: user['username'] as String,
      email: user['email'] as String?,
      phoneE164: user['phone_e164'] as String?,
      isVerified: user['is_verified'] as bool? ?? false,
    );
  }
}
