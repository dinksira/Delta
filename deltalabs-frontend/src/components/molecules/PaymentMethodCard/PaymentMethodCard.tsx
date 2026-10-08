/**
 * PaymentMethodCard
 * Molecule: one stored payment method. A tinted provider badge sits beside
 * the provider name and masked account, with a verification pill (and an
 * optional Default chip) on the right, plus optional set-default / remove
 * text actions underneath.
 *
 * Presentational: selection and mutation state stay in the feature hooks.
 *
 * @example
 * ```tsx
 * <PaymentMethodCard
 *   iconKey="cbe"
 *   label="Commercial Bank of Ethiopia"
 *   accountLabel="•••• •••• 4821"
 *   status="verified"
 *   isDefault
 *   onSetDefault={() => makeDefault(id)}
 *   onRemove={() => remove(id)}
 * />
 * ```
 */

/** ################################ IMPORT ############################# */
/** Provider glyphs, class merger, prop contract, variant maps. */
import { CheckCircle2, Clock, Star, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import type { PaymentMethodCardProps } from "./PaymentMethodCard.types";
import {
  actionClasses,
  cardClasses,
  dangerActionClasses,
  defaultChipClasses,
  iconBadgeClasses,
  methodIconMap,
  methodToneClasses,
  statusClasses,
} from "./variants";
/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
export function PaymentMethodCard({
  iconKey,
  label,
  accountLabel,
  status,
  isDefault = false,
  onSetDefault,
  onRemove,
  className,
}: Readonly<PaymentMethodCardProps>) {
  const Icon = methodIconMap[iconKey];

  return (
    <article className={cn(cardClasses, className)}>
      <span className={cn(iconBadgeClasses, methodToneClasses[iconKey])} aria-hidden="true">
        <Icon className="size-5" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-sm font-semibold text-text-primary">{label}</h3>
          {isDefault ? (
            <span className={defaultChipClasses}>
              <Star className="size-3" aria-hidden="true" />
              Default
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 truncate text-xs text-text-secondary">{accountLabel}</p>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
              statusClasses[status],
            )}
          >
            {status === "verified" ? (
              <CheckCircle2 className="size-3.5" aria-hidden="true" />
            ) : (
              <Clock className="size-3.5" aria-hidden="true" />
            )}
            {status === "verified" ? "Verified" : "Pending verification"}
          </span>

          {onSetDefault || onRemove ? (
            <span className="flex items-center gap-3">
              {onSetDefault && !isDefault ? (
                <button type="button" className={actionClasses} onClick={onSetDefault}>
                  Make default
                </button>
              ) : null}
              {onRemove ? (
                <button
                  type="button"
                  className={cn(actionClasses, dangerActionClasses)}
                  aria-label={`Remove ${label} payment method`}
                  onClick={onRemove}
                >
                  <Trash2 className="mr-1 inline size-3.5" aria-hidden="true" />
                  Remove
                </button>
              ) : null}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

PaymentMethodCard.displayName = "PaymentMethodCard";
/** ################################ /COMPONENT ############################# */

/** ################################ EXPORTS ############################# */
export default PaymentMethodCard;
/** ################################ /EXPORTS ############################# */
