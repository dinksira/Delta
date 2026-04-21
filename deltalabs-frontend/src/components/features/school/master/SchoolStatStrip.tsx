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
  { key: "mySchools", label: "My Schools", tone: schoolFeatureChip.cyan },
  { key: "totalClasses", label: "Total Classes", tone: schoolFeatureChip.violet },
  { key: "totalStudents", label: "Total Students", tone: schoolFeatureChip.amber },
  { key: "totalTeachers", label: "Total Teachers", tone: schoolFeatureChip.rose },
] as const;

/** ################################ /CONSTANTS ############################# */
/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
type SchoolStatValues = Readonly<{
  mySchools: number;
  totalClasses: number;
  totalStudents: number;
  totalTeachers: number;
}>;

type SchoolStatStripProps = Readonly<{
  values: SchoolStatValues;
}>;

export function SchoolStatStrip({ values }: SchoolStatStripProps) {
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
              {values[s.key].toLocaleString()}
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
