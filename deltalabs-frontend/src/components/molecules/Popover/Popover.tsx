/**
 * Popover
 * Molecule: the shared chrome for a non-modal popup anchored to a trigger —
 * a transparent capture layer plus an elevated panel that dismisses on
 * `Escape` and on an outside pointer press.
 *
 * @example
 * ```tsx
 * <div className="relative">
 *   <button type="button" onClick={() => setOpen(true)}>Open</button>
 *   <Popover
 *     isOpen={open}
 *     onClose={() => setOpen(false)}
 *     ariaLabel="Payment option"
 *     placement="left"
 *     className="w-72"
 *   >
 *     <ul role="listbox">{items}</ul>
 *   </Popover>
 * </div>
 * ```
 */

/** ################################ IMPORT ############################# */
/** React core, class utility, and local contracts. */
import React from "react";

import { cn } from "@/lib/utils";
import type { PopoverProps } from "./Popover.types";
import { backdropClasses, panelClasses, placementClasses } from "./variants";
/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */

/** Wraps popup content in the shared dismissible panel. */
export function Popover({
  isOpen,
  onClose,
  ariaLabel,
  placement = "left",
  className,
  onKeyDown,
  children,
}: Readonly<PopoverProps>) {
  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Decorative capture layer: Escape is the keyboard dismissal path. */}
      <div aria-hidden="true" className={backdropClasses} onPointerDown={onClose} />

      <div
        role="dialog"
        aria-label={ariaLabel}
        className={cn(panelClasses, placementClasses[placement], className)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            onClose();
            return;
          }
          onKeyDown?.(event);
        }}
      >
        {children}
      </div>
    </>
  );
}

Popover.displayName = "Popover";

export default Popover;
/** ################################ /COMPONENT ############################# */
