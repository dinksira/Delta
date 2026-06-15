import 'package:deltalabs_mobile/features/workspace/school/data/models/school_class_session_model.dart';
import 'package:intl/intl.dart';

class ClassSessionGroups {
  const ClassSessionGroups({
    required this.live,
    required this.upcoming,
    required this.past,
  });

  final List<SchoolClassSessionModel> live;
  final List<SchoolClassSessionModel> upcoming;
  final List<SchoolClassSessionModel> past;
}

String classSessionTypeLabel(String sessionType) {
  switch (sessionType) {
    case 'in_person':
      return 'In person';
    case 'hybrid':
      return 'Hybrid';
    default:
      return 'Virtual';
  }
}

String classSessionStatusLabel(String status) {
  switch (status) {
    case 'live':
      return 'Live';
    case 'scheduled':
      return 'Scheduled';
    case 'completed':
      return 'Completed';
    default:
      return 'Draft';
  }
}

String formatClassSessionDate(String? iso) {
  if (iso == null || iso.trim().isEmpty) return '—';
  try {
    final parsed = DateTime.parse(iso).toLocal();
    return DateFormat.yMMMd().format(parsed);
  } catch (_) {
    return '—';
  }
}

String formatClassSessionTime(String? iso) {
  if (iso == null || iso.trim().isEmpty) return '';
  try {
    final parsed = DateTime.parse(iso).toLocal();
    return DateFormat.jm().format(parsed);
  } catch (_) {
    return '';
  }
}

String formatClassSessionDuration(int? minutes) {
  if (minutes == null || minutes <= 0) return '—';
  return '$minutes min';
}

ClassSessionGroups groupClassSessions(List<SchoolClassSessionModel> sessions) {
  final live = <SchoolClassSessionModel>[];
  final upcoming = <SchoolClassSessionModel>[];
  final past = <SchoolClassSessionModel>[];

  for (final session in sessions) {
    switch (session.status) {
      case 'live':
        live.add(session);
      case 'completed':
        past.add(session);
      case 'scheduled':
      case 'draft':
        if (session.status == 'scheduled') {
          upcoming.add(session);
        } else {
          upcoming.add(session);
        }
      default:
        upcoming.add(session);
    }
  }

  int compareSessions(SchoolClassSessionModel a, SchoolClassSessionModel b) {
    final aDate = _parseDate(a.scheduledAt) ?? _parseDate(a.createdAt);
    final bDate = _parseDate(b.scheduledAt) ?? _parseDate(b.createdAt);
    if (aDate == null && bDate == null) return 0;
    if (aDate == null) return 1;
    if (bDate == null) return -1;
    return aDate.compareTo(bDate);
  }

  live.sort(compareSessions);
  upcoming.sort(compareSessions);
  past.sort((a, b) => compareSessions(b, a));

  return ClassSessionGroups(live: live, upcoming: upcoming, past: past);
}

SchoolClassSessionModel? pickHeroSession(List<SchoolClassSessionModel> sessions) {
  if (sessions.isEmpty) return null;
  final groups = groupClassSessions(sessions);
  if (groups.live.isNotEmpty) return groups.live.first;
  if (groups.upcoming.isNotEmpty) return groups.upcoming.first;
  return groups.past.first;
}

DateTime? _parseDate(String? raw) {
  if (raw == null || raw.trim().isEmpty) return null;
  try {
    return DateTime.parse(raw).toLocal();
  } catch (_) {
    return null;
  }
}

bool canStartClassSession(SchoolClassSessionModel session, bool canMutate) {
  return canMutate &&
      session.status != 'live' &&
      session.status != 'completed';
}

bool canJoinClassSession(SchoolClassSessionModel session) {
  return session.status == 'live';
}
