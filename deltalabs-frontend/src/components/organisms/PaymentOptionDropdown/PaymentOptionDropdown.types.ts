/** ################################ TYPES ############################# */
/** Props and data contracts for PaymentOptionDropdown. */

/** Icon families the dropdown knows how to render. Serialisable on purpose. */
export type PaymentOptionIcon = "none" | "card" | "bank" | "wallet";

/** Token-backed fill for the icon badge. Never a raw palette class. */
export type PaymentOptionTone = "neutral" | "primary" | "info" | "success";

/** One selectable payment method. */
export interface PaymentOption {
  /** Stable identifier reported back through `onSelect`. */
  id: string;
  /** Visible label. */
  name: string;
  /** Icon key resolved through the `optionIconMap` in `variants.ts`. */
  icon: PaymentOptionIcon;
  /** Icon badge fill. */
  tone: PaymentOptionTone;
}

/** Props for {@link PaymentOptionDropdown}. */
export interface PaymentOptionDropdownProps {
  /** Whether the popup is visible. The component renders nothing when false. */
  isOpen: boolean;
  /** Invoked by the backdrop, the Escape key, and after a selection. */
  onClose: () => void;
  /** Receives the chosen option. */
  onSelect: (option: PaymentOption) => void;
  /** Id of the currently selected option, if any. */
  selectedId?: string;
  /** Accessible name for the listbox. Defaults to `"Payment option"`. */
  ariaLabel?: string;
  /** Overridable option list; defaults to the built-in payment methods. */
  options?: readonly PaymentOption[];
  /** Extra classes merged onto the popover panel. */
  className?: string;
}
/** ################################ /TYPES ############################# */
