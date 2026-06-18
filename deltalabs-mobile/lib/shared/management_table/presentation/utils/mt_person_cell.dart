class MtPersonCellValue {
  const MtPersonCellValue({
    required this.userId,
    this.fullName,
    this.username,
    this.email,
  });

  factory MtPersonCellValue.fromRaw(Object? raw) {
    if (raw is Map) {
      return MtPersonCellValue(
        userId: (raw['userId'] ?? raw['user_id'] ?? '').toString(),
        fullName: raw['fullName']?.toString() ?? raw['full_name']?.toString(),
        username: raw['username']?.toString(),
        email: raw['email']?.toString(),
      );
    }
    if (raw is String && raw.trim().isNotEmpty) {
      return MtPersonCellValue(userId: '', fullName: raw.trim());
    }
    return const MtPersonCellValue(userId: '');
  }

  final String userId;
  final String? fullName;
  final String? username;
  final String? email;

  bool get isEmpty =>
      userId.isEmpty &&
      (fullName == null || fullName!.trim().isEmpty) &&
      (username == null || username!.trim().isEmpty) &&
      (email == null || email!.trim().isEmpty);

  String get displayName {
    final name = fullName?.trim();
    if (name != null && name.isNotEmpty) return name;
    final user = username?.trim();
    if (user != null && user.isNotEmpty) return user;
    final mail = email?.trim();
    if (mail != null && mail.isNotEmpty) return mail;
    return '';
  }

  Map<String, dynamic> toJson() {
    return {
      if (userId.isNotEmpty) 'userId': userId,
      if (fullName != null && fullName!.trim().isNotEmpty) 'fullName': fullName!.trim(),
      if (username != null && username!.trim().isNotEmpty) 'username': username!.trim(),
      if (email != null && email!.trim().isNotEmpty) 'email': email!.trim(),
    };
  }
}

bool mtColumnUsesPersonPicker(Map<String, dynamic> settings) {
  final editor = settings['cellEditor']?.toString();
  return editor == 'person';
}
