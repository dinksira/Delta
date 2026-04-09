/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { Building2, Clock } from "lucide-react";

import { Typography } from "@/components/theme";
import { schoolFeatureChip } from "@/components/features/school/schoolFeatureChipClasses";
import { cx } from "@/components/theme/utils";

/** ################################ /IMPORT ############################# */
/** ################################ CONSTANTS ############################# */
/** Shared constants used by this file. */
const stats = [
  { label: "My Schools", value: "5", tone: schoolFeatureChip.cyan },
  { label: "Total Classes", value: "62", tone: schoolFeatureChip.violet },
  { label: "Total Students", value: "62", tone: schoolFeatureChip.amber },
  { label: "Total Teachers", value: "62", tone: schoolFeatureChip.rose },
] as const;

/** ################################ /CONSTANTS ############################# */
/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
export function SchoolStatStrip() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className={cx("flex min-h-[5.5rem] items-center gap-4 rounded-xl px-5 py-5 sm:min-h-[6rem]", s.tone)}
        >
          <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-lg bg-surface-default/80 dark:bg-surface-elevated/60">
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
/** ################################ /COMPONENT ############################# */
