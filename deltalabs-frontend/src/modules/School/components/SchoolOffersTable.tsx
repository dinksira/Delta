import { Typography } from "@/components/theme";
import { cx } from "@/components/theme/utils";

import { SchoolSectionHeading } from "@/modules/School/components/SchoolSectionHeading";

const rows = [
  { id: "1", school: "Saint Joseph School", date: "1/30/2025" },
  { id: "2", school: "Addis Ababa University", date: "1/28/2025" },
  { id: "3", school: "Lincoln High School", date: "1/22/2025" },
] as const;

const actionClass = "rounded-md px-3 py-2 text-center text-xs font-semibold";

type SchoolOffersTableProps = Readonly<{
  title?: string;
}>;

/** Offers queue table — pastel action columns per Figma. */
export function SchoolOffersTable({ title = "Offer queue" }: SchoolOffersTableProps) {
  return (
    <div className="space-y-4">
      <SchoolSectionHeading title={title} titleAs="h2" />
      <div className="overflow-x-auto rounded-xl border border-slate-200/90 bg-surface-default dark:border-border-default">
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border-default bg-slate-100/90 dark:bg-slate-800/50">
            <th className="w-10 px-3 py-3" scope="col">
              <span className="sr-only">Select</span>
            </th>
            <th className="px-3 py-3 font-semibold text-text-primary" scope="col">
              School name
            </th>
            <th className="px-3 py-3 font-semibold text-text-primary" scope="col">
              Date
            </th>
            <th className="px-3 py-3 font-semibold text-text-primary" scope="col">
              Detail
            </th>
            <th className="px-3 py-3 font-semibold text-text-primary" scope="col">
              Approve
            </th>
            <th className="px-3 py-3 font-semibold text-text-primary" scope="col">
              Amendment
            </th>
            <th className="px-3 py-3 font-semibold text-text-primary" scope="col">
              Rejected
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
                <input type="checkbox" className="rounded border-border-default" aria-label={`Select ${row.school}`} />
              </td>
              <td className="px-3 py-3 font-medium text-text-primary">{row.school}</td>
              <td className="px-3 py-3 text-text-secondary">{row.date}</td>
              <td className={cx("p-2", actionClass, "bg-sky-100 text-sky-900 dark:bg-sky-950/40 dark:text-sky-100")}>
                Detail
              </td>
              <td className={cx("p-2", actionClass, "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100")}>
                Approve
              </td>
              <td className={cx("p-2", actionClass, "bg-violet-100 text-violet-900 dark:bg-violet-950/40 dark:text-violet-100")}>
                Amendment
              </td>
              <td className={cx("p-2", actionClass, "bg-rose-100 text-rose-900 dark:bg-rose-950/40 dark:text-rose-100")}>
                Reject
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
