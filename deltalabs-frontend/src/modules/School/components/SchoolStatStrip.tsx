import { Building2, Clock } from "lucide-react";

import { Typography } from "@/components/theme";
import { cx } from "@/components/theme/utils";

const stats = [
  { label: "My Schools", value: "5", tone: "bg-sky-100 text-sky-900 dark:bg-sky-950/50 dark:text-sky-100" },
  { label: "Total Classes", value: "62", tone: "bg-violet-100 text-violet-900 dark:bg-violet-950/50 dark:text-violet-100" },
  { label: "Total Students", value: "62", tone: "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100" },
  { label: "Total Teachers", value: "62", tone: "bg-rose-100 text-rose-900 dark:bg-rose-950/50 dark:text-rose-100" },
] as const;

export function SchoolStatStrip() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className={cx("flex min-h-[5.5rem] items-center gap-4 rounded-xl px-5 py-5 sm:min-h-[6rem]", s.tone)}
        >
          <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-lg bg-white/60 dark:bg-black/20">
            {s.label.includes("School") ? (
              <Building2 className="size-6" aria-hidden />
            ) : (
              <Clock className="size-6" aria-hidden />
            )}
          </span>
          <div>
            <Typography variant="label" className="text-lg font-bold">
              {s.value}
            </Typography>
            <Typography variant="small" className="opacity-90">
              {s.label}
            </Typography>
          </div>
        </div>
      ))}
    </div>
  );
}
