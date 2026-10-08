/**
 * PaymentMethodCard.types
 * Prop types for the `PaymentMethodCard` molecule.
 *
 * The provider icon is a serialisable key resolved in `variants.ts` (the
 * `RequirementCard` pattern), so callers never pass raw glyphs and the
 * registry stays in one place.
 *
 * @example
 * ```tsx
 * <PaymentMethodCard
 *   iconKey="telebirr"
 *   label="Telebirr"
 *   accountLabel="+2519 •• •• 12"
 *   status="verified"
 *   isDefault
 *   onRemove={() => remove(id)}
 * />
 * ```
 */

/** Serialisable provider keys; each maps to an icon and a tone in `variants.ts`. */
export type PaymentMethodIconKey = "telebirr" | "mpesa" | "cbe" | "awash" | "amole" | "chapa";

/** Verification state of the stored method. */
export type PaymentMethodCardStatus = "verified" | "pending";

/** Public props for `PaymentMethodCard`. */
export interface PaymentMethodCardProps {
  /** Provider key resolved to an icon + tone in `variants.ts`. */
  iconKey: PaymentMethodIconKey;
  /** Provider display name, e.g. `"Telebirr"`. */
  label: string;
  /** Masked account/phone shown under the name, e.g. `"+2519 •• •• 12"`. */
  accountLabel: string;
  /** Verification state, rendered as a status pill. */
  status: PaymentMethodCardStatus;
  /** Marks this as the wallet's default method. */
  isDefault?: boolean;
  /** Prompts to make this the default. Hidden when omitted or already default. */
  onSetDefault?: () => void;
  /** Removes the method. Hidden when omitted. */
  onRemove?: () => void;
  /** Extra classes merged onto the card root. */
  className?: string;
}
