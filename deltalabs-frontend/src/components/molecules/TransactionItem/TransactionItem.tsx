/**
 * TransactionItem
 * Molecule: one wallet activity row. A direction-tinted icon badge sits
 * beside the title and subtitle, with the signed amount and a status pill
 * on the right; the date is a real `<time>` element.
 *
 * Render inside a `<ul>` — the root is an `<li>`.
 *
 * @example
 * ```tsx
 * <ul className="divide-y divide-border-subtle">
 *   <TransactionItem
 *     direction="out"
 *     title="Course enrollment"
 *     subtitle="CBE"
 *     amountLabel="-320.00"
 *     status="completed"
 *     timestamp="2026-10-07T14:02:00.000Z"
 *     timestampLabel="Yesterday · 14:02"
 *   />
 * </ul>
 * ```
 */

/** ################################ IMPORT ############################# */
/** Class merger, prop contract, variant registries. */
import { cn } from "@/lib/utils";
import type { TransactionItemProps } from "./TransactionItem.types";
import {
  amountClasses,
  directionIconMap,
  directionToneClasses,
  iconBadgeClasses,
  rowClasses,
  statusClasses,
  statusLabels,
} from "./variants";
/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
export function TransactionItem({
  direction,
  title,
  subtitle,
  amountLabel,
  currencyLabel = "ETB",
  status,
  timestamp,
  timestampLabel,
  className,
}: Readonly<TransactionItemProps>) {
  const Icon = directionIconMap[direction];

  return (
    <li className={cn(rowClasses, className)}>
      <span className={cn(iconBadgeClasses, directionToneClasses[direction])} aria-hidden="true">
        <Icon className="size-5" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-text-primary">{title}</p>
        <p className="mt-0.5 truncate text-xs text-text-secondary">
          {subtitle}
          <span aria-hidden="true"> · </span>
          <time dateTime={timestamp} className="sr-only">
            {timestampLabel}
          </time>
          <span aria-hidden="true">{timestampLabel}</span>
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className={cn("text-sm font-bold tabular-nums", amountClasses[direction])}>
          {amountLabel} {currencyLabel}
        </span>
        <span
          className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", statusClasses[status])}
        >
          {statusLabels[status]}
        </span>
      </div>
    </li>
  );
}

TransactionItem.displayName = "TransactionItem";
/** ################################ /COMPONENT ############################# */

/** ################################ EXPORTS ############################# */
export default TransactionItem;
/** ################################ /EXPORTS ############################# */
