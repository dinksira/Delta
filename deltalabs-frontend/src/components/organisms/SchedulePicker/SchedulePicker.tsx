/**
 * SchedulePicker
 * Atomic Level: Organism
 *
 * Date / time / timezone picker for the Create Topic Battle wizard (schedule
 * step). Date uses a native date input, time uses preset slot pills, and
 * timezone uses a select. Mirrors the desktop reference schedule step.
 */

import { CalendarClock } from "lucide-react";

import { Field } from "@/components/theme/Field";
import { Input } from "@/components/theme/Input";
import { Select } from "@/components/theme/Select";
import { Typography } from "@/components/theme/Typography";
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
  /** Preset time slot pills. */
  timeSlots?: string[];
  className?: string;
}

const DEFAULT_TIME_SLOTS = [
  "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM",
  "05:00 PM", "06:00 PM",
];

export function SchedulePicker({
  date,
  time,
  timezone,
  onDateChange,
  onTimeChange,
  onTimezoneChange,
  timezones,
  timeSlots = DEFAULT_TIME_SLOTS,
  className,
}: Readonly<SchedulePickerProps>) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <Field id="battle-date" label="Battle date">
        <Input
          id="battle-date"
          type="date"
          value={date}
          onChange={(event) => onDateChange(event.target.value)}
        />
      </Field>

      <div className="flex flex-col gap-2">
        <Typography as="h3" className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <CalendarClock className="size-4 text-primary-600" aria-hidden />
          Start time
        </Typography>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {timeSlots.map((slot) => {
            const selected = time === slot;
            return (
              <button
                key={slot}
                type="button"
                onClick={() => onTimeChange(slot)}
                aria-pressed={selected}
                className={cn(
                  "rounded-lg border-2 px-3 py-2 text-center text-sm font-semibold transition-all duration-200",
                  selected
                    ? "border-primary-600 bg-primary-600 text-white shadow-md"
                    : "border-border-default bg-surface-default text-text-primary hover:border-primary-400",
                )}
              >
                {slot}
              </button>
            );
          })}
        </div>
      </div>

      <Field id="battle-timezone" label="Timezone">
        <Select
          id="battle-timezone"
          value={timezone}
          onChange={(event) => onTimezoneChange(event.target.value)}
        >
          {timezones.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </Select>
      </Field>
    </div>
  );
}

export default SchedulePicker;
