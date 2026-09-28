/** ################################ TYPES ############################# */
/** Props contract for CustomParametersModal. */

/** A single user-defined name/value pair. */
export interface CustomParameter {
  /** Stable row key. Never shown to the user. */
  id: string;
  /** The parameter's name, e.g. "Session length". */
  name: string;
  /** The parameter's value, e.g. "90 minutes". */
  value: string;
}

/** Props for {@link CustomParametersModal}. */
export interface CustomParametersModalProps {
  /** Whether the dialog is visible. */
  isOpen: boolean;
  /** Dismisses the dialog without adding anything. */
  onClose: () => void;
  /**
   * Receives the completed rows. Blank rows are dropped and rows with a name
   * but no value are rejected, so a half-typed row cannot be submitted by
   * accident.
   */
  onAdd: (parameters: CustomParameter[]) => void;
  /** Accessible name for the dialog. Defaults to `"Custom parameters"`. */
  ariaLabel?: string;
  /** Extra classes merged onto the content area. */
  className?: string;
}
/** ################################ /TYPES ############################# */
