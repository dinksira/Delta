import 'package:deltalabs_mobile/core/domain/entity.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'user.freezed.dart';

/// Core user domain entity.
/// This is the canonical user representation across all features.
@freezed
abstract class User with _$User implements Entity {
  const factory User({
    required String id,
    required String email,
    required String firstName,
    required String lastName,
    required String tenantId,
    required UserRole role,
    String? avatarUrl,
    String? phoneNumber,
    @Default(false) bool isEmailVerified,
    @Default(false) bool isPhoneVerified,
    DateTime? lastLoginAt,
    DateTime? createdAt,
  }) = _User;

  const User._();

  String get fullName => '$firstName $lastName';
  String get initials =>
      '${firstName.isNotEmpty ? firstName[0] : ''}${lastName.isNotEmpty ? lastName[0] : ''}'
          .toUpperCase();
}

enum UserRole {
  student,
  teacher,
  parent,
  admin,
  superAdmin,
  hrManager,
  financeManager,
  librarian,
}
