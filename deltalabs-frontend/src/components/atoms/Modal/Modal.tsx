/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
/**
 * Modal — the shared centred dialog surface.
 *
 * Kept as a thin wrapper rather than a second implementation of dialog
 * behaviour: it owns the legacy `Modal` API used across the app, while
 * semantics, Escape handling, and focus management live here so no consumer
 * has to re-implement them.
 */
"use client";

import { useCallback, useEffect, useRef } from "react";
import { X } from "lucide-react";

import {
  backdropClasses,
  bodyClasses,
  closeButtonClasses,
  headerClasses,
  headerTitleClasses,
  overlayClasses,
  panelClasses,
  titleClasses,
} from "./variants";

/** Props for {@link Modal}. */
export interface ModalProps {
  /** Whether the dialog is visible. Renders `null` when `false`. */
  isOpen: boolean;
  /** Dismisses the dialog. Fired by Escape, the backdrop, and the close button. */
  onClose: () => void;
  /** Heading text. Also used as the dialog's accessible name. */
  title?: string;
  /** Dialog contents. */
  children: React.ReactNode;
  /** Extra classes for the panel. Supply `max-w-*` to override the default width. */
  className?: string;
  /** Whether to render the heading row and close button. */
  showHeader?: boolean;
  /** Removes the default body padding. */
  noPadding?: boolean;
  /**
   * Accessible name for the dialog. Required in practice whenever
   * `showHeader` is `false`, because there is then no title to name it with.
   */
  ariaLabel?: string;
}

/** Elements that can receive focus inside the panel. */
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/** Focusable descendants of the panel, in document order. */
function getFocusable(panel: HTMLElement): HTMLElement[] {
  return Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}

/** Restores focus to whatever was focused before the dialog opened. */
function useRestoreFocus(isOpen: boolean) {
  const previousRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousRef.current = document.activeElement as HTMLElement | null;
      return;
    }
    previousRef.current?.focus?.();
    previousRef.current = null;
  }, [isOpen]);
}

/** Locks body scrolling while the dialog is open, restoring the prior value. */
function useBodyScrollLock(isOpen: boolean) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);
}

/**
 * Moves focus into the panel and keeps Tab inside it.
 *
 * The panel is `aria-modal`, so content behind it is not reachable; without
 * this, Tab still walked the page underneath. A capture-phase listener is used
 * so the wrap-around applies before anything else can move focus. Escape is
 * deliberately *not* handled here — it stays on the React handler so nested
 * layers (the emoji disclosure, for example) can consume it first.
 */
function useFocusTrap(isOpen: boolean, panelRef: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const panel = panelRef.current;
    if (!isOpen || !panel) {
      return;
    }

    panel.focus();

    const handleTab = (event: KeyboardEvent) => {
      if (event.key !== "Tab") {
        return;
      }
      const focusable = getFocusable(panel);
      if (focusable.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleTab, true);
    return () => {
      document.removeEventListener("keydown", handleTab, true);
    };
  }, [isOpen, panelRef]);
}

/** Closes the dialog when Escape is pressed anywhere inside it. */
function useEscapeToClose(onClose: () => void) {
  return useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    },
    [onClose],
  );
}

/** Props for {@link ModalHeader}. */
export interface ModalHeaderProps {
  /** Heading text, omitted when absent. */
  title?: string;
  /** Dismisses the dialog. */
  onClose: () => void;
}

/** Centred heading with a labelled close button. */
function ModalHeader({ title, onClose }: Readonly<ModalHeaderProps>) {
  return (
    <div className={headerClasses}>
      <div className={headerTitleClasses}>
        {title ? <h2 className={titleClasses}>{title}</h2> : null}
      </div>
      <button type="button" onClick={onClose} aria-label="Close dialog" className={closeButtonClasses}>
        <X className="size-6" aria-hidden="true" />
      </button>
    </div>
  );
}

/** Centred dialog with a heading row, close button, and backdrop. */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className,
  showHeader = true,
  noPadding = false,
  ariaLabel,
}: Readonly<ModalProps>) {
  const panelRef = useRef<HTMLDivElement>(null);
  useBodyScrollLock(isOpen);
  useRestoreFocus(isOpen);
  useFocusTrap(isOpen, panelRef);
  const handleKeyDown = useEscapeToClose(onClose);

  if (!isOpen) {
    return null;
  }

  return (
    <div className={overlayClasses} onKeyDown={handleKeyDown}>
      {/* Decorative capture layer; Escape is the keyboard dismissal path. */}
      <div aria-hidden="true" className={backdropClasses} onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel ?? title}
        tabIndex={-1}
        className={panelClasses(className)}
      >
        {showHeader ? <ModalHeader title={title} onClose={onClose} /> : null}
        <div className={bodyClasses(noPadding)}>{children}</div>
      </div>
    </div>
  );
}

export default Modal;
/** ################################ /COMPONENT ############################# */
