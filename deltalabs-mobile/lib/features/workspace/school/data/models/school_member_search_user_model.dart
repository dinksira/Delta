class SchoolMemberSearchUserModel {
  const SchoolMemberSearchUserModel({
    required this.userId,
    this.username,
    this.email,
    this.fullName,
  });

  factory SchoolMemberSearchUserModel.fromJson(Map<String, dynamic> json) {
    return SchoolMemberSearchUserModel(
      userId: (json['userId'] ?? json['user_id'] ?? '').toString(),
      username: json['username'] as String?,
      email: json['email'] as String?,
      fullName: json['fullName'] as String? ?? json['full_name'] as String?,
    );
  }

  final String userId;
  final String? username;
  final String? email;
  final String? fullName;

  String get displayName {
    final name = fullName?.trim();
    if (name != null && name.isNotEmpty) return name;
    final user = username?.trim();
    if (user != null && user.isNotEmpty) return user;
    final mail = email?.trim();
    if (mail != null && mail.isNotEmpty) return mail;
    return 'Student';
  }

  String? get displaySecondary {
    final mail = email?.trim();
    final name = fullName?.trim();
    if (mail != null && mail.isNotEmpty && name != null && name.isNotEmpty) {
      return mail;
    }
    return null;
  }

  Map<String, dynamic> toPersonCellValue() {
    return {
      'userId': userId,
      if (fullName != null && fullName!.trim().isNotEmpty) 'fullName': fullName!.trim(),
      if (username != null && username!.trim().isNotEmpty) 'username': username!.trim(),
      if (email != null && email!.trim().isNotEmpty) 'email': email!.trim(),
    };
  }
}
