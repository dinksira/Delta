import '../../../../core/network/api_client.dart';
import '../../domain/repositories/auth_repository.dart';
import '../models/user_model.dart';

abstract class AuthRemoteDataSource {
  Future<AuthTokens> signIn({
    required String email,
    required String password,
    required String tenantId,
  });

  Future<UserModel> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    required String tenantId,
  });

  Future<void> signOut();
  Future<UserModel> getCurrentUser();
  Future<AuthTokens> refreshToken(String refreshToken);
}

class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  AuthRemoteDataSourceImpl({required this.apiClient});

  final ApiClient apiClient;

  @override
  Future<AuthTokens> signIn({
    required String email,
    required String password,
    required String tenantId,
  }) async {
    final response = await apiClient.post<Map<String, dynamic>>(
      '/auth/login',
      data: {
        'email': email,
        'password': password,
        'tenant_id': tenantId,
      },
    );

    final data = response.data!;
    return AuthTokens(
      accessToken: data['access_token'] as String,
      refreshToken: data['refresh_token'] as String,
      expiresAt: DateTime.parse(data['expires_at'] as String),
    );
  }

  @override
  Future<UserModel> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    required String tenantId,
  }) async {
    final response = await apiClient.post<Map<String, dynamic>>(
      '/auth/register',
      data: {
        'email': email,
        'password': password,
        'first_name': firstName,
        'last_name': lastName,
        'tenant_id': tenantId,
      },
    );
    return UserModel.fromJson(response.data!);
  }

  @override
  Future<void> signOut() async {
    await apiClient.post('/auth/logout');
  }

  @override
  Future<UserModel> getCurrentUser() async {
    final response = await apiClient.get<Map<String, dynamic>>('/auth/me');
    return UserModel.fromJson(response.data!);
  }

  @override
  Future<AuthTokens> refreshToken(String refreshToken) async {
    final response = await apiClient.post<Map<String, dynamic>>(
      '/auth/refresh',
      data: {'refresh_token': refreshToken},
    );
    final data = response.data!;
    return AuthTokens(
      accessToken: data['access_token'] as String,
      refreshToken: data['refresh_token'] as String,
      expiresAt: DateTime.parse(data['expires_at'] as String),
    );
  }
}
