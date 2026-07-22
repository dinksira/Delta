import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/utils/schedule_calendar_utils.dart';
import 'package:flutter/material.dart';

const _weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const _monthsShort = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const _timeLabelWidth = 52.0;
const _dayColumnWidth = 110.0;
const _calendarBlue = Color(0xFF1A73E8);
const _calendarBlueDark = Color(0xFF1557B0);

class ClassScheduleCalendarView extends StatelessWidget {
  const ClassScheduleCalendarView({
    required this.weekStart,
    required this.onWeekStartChanged,
    required this.events,
    required this.canMutate,
    this.onCreateAtSlot,
    this.onEventTap,
    super.key,
  });

  final DateTime weekStart;
  final ValueChanged<DateTime> onWeekStartChanged;
  final List<ScheduleCalendarEvent> events;
  final bool canMutate;
  final Future<void> Function(String dateKey, int startMinutes)? onCreateAtSlot;
  final ValueChanged<String>? onEventTap;

  @override
  Widget build(BuildContext context) {
    final days = List.generate(7, (i) => addDays(weekStart, i));
    const gridStartMinutes = scheduleCalendarHourStart * 60;
    const gridEndMinutes = scheduleCalendarHourEnd * 60;
    const gridHeight =
        (gridEndMinutes - gridStartMinutes) * scheduleCalendarPxPerMinute;
    const slotCount =
        (gridEndMinutes - gridStartMinutes) ~/ scheduleCalendarSlotMinutes;
    final hours = List.generate(
      scheduleCalendarHourEnd - scheduleCalendarHourStart + 1,
      (i) => scheduleCalendarHourStart + i,
    );

    final weekEnd = addDays(weekStart, 6);
    final monthTitle = weekStart.month == weekEnd.month
        ? '${_monthsShort[weekStart.month - 1]} ${weekStart.year}'
        : '${_monthsShort[weekStart.month - 1]} – '
            '${_monthsShort[weekEnd.month - 1]} ${weekEnd.year}';

    final now = DateTime.now();
    final nowMinutes = now.hour * 60 + now.minute;
    final showNowLine = days.any(isTodayDate) &&
        nowMinutes >= gridStartMinutes &&
        nowMinutes <= gridEndMinutes;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _CalendarToolbar(
          monthTitle: monthTitle,
          weekRangeLabel: formatScheduleWeekRangeLabel(weekStart),
          onPrevWeek: () => onWeekStartChanged(addDays(weekStart, -7)),
          onNextWeek: () => onWeekStartChanged(addDays(weekStart, 7)),
          onToday: () => onWeekStartChanged(startOfWeekMonday(DateTime.now())),
        ),
        const SizedBox(height: 8),
        LayoutBuilder(
          builder: (context, constraints) {
            final viewportHeight = constraints.maxHeight.isFinite && constraints.maxHeight > 0
                ? constraints.maxHeight
                : gridHeight + 56;
            return SizedBox(
              height: viewportHeight,
              child: DecoratedBox(
                decoration: BoxDecoration(
                  color: AppColors.background,
                  border: Border.all(color: AppColors.divider),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: SingleChildScrollView(
                    child: SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: SizedBox(
                        width: _timeLabelWidth + _dayColumnWidth * 7,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _DayHeaderRow(days: days),
                            SizedBox(
                              height: gridHeight,
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  _TimeLabelsColumn(
                                    hours: hours,
                                    gridStartMinutes: gridStartMinutes,
                                    gridHeight: gridHeight,
                                  ),
                                  for (final day in days)
                                    _DayColumn(
                                      day: day,
                                      events: events
                                          .where((e) => e.dateKey == toDateKey(day))
                                          .toList(),
                                      slotCount: slotCount,
                                      gridStartMinutes: gridStartMinutes,
                                      gridHeight: gridHeight,
                                      canMutate: canMutate,
                                      showNowLine: isTodayDate(day) && showNowLine,
                                      nowMinutes: nowMinutes,
                                      onSlotTap: canMutate && onCreateAtSlot != null
                                          ? (dateKey, startMinutes) =>
                                              onCreateAtSlot!(dateKey, startMinutes)
                                          : null,
                                      onEventTap: (event) => _handleEventTap(
                                        context,
                                        event,
                                      ),
                                    ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  void _handleEventTap(BuildContext context, ScheduleCalendarEvent event) {
    if (onEventTap != null) {
      onEventTap!(event.rowId);
      return;
    }
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (ctx) => _EventDetailsSheet(event: event),
    );
  }
}

class _CalendarToolbar extends StatelessWidget {
  const _CalendarToolbar({
    required this.monthTitle,
    required this.weekRangeLabel,
    required this.onPrevWeek,
    required this.onNextWeek,
    required this.onToday,
  });

  final String monthTitle;
  final String weekRangeLabel;
  final VoidCallback onPrevWeek;
  final VoidCallback onNextWeek;
  final VoidCallback onToday;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: [
        OutlinedButton(
          onPressed: onToday,
          style: OutlinedButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            foregroundColor: AppColors.textPrimary,
            side: BorderSide(color: AppColors.inputBorder.withValues(alpha: 0.9)),
          ),
          child: const Text('Today', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
        ),
        DecoratedBox(
          decoration: BoxDecoration(
            border: Border.all(color: AppColors.divider),
            borderRadius: BorderRadius.circular(10),
            color: AppColors.background,
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              IconButton(
                icon: const Icon(Icons.chevron_left, size: 20),
                tooltip: 'Previous week',
                onPressed: onPrevWeek,
                visualDensity: VisualDensity.compact,
              ),
              ConstrainedBox(
                constraints: const BoxConstraints(minWidth: 140),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      monthTitle,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    Text(
                      weekRangeLabel,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.chevron_right, size: 20),
                tooltip: 'Next week',
                onPressed: onNextWeek,
                visualDensity: VisualDensity.compact,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _DayHeaderRow extends StatelessWidget {
  const _DayHeaderRow({required this.days});

  final List<DateTime> days;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: AppColors.divider)),
        color: AppColors.background,
      ),
      child: Row(
        children: [
          const SizedBox(width: _timeLabelWidth),
          for (var i = 0; i < days.length; i++)
            _DayHeaderCell(day: days[i], weekdayLabel: _weekdayLabels[i]),
        ],
      ),
    );
  }
}

class _DayHeaderCell extends StatelessWidget {
  const _DayHeaderCell({
    required this.day,
    required this.weekdayLabel,
  });

  final DateTime day;
  final String weekdayLabel;

  @override
  Widget build(BuildContext context) {
    final today = isTodayDate(day);
    return SizedBox(
      width: _dayColumnWidth,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: today ? _calendarBlue.withValues(alpha: 0.06) : AppColors.background,
          border: Border(
            right: BorderSide(
              color: AppColors.divider.withValues(alpha: 0.8),
            ),
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Column(
            children: [
              Text(
                weekdayLabel,
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.4,
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 4),
              Container(
                width: 32,
                height: 32,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: today ? _calendarBlue : Colors.transparent,
                  shape: BoxShape.circle,
                ),
                child: Text(
                  '${day.day}',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: today ? Colors.white : AppColors.textPrimary,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _TimeLabelsColumn extends StatelessWidget {
  const _TimeLabelsColumn({
    required this.hours,
    required this.gridStartMinutes,
    required this.gridHeight,
  });

  final List<int> hours;
  final int gridStartMinutes;
  final double gridHeight;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: _timeLabelWidth,
      height: gridHeight,
      child: DecoratedBox(
        decoration: const BoxDecoration(
          border: Border(right: BorderSide(color: AppColors.divider)),
          color: AppColors.background,
        ),
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            for (final hour in hours.where((h) => h < scheduleCalendarHourEnd))
              Positioned(
                top: (hour * 60 - gridStartMinutes) * scheduleCalendarPxPerMinute,
                right: 6,
                child: Transform.translate(
                  offset: const Offset(0, -6),
                  child: Text(
                    _formatHourLabel(hour),
                    style: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w500,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _DayColumn extends StatelessWidget {
  const _DayColumn({
    required this.day,
    required this.events,
    required this.slotCount,
    required this.gridStartMinutes,
    required this.gridHeight,
    required this.canMutate,
    required this.showNowLine,
    required this.nowMinutes,
    required this.onEventTap,
    this.onSlotTap,
  });

  final DateTime day;
  final List<ScheduleCalendarEvent> events;
  final int slotCount;
  final int gridStartMinutes;
  final double gridHeight;
  final bool canMutate;
  final bool showNowLine;
  final int nowMinutes;
  final void Function(ScheduleCalendarEvent event) onEventTap;
  final Future<void> Function(String dateKey, int startMinutes)? onSlotTap;

  @override
  Widget build(BuildContext context) {
    final dateKey = toDateKey(day);
    final today = isTodayDate(day);

    return SizedBox(
      width: _dayColumnWidth,
      height: gridHeight,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: today ? _calendarBlue.withValues(alpha: 0.03) : AppColors.background,
          border: Border(
            right: BorderSide(color: AppColors.divider.withValues(alpha: 0.8)),
          ),
        ),
        child: Stack(
          children: [
            for (var i = 0; i <= slotCount; i++)
              Positioned(
                top: i * scheduleCalendarSlotMinutes * scheduleCalendarPxPerMinute,
                left: 0,
                right: 0,
                child: Divider(
                  height: 1,
                  thickness: 1,
                  color: i.isEven
                      ? AppColors.divider.withValues(alpha: 0.8)
                      : AppColors.divider.withValues(alpha: 0.35),
                ),
              ),
            for (var slotIndex = 0; slotIndex < slotCount; slotIndex++)
              Positioned(
                top: slotIndex *
                    scheduleCalendarSlotMinutes *
                    scheduleCalendarPxPerMinute,
                left: 0,
                right: 0,
                height: scheduleCalendarSlotMinutes * scheduleCalendarPxPerMinute,
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: onSlotTap == null
                        ? null
                        : () {
                            final startMinutes = gridStartMinutes +
                                slotIndex * scheduleCalendarSlotMinutes;
                            onSlotTap!(dateKey, startMinutes);
                          },
                    hoverColor: _calendarBlue.withValues(alpha: 0.06),
                    splashColor: _calendarBlue.withValues(alpha: 0.1),
                    child: const SizedBox.expand(),
                  ),
                ),
              ),
            for (final event in events)
              _EventBlock(
                event: event,
                gridStartMinutes: gridStartMinutes,
                onTap: () => onEventTap(event),
              ),
            if (showNowLine)
              Positioned(
                top: (nowMinutes - gridStartMinutes) * scheduleCalendarPxPerMinute,
                left: 0,
                right: 0,
                child: const _NowLine(),
              ),
          ],
        ),
      ),
    );
  }
}

class _EventBlock extends StatelessWidget {
  const _EventBlock({
    required this.event,
    required this.gridStartMinutes,
    required this.onTap,
  });

  final ScheduleCalendarEvent event;
  final int gridStartMinutes;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final style = _eventBlockStyle(event.statusId);
    final top =
        (event.startMinutes - gridStartMinutes) * scheduleCalendarPxPerMinute;
    final height = (event.durationMinutes * scheduleCalendarPxPerMinute)
        .clamp(
          scheduleCalendarSlotMinutes * scheduleCalendarPxPerMinute * 0.85,
          double.infinity,
        );

    return Positioned(
      top: top + 1,
      left: 4,
      right: 4,
      height: height - 2,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(4),
          child: DecoratedBox(
            decoration: BoxDecoration(
              color: style.background,
              borderRadius: BorderRadius.circular(4),
              border: Border(
                left: BorderSide(color: style.border, width: 3),
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.08),
                  blurRadius: 2,
                  offset: const Offset(0, 1),
                ),
              ],
            ),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    event.sessionLabel,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      height: 1.2,
                      color: Colors.white,
                      decoration: style.strikethrough
                          ? TextDecoration.lineThrough
                          : null,
                    ),
                  ),
                  Text(
                    _formatEventTimeRange(event),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 10,
                      color: Colors.white.withValues(alpha: 0.9),
                      decoration: style.strikethrough
                          ? TextDecoration.lineThrough
                          : null,
                    ),
                  ),
                  if (event.roomLabel.isNotEmpty)
                    Text(
                      event.roomLabel,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 10,
                        color: Colors.white.withValues(alpha: 0.8),
                        decoration: style.strikethrough
                            ? TextDecoration.lineThrough
                            : null,
                      ),
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _EventBlockStyle {
  const _EventBlockStyle({
    required this.background,
    required this.border,
    this.strikethrough = false,
  });

  final Color background;
  final Color border;
  final bool strikethrough;
}

_EventBlockStyle _eventBlockStyle(String statusId) {
  switch (statusId) {
    case 'live':
      return const _EventBlockStyle(
        background: Color(0xFF10B981),
        border: Color(0xFF047857),
      );
    case 'completed':
      return const _EventBlockStyle(
        background: Color(0xFF64748B),
        border: Color(0xFF475569),
      );
    case 'cancelled':
      return const _EventBlockStyle(
        background: Color(0xFFFB7185),
        border: Color(0xFFBE123C),
        strikethrough: true,
      );
    default:
      return const _EventBlockStyle(
        background: _calendarBlue,
        border: _calendarBlueDark,
      );
  }
}

class _NowLine extends StatelessWidget {
  const _NowLine();

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        Container(height: 2, color: const Color(0xFFEF4444)),
        Positioned(
          left: -4,
          top: -3,
          child: Container(
            width: 8,
            height: 8,
            decoration: const BoxDecoration(
              color: Color(0xFFEF4444),
              shape: BoxShape.circle,
            ),
          ),
        ),
      ],
    );
  }
}

class _EventDetailsSheet extends StatelessWidget {
  const _EventDetailsSheet({required this.event});

  final ScheduleCalendarEvent event;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              event.sessionLabel,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            _DetailRow(
              icon: Icons.schedule_outlined,
              text: _formatEventTimeRange(event),
            ),
            const SizedBox(height: 6),
            _DetailRow(
              icon: Icons.calendar_today_outlined,
              text: event.dateKey,
            ),
            if (event.teacherLabel.isNotEmpty) ...[
              const SizedBox(height: 6),
              _DetailRow(
                icon: Icons.person_outline,
                text: event.teacherLabel,
              ),
            ],
            if (event.roomLabel.isNotEmpty) ...[
              const SizedBox(height: 6),
              _DetailRow(
                icon: Icons.place_outlined,
                text: event.roomLabel,
              ),
            ],
            if (event.statusLabel.isNotEmpty) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.surfaceGrey,
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  event.statusLabel,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textSecondary,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  const _DetailRow({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 16, color: AppColors.textSecondary),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(
              fontSize: 14,
              color: AppColors.textSecondary,
            ),
          ),
        ),
      ],
    );
  }
}

String _formatHourLabel(int hour) {
  if (hour == 0) return '12 AM';
  if (hour < 12) return '$hour AM';
  if (hour == 12) return '12 PM';
  return '${hour - 12} PM';
}

String _formatEventTimeRange(ScheduleCalendarEvent event) {
  final end = event.startMinutes + event.durationMinutes;
  return '${formatMinutesAsTime(event.startMinutes)} – ${formatMinutesAsTime(end)}';
}
