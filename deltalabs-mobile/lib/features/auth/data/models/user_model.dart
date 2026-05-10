import 'package:freezed_annotation/freezed_annotation.dart';

import '../../domain/entities/user.dart';

part 'user_model.freezed.dart';
part 'user_model.g.dart';

/// Data transfer object for User.
/// Maps between JSON (API) and the domain [User] entity.
@freezed
abstract class UserModel with _$UserModel {
  const factory UserModel({
    required String id,
    required String email,
    @JsonKey(name: 'first_name') required String firstName,
    @JsonKey(name: 'last_name') required String lastName,
    @JsonKey(name: 'tenant_id') required String tenantId,
    required String role,
    @JsonKey(name: 'avatar_url') String? avatarUrl,
    @JsonKey(name: 'phone_number') String? phoneNumber,
    @JsonKey(name: 'is_email_verified') @Default(false) bool isEmailVerified,
    @JsonKey(name: 'is_phone_verified') @Default(false) bool isPhoneVerified,
    @JsonKey(name: 'last_login_at') DateTime? lastLoginAt,
    @JsonKey(name: 'created_at') DateTime? createdAt,
  }) = _UserModel;

  factory UserModel.fromJson(Map<String, dynamic> json) =>
      _$UserModelFromJson(json);

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

  static UserRole _parseRole(String role) {
    return UserRole.values.firstWhere(
      (r) => r.name == role,
      orElse: () => UserRole.student,
    );
  }
}
