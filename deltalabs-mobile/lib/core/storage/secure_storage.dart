import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Abstraction over [FlutterSecureStorage] for token and sensitive data management.
/// Uses AES encryption on Android and Keychain on iOS.
class SecureStorage {
  SecureStorage()
      : _storage = const FlutterSecureStorage(
          aOptions: AndroidOptions(
            encryptedSharedPreferences: true,
          ),
          iOptions: IOSOptions(
            accessibility: KeychainAccessibility.first_unlock_this_device,
          ),
        );

  final FlutterSecureStorage _storage;

  // ── Token Management ───────────────────────────────────────────────────────

  static const _accessTokenKey = 'access_token';
  static const _refreshTokenKey = 'refresh_token';
  static const _tenantIdKey = 'tenant_id';
  static const _userIdKey = 'user_id';

  Future<void> saveAccessToken(String token) =>
      _storage.write(key: _accessTokenKey, value: token);

  Future<String?> getAccessToken() =>
      _storage.read(key: _accessTokenKey);

  Future<void> saveRefreshToken(String token) =>
      _storage.write(key: _refreshTokenKey, value: token);

  Future<String?> getRefreshToken() =>
      _storage.read(key: _refreshTokenKey);

  Future<void> saveTenantId(String tenantId) =>
      _storage.write(key: _tenantIdKey, value: tenantId);

  Future<String?> getTenantId() =>
      _storage.read(key: _tenantIdKey);

  Future<void> saveUserId(String userId) =>
      _storage.write(key: _userIdKey, value: userId);

  Future<String?> getUserId() =>
      _storage.read(key: _userIdKey);

  Future<void> clearTokens() async {
    await Future.wait([
      _storage.delete(key: _accessTokenKey),
      _storage.delete(key: _refreshTokenKey),
    ]);
  }

  Future<void> clearAll() => _storage.deleteAll();

  // ── Generic Key-Value ──────────────────────────────────────────────────────

  Future<void> write({required String key, required String value}) =>
      _storage.write(key: key, value: value);

  Future<String?> read({required String key}) =>
      _storage.read(key: key);

  Future<void> delete({required String key}) =>
      _storage.delete(key: key);

  Future<bool> containsKey({required String key}) =>
      _storage.containsKey(key: key);
}
