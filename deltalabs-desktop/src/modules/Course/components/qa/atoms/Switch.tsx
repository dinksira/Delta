/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import React from "react";
import { cx } from "@/components/theme/utils";

/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** 
 * Switch Atom
 * A simple toggle switch component.
 */
export const Switch: React.FC<{ checked?: boolean, onChange?: (val: boolean) => void }> = ({ 
  checked = false, 
  onChange 
}) => {
  return (
    <button
      onClick={() => onChange?.(!checked)}
      className={cx(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 outline-none",
        checked ? "bg-primary-900" : "bg-text-tertiary/30"
      )}
    >
      <span
        className={cx(
          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200",
          checked ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
};

/** ################################ /COMPONENT ############################# */
