/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { Checkbox, Typography } from "@/components/theme";
import { schoolChipActionButtonClass } from "@/components/features/school/schoolFeatureChipClasses";
import { SchoolSectionHeading } from "@/components/features/school/SchoolSectionHeading";
import { cx } from "@/components/theme/utils";

/** ################################ /IMPORT ############################# */
/** ################################ CONSTANTS ############################# */
/** Shared constants used by this file. */
const rows = [
  { id: "1", school: "Saint Joseph School", date: "1/30/2025" },
  { id: "2", school: "Addis Ababa University", date: "1/28/2025" },
  { id: "3", school: "Lincoln High School", date: "1/22/2025" },
] as const;

/** ################################ /CONSTANTS ############################# */
/** ################################ TYPES ############################# */
/** Type definitions used in this file. */
type SchoolOffersTableProps = Readonly<{
  title?: string;
}>;

/** ################################ /TYPES ############################# */
/** ################################ COMPONENT ############################# */
/** Offers queue table — pastel action columns per Figma. */
export function SchoolOffersTable({ title = "Offer queue" }: SchoolOffersTableProps) {
  return (
    <div className="space-y-4">
      <SchoolSectionHeading title={title} titleAs="h2" />
      <div className="overflow-x-auto rounded-xl border border-border-default bg-surface-default">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border-default bg-surface-muted">
              <th className="w-10 px-3 py-3" scope="col">
                <span className="sr-only">Select</span>
              </th>
              <th className="px-3 py-3" scope="col">
                <Typography as="span" variant="label" className="font-semibold text-text-primary">
                  School name
                </Typography>
              </th>
              <th className="px-3 py-3" scope="col">
                <Typography as="span" variant="label" className="font-semibold text-text-primary">
                  Date
                </Typography>
              </th>
              <th className="px-3 py-3" scope="col">
                <Typography as="span" variant="label" className="font-semibold text-text-primary">
                  Detail
                </Typography>
              </th>
              <th className="px-3 py-3" scope="col">
                <Typography as="span" variant="label" className="font-semibold text-text-primary">
                  Approve
                </Typography>
              </th>
              <th className="px-3 py-3" scope="col">
                <Typography as="span" variant="label" className="font-semibold text-text-primary">
                  Amendment
                </Typography>
              </th>
              <th className="px-3 py-3" scope="col">
                <Typography as="span" variant="label" className="font-semibold text-text-primary">
                  Rejected
                </Typography>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.id}
                className={cx(
                  "border-b border-border-default last:border-b-0",
                  i % 2 === 0 ? "bg-surface-default" : "bg-surface-muted/30",
                )}
              >
                <td className="px-3 py-3">
                  <Checkbox aria-label={`Select ${row.school}`} />
                </td>
                <td className="px-3 py-3 font-medium text-text-primary">{row.school}</td>
                <td className="px-3 py-3 text-text-secondary">{row.date}</td>
                <td className="p-2">
                  <button type="button" className={schoolChipActionButtonClass("cyan")}>
                    Detail
                  </button>
                </td>
                <td className="p-2">
                  <button type="button" className={schoolChipActionButtonClass("emerald")}>
                    Approve
                  </button>
                </td>
                <td className="p-2">
                  <button type="button" className={schoolChipActionButtonClass("violet")}>
                    Amendment
                  </button>
                </td>
                <td className="p-2">
                  <button type="button" className={schoolChipActionButtonClass("rose")}>
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-0 py-3">
          <Typography variant="small" className="text-text-secondary">
            Design shell — actions are non-functional until the offers API exists.
          </Typography>
        </div>
      </div>
    </div>
  );
}
/** ################################ /COMPONENT ############################# */
