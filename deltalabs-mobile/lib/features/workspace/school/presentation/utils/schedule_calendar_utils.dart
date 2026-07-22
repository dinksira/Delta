import 'package:deltalabs_mobile/shared/management_table/data/models/mt_column_model.dart';
import 'package:deltalabs_mobile/shared/management_table/data/models/mt_row_model.dart';
import 'package:deltalabs_mobile/shared/management_table/presentation/utils/mt_class_session_cell.dart';
import 'package:deltalabs_mobile/shared/management_table/presentation/utils/mt_person_cell.dart';

const scheduleCalendarHourStart = 6;
const scheduleCalendarHourEnd = 22;
const scheduleCalendarSlotMinutes = 30;
const scheduleCalendarPxPerMinute = 1.15;

const _months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

String _ordinal(int day) {
  if (day >= 11 && day <= 13) return '${day}th';
  switch (day % 10) {
    case 1:
      return '${day}st';
    case 2:
      return '${day}nd';
    case 3:
      return '${day}rd';
    default:
      return '${day}th';
  }
}

/// Monday-start week containing [anchor].
DateTime startOfWeekMonday(DateTime anchor) {
  final d = DateTime(anchor.year, anchor.month, anchor.day);
  final day = d.weekday; // Mon=1 … Sun=7
  return d.subtract(Duration(days: day - 1));
}

DateTime addDays(DateTime date, int days) {
  return date.add(Duration(days: days));
}

String toDateKey(DateTime date) {
  final y = date.year;
  final m = date.month.toString().padLeft(2, '0');
  final d = date.day.toString().padLeft(2, '0');
  return '$y-$m-$d';
}

String formatScheduleWeekRangeLabel(DateTime weekStart) {
  final weekEnd = addDays(weekStart, 6);
  final startLabel = '${_ordinal(weekStart.day)} ${_months[weekStart.month - 1]}';
  final endLabel = '${_ordinal(weekEnd.day)} ${_months[weekEnd.month - 1]}';
  return '$startLabel ↔ $endLabel';
}

DateTime? parseCellDate(Object? value) {
  if (value is! String || value.trim().isEmpty) return null;
  final raw = value.trim().length >= 10 ? value.trim().substring(0, 10) : value.trim();
  final parts = raw.split('-').map(int.tryParse).toList();
  if (parts.length != 3 || parts.any((n) => n == null)) return null;
  final y = parts[0]!;
  final m = parts[1]!;
  final d = parts[2]!;
  final dt = DateTime(y, m, d);
  if (dt.year != y || dt.month != m || dt.day != d) return null;
  return dt;
}

int? parseTimeToMinutes(Object? value) {
  if (value is! String || value.trim().isEmpty) return null;
  final match = RegExp(r'^(\d{1,2}):(\d{2})').firstMatch(value.trim());
  if (match == null) return null;
  final hours = int.tryParse(match.group(1)!);
  final minutes = int.tryParse(match.group(2)!);
  if (hours == null ||
      minutes == null ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59) {
    return null;
  }
  return hours * 60 + minutes;
}

String formatMinutesAsTime(int totalMinutes) {
  final h = totalMinutes ~/ 60;
  final m = totalMinutes % 60;
  return '${h.toString().padLeft(2, '0')}:${m.toString().padLeft(2, '0')}';
}

bool isSameDateKey(DateTime date, String dateKey) => toDateKey(date) == dateKey;

bool isTodayDate(DateTime date) {
  final now = DateTime.now();
  return date.year == now.year && date.month == now.month && date.day == now.day;
}

MtColumnModel? findScheduleColumnByTitle(
  List<MtColumnModel> columns,
  String title,
) {
  final needle = title.trim().toLowerCase();
  for (final column in columns) {
    if (column.title.trim().toLowerCase() == needle) return column;
  }
  return null;
}

class ScheduleCalendarEvent {
  const ScheduleCalendarEvent({
    required this.rowId,
    required this.dateKey,
    required this.timeLabel,
    required this.startMinutes,
    required this.durationMinutes,
    required this.sessionLabel,
    required this.teacherLabel,
    required this.roomLabel,
    required this.statusLabel,
    required this.statusId,
  });

  final String rowId;
  final String dateKey;
  final String timeLabel;
  final int startMinutes;
  final int durationMinutes;
  final String sessionLabel;
  final String teacherLabel;
  final String roomLabel;
  final String statusLabel;
  final String statusId;
}

List<ScheduleCalendarEvent> buildScheduleCalendarEvents(
  List<MtRowModel> rows,
  List<MtColumnModel> columns,
) {
  final sessionCol = findScheduleColumnByTitle(columns, 'Session');
  final dateCol = findScheduleColumnByTitle(columns, 'Date');
  final timeCol = findScheduleColumnByTitle(columns, 'Time');
  final teacherCol = findScheduleColumnByTitle(columns, 'Assign Teacher');
  final roomCol = findScheduleColumnByTitle(columns, 'Class Room');
  final statusCol = findScheduleColumnByTitle(columns, 'Status');
  final durationCol = findScheduleColumnByTitle(columns, 'Duration');

  final events = <ScheduleCalendarEvent>[];
  for (final row in rows) {
    final dateVal = dateCol != null ? row.cellValue(dateCol.id) : null;
    final parsed = parseCellDate(dateVal);
    if (parsed == null) continue;

    final sessionRaw = sessionCol != null ? row.cellValue(sessionCol.id) : null;
    final sessionCell = MtClassSessionCellValue.fromRaw(sessionRaw);
    final sessionLabel =
        sessionCell.displayLabel.isNotEmpty ? sessionCell.displayLabel : 'Session';

    final timeRaw = timeCol != null ? row.cellValue(timeCol.id) : null;
    final timeLabel =
        timeRaw is String && timeRaw.trim().isNotEmpty ? timeRaw.trim() : '';
    final startMinutes = parseTimeToMinutes(timeRaw) ?? 9 * 60;

    final durationRaw = durationCol != null ? row.cellValue(durationCol.id) : null;
    var durationMinutes = 60;
    if (durationRaw is num && durationRaw > 0) {
      durationMinutes = durationRaw.round();
    } else if (durationRaw is String && durationRaw.trim().isNotEmpty) {
      final parsedDuration = int.tryParse(durationRaw.trim());
      if (parsedDuration != null && parsedDuration > 0) {
        durationMinutes = parsedDuration;
      }
    }

    final teacherRaw = teacherCol != null ? row.cellValue(teacherCol.id) : null;
    final teacherLabel = teacherCol != null
        ? MtPersonCellValue.fromRaw(teacherRaw).displayName
        : '';

    final roomRaw = roomCol != null ? row.cellValue(roomCol.id) : null;
    final roomLabel =
        roomRaw is String && roomRaw.trim().isNotEmpty ? roomRaw.trim() : '';

    var statusLabel = '';
    var statusId = '';
    if (statusCol != null) {
      final statusVal = row.cellValue(statusCol.id);
      if (statusVal is String) statusId = statusVal;
      if (statusVal is String) {
        for (final opt in statusCol.options) {
          if (opt.id == statusVal) {
            statusLabel = opt.label;
            break;
          }
        }
      }
    }

    events.add(
      ScheduleCalendarEvent(
        rowId: row.id,
        dateKey: toDateKey(parsed),
        timeLabel: timeLabel,
        startMinutes: startMinutes,
        durationMinutes: durationMinutes,
        sessionLabel: sessionLabel,
        teacherLabel: teacherLabel,
        roomLabel: roomLabel,
        statusLabel: statusLabel,
        statusId: statusId,
      ),
    );
  }

  events.sort((a, b) {
    final byDate = a.dateKey.compareTo(b.dateKey);
    if (byDate != 0) return byDate;
    return a.startMinutes.compareTo(b.startMinutes);
  });
  return events;
}
