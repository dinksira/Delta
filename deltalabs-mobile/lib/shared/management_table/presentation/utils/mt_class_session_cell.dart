/// Class-session cell value — matches web `managementTableClassSessionCell.ts`.
class MtClassSessionCellValue {
  const MtClassSessionCellValue({
    required this.sessionId,
    this.title,
  });

  factory MtClassSessionCellValue.fromRaw(Object? raw) {
    if (raw is Map) {
      return MtClassSessionCellValue(
        sessionId: (raw['sessionId'] ?? raw['session_id'] ?? '').toString(),
        title: raw['title']?.toString(),
      );
    }
    if (raw is String && raw.trim().isNotEmpty) {
      return MtClassSessionCellValue(sessionId: '', title: raw.trim());
    }
    return const MtClassSessionCellValue(sessionId: '');
  }

  final String sessionId;
  final String? title;

  bool get isEmpty =>
      sessionId.isEmpty && (title == null || title!.trim().isEmpty);

  String get displayLabel {
    final label = title?.trim();
    if (label != null && label.isNotEmpty) return label;
    return '';
  }

  Map<String, dynamic> toJson() {
    return {
      if (sessionId.isNotEmpty) 'sessionId': sessionId,
      if (title != null && title!.trim().isNotEmpty) 'title': title!.trim(),
    };
  }
}
