import 'package:freezed_annotation/freezed_annotation.dart';

import '../../domain/entities/user.dart';

part 'user_model.freezed.dart';
/// Data transfer object for User — manual fromJson to avoid codegen issues.
@freezed
abstract class UserModel with _$UserModel {
  const factory UserModel({
    required String id,
    required String email,
    required String firstName,
    required String lastName,
    required String tenantId,
    required String role,
    String? avatarUrl,
    String? phoneNumber,
    @Default(false) bool isEmailVerified,
    @Default(false) bool isPhoneVerified,
    DateTime? lastLoginAt,
    DateTime? createdAt,
  }) = _UserModel;

  factory UserModel.fromJson(Map<String, dynamic> json) => UserModel(
        id: json['id'] as String,
        email: json['email'] as String,
        firstName: json['first_name'] as String,
        lastName: json['last_name'] as String,
        tenantId: json['tenant_id'] as String,
        role: json['role'] as String,
        avatarUrl: json['avatar_url'] as String?,
        phoneNumber: json['phone_number'] as String?,
        isEmailVerified: json['is_email_verified'] as bool? ?? false,
        isPhoneVerified: json['is_phone_verified'] as bool? ?? false,
        lastLoginAt: json['last_login_at'] != null
            ? DateTime.tryParse(json['last_login_at'] as String)
            : null,
        createdAt: json['created_at'] != null
            ? DateTime.tryParse(json['created_at'] as String)
            : null,
      );

  const UserModel._();

  User toDomain() => User(
        id: id,
        email: email,
        firstName: firstName,
        lastName: lastName,
        tenantId: tenantId,
        role: _parseRole(role),
        avatarUrl: avatarUrl,
        phoneNumber: phoneNumber,
        isEmailVerified: isEmailVerified,
        isPhoneVerified: isPhoneVerified,
        lastLoginAt: lastLoginAt,
        createdAt: createdAt,
      );

  static UserRole _parseRole(String role) => UserRole.values.firstWhere(
        (r) => r.name == role,
        orElse: () => UserRole.student,
      );
}
