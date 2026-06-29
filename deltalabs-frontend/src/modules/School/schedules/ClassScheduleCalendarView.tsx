"use client";

import { ChevronLeft, ChevronRight, Clock, MapPin, Plus, User, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { Button } from "@/components/theme";
import type { ManagementTableColumnDto } from "@/modules/School/api";
import type { ScheduleCalendarEvent } from "@/modules/School/schedules/scheduleCalendarUtils";
import {
  SCHEDULE_CALENDAR_HOUR_END,
  SCHEDULE_CALENDAR_HOUR_START,
  SCHEDULE_CALENDAR_PX_PER_MINUTE,
  SCHEDULE_CALENDAR_SLOT_MINUTES,
  addDays,
  formatMinutesAsTime,
  isTodayDate,
  startOfWeekMonday,
  toDateKey,
} from "@/modules/School/schedules/scheduleCalendarUtils";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export type ScheduleCalendarSlotSelection = Readonly<{
  dateKey: string;
  startMinutes: number;
}>;

function eventBlockStyle(statusId: string, selected: boolean): string {
  const ring = selected ? "ring-2 ring-offset-1 ring-[#1a73e8]" : "";
  switch (statusId) {
    case "live":
      return `border-l-[3px] border-l-emerald-700 bg-emerald-500 text-white shadow-sm hover:bg-emerald-600 ${ring}`;
    case "completed":
      return `border-l-[3px] border-l-slate-600 bg-slate-500/90 text-white shadow-sm hover:bg-slate-600 ${ring}`;
    case "cancelled":
      return `border-l-[3px] border-l-rose-700 bg-rose-400/90 text-white shadow-sm line-through opacity-80 ${ring}`;
    default:
      return `border-l-[3px] border-l-[#1557b0] bg-[#1a73e8] text-white shadow-sm hover:bg-[#1765cc] ${ring}`;
  }
}

function formatHourLabel(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return "12 PM";
  return `${hour - 12} PM`;
}

function formatEventTimeRange(event: ScheduleCalendarEvent): string {
  const end = event.startMinutes + event.durationMinutes;
  return `${formatMinutesAsTime(event.startMinutes)} – ${formatMinutesAsTime(end)}`;
}

export function ClassScheduleCalendarView({
  weekStart,
  events,
  columns,
  canMutate,
  loading,
  onWeekPrev,
  onWeekNext,
  onToday,
  onCreateAtSlot,
  onSwitchToTable,
}: Readonly<{
  weekStart: Date;
  events: readonly ScheduleCalendarEvent[];
  columns: readonly ManagementTableColumnDto[];
  canMutate: boolean;
  loading?: boolean;
  onWeekPrev: () => void;
  onWeekNext: () => void;
  onToday: () => void;
  onCreateAtSlot?: (slot: ScheduleCalendarSlotSelection) => void;
  onSwitchToTable?: () => void;
}>) {
  const hasDateColumn = columns.some((c) => c.title.trim().toLowerCase() === "date");
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<ScheduleCalendarSlotSelection | null>(null);

  const gridStartMinutes = SCHEDULE_CALENDAR_HOUR_START * 60;
  const gridEndMinutes = SCHEDULE_CALENDAR_HOUR_END * 60;
  const gridHeightPx = (gridEndMinutes - gridStartMinutes) * SCHEDULE_CALENDAR_PX_PER_MINUTE;

  const hours = useMemo(() => {
    const list: number[] = [];
    for (let h = SCHEDULE_CALENDAR_HOUR_START; h <= SCHEDULE_CALENDAR_HOUR_END; h++) list.push(h);
    return list;
  }, []);

  const slotCount = (gridEndMinutes - gridStartMinutes) / SCHEDULE_CALENDAR_SLOT_MINUTES;

  const selectedEvent = useMemo(
    () => events.find((e) => e.rowId === selectedEventId) ?? null,
    [events, selectedEventId],
  );

  const clearSelection = useCallback(() => {
    setSelectedEventId(null);
    setSelectedSlot(null);
  }, []);

  const handleSlotClick = (dateKey: string, slotIndex: number) => {
    const startMinutes = gridStartMinutes + slotIndex * SCHEDULE_CALENDAR_SLOT_MINUTES;
    setSelectedSlot({ dateKey, startMinutes });
    setSelectedEventId(null);
  };

  const handleEventClick = (event: ScheduleCalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEventId(event.rowId);
    setSelectedSlot(null);
  };

  const monthTitle = useMemo(() => {
    const end = addDays(weekStart, 6);
    if (weekStart.getMonth() === end.getMonth()) {
      return `${MONTHS_SHORT[weekStart.getMonth()]} ${weekStart.getFullYear()}`;
    }
    return `${MONTHS_SHORT[weekStart.getMonth()]} – ${MONTHS_SHORT[end.getMonth()]} ${end.getFullYear()}`;
  }, [weekStart]);

  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const showNowLine = days.some((d) => isTodayDate(d)) && nowMinutes >= gridStartMinutes && nowMinutes <= gridEndMinutes;

  if (!hasDateColumn) {
    return (
      <div className="px-6 py-16 text-center">
        <p className="text-sm font-semibold text-text-primary">Add a Date column to use the calendar</p>
        <p className="mt-2 text-xs text-text-tertiary">
          Switch to Main Table, use Add column, and pick Date.
        </p>
        {onSwitchToTable ? (
          <Button type="button" variant="secondary" size="sm" className="mt-4" onClick={onSwitchToTable}>
            Open Main Table
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex min-h-[32rem] flex-col bg-white">
      {/* Toolbar — Google Calendar style */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-default px-4 py-3">
        <div className="flex items-center gap-2">
          <Button type="button" variant="secondary" size="sm" className="h-8 px-3 text-xs font-semibold" onClick={onToday}>
            Today
          </Button>
          <div className="flex items-center rounded-lg border border-border-default bg-surface-default shadow-sm">
            <button
              type="button"
              className="rounded-l-lg p-1.5 text-text-secondary hover:bg-surface-muted"
              aria-label="Previous week"
              onClick={onWeekPrev}
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="min-w-[9rem] px-2 text-center text-sm font-semibold text-text-primary">{monthTitle}</span>
            <button
              type="button"
              className="rounded-r-lg p-1.5 text-text-secondary hover:bg-surface-muted"
              aria-label="Next week"
              onClick={onWeekNext}
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
        {loading ? <span className="text-xs text-text-tertiary">Updating…</span> : null}
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Calendar grid */}
        <div className="min-w-0 flex-1 overflow-auto">
          {/* Day headers */}
          <div className="sticky top-0 z-20 grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))] border-b border-border-default bg-white">
            <div className="border-r border-border-default" />
            {days.map((day, index) => {
              const today = isTodayDate(day);
              return (
                <div
                  key={toDateKey(day)}
                  className={[
                    "border-r border-border-default px-1 py-2 text-center last:border-r-0",
                    today ? "bg-primary-50/40" : "",
                  ].join(" ")}
                >
                  <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">
                    {WEEKDAY_LABELS[index]}
                  </p>
                  <p
                    className={[
                      "mx-auto mt-0.5 flex size-8 items-center justify-center rounded-full text-sm font-semibold",
                      today ? "bg-[#1a73e8] text-white" : "text-text-primary",
                    ].join(" ")}
                  >
                    {day.getDate()}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Time grid + events */}
          <div className="relative grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))]" style={{ minHeight: gridHeightPx }}>
            {/* Time labels */}
            <div className="relative border-r border-border-default bg-white">
              {hours.slice(0, -1).map((hour) => {
                const top = (hour * 60 - gridStartMinutes) * SCHEDULE_CALENDAR_PX_PER_MINUTE;
                return (
                  <div
                    key={hour}
                    className="absolute right-2 -translate-y-1/2 text-[10px] font-medium text-text-tertiary"
                    style={{ top }}
                  >
                    {formatHourLabel(hour)}
                  </div>
                );
              })}
            </div>

            {/* Day columns */}
            {days.map((day) => {
              const dateKey = toDateKey(day);
              const dayEvents = events.filter((e) => e.dateKey === dateKey);
              const today = isTodayDate(day);

              return (
                <div
                  key={dateKey}
                  className={[
                    "relative border-r border-border-default last:border-r-0",
                    today ? "bg-primary-50/15" : "bg-white",
                  ].join(" ")}
                >
                  {/* Hour / half-hour grid lines */}
                  {Array.from({ length: slotCount + 1 }, (_, i) => {
                    const top = i * SCHEDULE_CALENDAR_SLOT_MINUTES * SCHEDULE_CALENDAR_PX_PER_MINUTE;
                    const isHour = i % 2 === 0;
                    return (
                      <div
                        key={i}
                        className={[
                          "pointer-events-none absolute inset-x-0 border-t",
                          isHour ? "border-border-default/80" : "border-border-default/35",
                        ].join(" ")}
                        style={{ top }}
                      />
                    );
                  })}

                  {/* Clickable slots */}
                  {Array.from({ length: slotCount }, (_, slotIndex) => {
                    const slotStart = gridStartMinutes + slotIndex * SCHEDULE_CALENDAR_SLOT_MINUTES;
                    const isSelected =
                      selectedSlot?.dateKey === dateKey && selectedSlot.startMinutes === slotStart;
                    return (
                      <button
                        key={slotIndex}
                        type="button"
                        className={[
                          "absolute inset-x-0 z-[1] w-full border-0 bg-transparent transition-colors",
                          isSelected ? "bg-[#1a73e8]/12 ring-1 ring-inset ring-[#1a73e8]/40" : "hover:bg-[#1a73e8]/6",
                          canMutate ? "cursor-pointer" : "cursor-default",
                        ].join(" ")}
                        style={{
                          top: slotIndex * SCHEDULE_CALENDAR_SLOT_MINUTES * SCHEDULE_CALENDAR_PX_PER_MINUTE,
                          height: SCHEDULE_CALENDAR_SLOT_MINUTES * SCHEDULE_CALENDAR_PX_PER_MINUTE,
                        }}
                        aria-label={`${dateKey} ${formatMinutesAsTime(slotStart)}`}
                        onClick={() => handleSlotClick(dateKey, slotIndex)}
                      />
                    );
                  })}

                  {/* Events */}
                  {dayEvents.map((event) => {
                    const top = (event.startMinutes - gridStartMinutes) * SCHEDULE_CALENDAR_PX_PER_MINUTE;
                    const height = Math.max(
                      event.durationMinutes * SCHEDULE_CALENDAR_PX_PER_MINUTE,
                      SCHEDULE_CALENDAR_SLOT_MINUTES * SCHEDULE_CALENDAR_PX_PER_MINUTE * 0.85,
                    );
                    const selected = selectedEventId === event.rowId;
                    return (
                      <button
                        key={event.rowId}
                        type="button"
                        className={[
                          "absolute inset-x-1 z-[2] overflow-hidden rounded px-1.5 py-1 text-left transition-shadow",
                          eventBlockStyle(event.statusId, selected),
                        ].join(" ")}
                        style={{ top: top + 1, height: height - 2 }}
                        onClick={(e) => handleEventClick(event, e)}
                      >
                        <p className="truncate text-[11px] font-semibold leading-tight">{event.sessionLabel}</p>
                        <p className="truncate text-[10px] opacity-90">{formatEventTimeRange(event)}</p>
                        {event.roomLabel ? (
                          <p className="truncate text-[10px] opacity-80">{event.roomLabel}</p>
                        ) : null}
                      </button>
                    );
                  })}

                  {/* Current time indicator */}
                  {today && showNowLine ? (
                    <div
                      className="pointer-events-none absolute inset-x-0 z-[3] border-t-2 border-red-500"
                      style={{ top: (nowMinutes - gridStartMinutes) * SCHEDULE_CALENDAR_PX_PER_MINUTE }}
                    >
                      <div className="absolute -left-1 top-0 size-2 -translate-y-1/2 rounded-full bg-red-500" />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selection sidebar */}
        {(selectedEvent || selectedSlot) && (
          <aside className="w-full shrink-0 border-l border-border-default bg-surface-default sm:w-72 lg:w-80">
            <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
              <p className="text-sm font-semibold text-text-primary">
                {selectedEvent ? "Session details" : "New session slot"}
              </p>
              <button
                type="button"
                className="rounded p-1 text-text-tertiary hover:bg-surface-muted"
                aria-label="Close"
                onClick={clearSelection}
              >
                <X className="size-4" />
              </button>
            </div>

            {selectedEvent ? (
              <div className="space-y-4 p-4">
                <div>
                  <h3 className="text-base font-bold text-text-primary">{selectedEvent.sessionLabel}</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-text-secondary">
                    <Clock className="size-3.5 shrink-0" aria-hidden />
                    {formatEventTimeRange(selectedEvent)}
                  </p>
                  <p className="text-xs text-text-tertiary">{selectedEvent.dateKey}</p>
                </div>
                {selectedEvent.teacherLabel ? (
                  <p className="flex items-center gap-2 text-sm text-text-secondary">
                    <User className="size-4 shrink-0 text-text-tertiary" aria-hidden />
                    {selectedEvent.teacherLabel}
                  </p>
                ) : null}
                {selectedEvent.roomLabel ? (
                  <p className="flex items-center gap-2 text-sm text-text-secondary">
                    <MapPin className="size-4 shrink-0 text-text-tertiary" aria-hidden />
                    {selectedEvent.roomLabel}
                  </p>
                ) : null}
                {selectedEvent.statusLabel ? (
                  <span className="inline-flex rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-medium text-text-secondary">
                    {selectedEvent.statusLabel}
                  </span>
                ) : null}
                {onSwitchToTable ? (
                  <Button type="button" variant="secondary" size="sm" className="w-full" onClick={onSwitchToTable}>
                    Edit in Main Table
                  </Button>
                ) : null}
              </div>
            ) : selectedSlot ? (
              <div className="space-y-4 p-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-text-tertiary">Selected time</p>
                  <p className="mt-1 text-lg font-bold text-text-primary">
                    {formatMinutesAsTime(selectedSlot.startMinutes)}
                  </p>
                  <p className="text-sm text-text-secondary">{selectedSlot.dateKey}</p>
                </div>
                {canMutate && onCreateAtSlot ? (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    className="w-full gap-1.5"
                    onClick={() => {
                      onCreateAtSlot(selectedSlot);
                      clearSelection();
                    }}
                  >
                    <Plus className="size-4" aria-hidden />
                    Schedule session here
                  </Button>
                ) : (
                  <p className="text-xs text-text-tertiary">Select a slot to preview. Managers can add sessions here.</p>
                )}
              </div>
            ) : null}
          </aside>
        )}
      </div>
    </div>
  );
}

export { startOfWeekMonday };
