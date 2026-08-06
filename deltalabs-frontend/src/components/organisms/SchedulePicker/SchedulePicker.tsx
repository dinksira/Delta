/**
 * SchedulePicker
 * Atomic Level: Organism
 *
 * Date / time / timezone picker for the Create Topic Battle wizard (schedule
 * step). Follows the Step 6 redesign spec: two equal-height light-grey cards
 * in a 2-column grid, each with a muted-teal (slate) input showing white text
 * and a trailing white icon — Select Date (calendar, today-or-future only),
 * and Select Time + Time Zone (clock + chevron dropdown).
 */

import { Calendar, ChevronDown, Clock } from "lucide-react";

import { cn } from "@/lib/utils";

export interface SchedulePickerProps {
  date: string;
  time: string;
  timezone: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  onTimezoneChange: (timezone: string) => void;
  /** Timezone options for the select. */
  timezones: string[];
  className?: string;
}

const fieldIconClasses =
  "pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white";

const fieldInputClasses =
  "h-12 w-full rounded-xl bg-primary-500 px-4 text-sm font-semibold text-white outline-none transition-all duration-150 placeholder:text-white/60 focus-visible:ring-2 focus-visible:ring-primary-700";

const nativePickerOverlay =
  "[&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0";

export function SchedulePicker({
  date,
  time,
  timezone,
  onDateChange,
  onTimeChange,
  onTimezoneChange,
  timezones,
  className,
}: Readonly<SchedulePickerProps>) {
  const now = new Date();
  const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  return (
    <div className={cn("grid grid-cols-1 gap-5 lg:grid-cols-2", className)}>
      {/* Select Date */}
      <div className="flex flex-col gap-2 rounded-xl bg-surface-muted p-5">
        <label htmlFor="battle-date" className="text-sm font-bold text-primary-700">
          Select Date
        </label>
        <div className="relative">
          <input
            id="battle-date"
            type="date"
            value={date}
            min={localToday}
            onChange={(event) => onDateChange(event.target.value)}
            className={cn(fieldInputClasses, "pr-11", nativePickerOverlay)}
          />
          <Calendar className={fieldIconClasses} aria-hidden />
        </div>
        <p className="text-[11px] italic text-text-secondary">Today or future dates only</p>
      </div>

      {/* Select Time + Time Zone */}
      <div className="flex flex-col gap-2 rounded-xl bg-surface-muted p-5">
        <label htmlFor="battle-time" className="text-sm font-bold text-primary-700">
          Select Time
        </label>
        <div className="relative">
          <input
            id="battle-time"
            type="time"
            value={time}
            onChange={(event) => onTimeChange(event.target.value)}
            className={cn(fieldInputClasses, "pr-11", nativePickerOverlay)}
          />
          <Clock className={fieldIconClasses} aria-hidden />
        </div>

        <label htmlFor="battle-timezone" className="mt-3 text-sm font-bold text-primary-700">
          Time Zone
        </label>
        <div className="relative">
          <select
            id="battle-timezone"
            value={timezone}
            onChange={(event) => onTimezoneChange(event.target.value)}
            className={cn(
              fieldInputClasses,
              "cursor-pointer appearance-none pr-11 [&>option]:bg-surface-default [&>option]:text-text-primary",
            )}
          >
            {timezones.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
          <ChevronDown className={fieldIconClasses} aria-hidden />
        </div>
      </div>
    </div>
  );
}

export default SchedulePicker;
