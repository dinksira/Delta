/**
 * usePeriodMenu
 * Internal state machine backing the `PeriodSelector` popup. Not part of the
 * public surface: it is deliberately absent from the folder's `index.ts`.
 *
 * Split out of `PeriodSelector.tsx` so each function stays under the 50-line
 * limit and the component file stays a thin render.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type React from "react";

import type { PeriodSelectorProps } from "./PeriodSelector.types";

/** Selector used to move DOM focus between the rendered options. */
const OPTION_SELECTOR = "[role=option]";

/** The rendered option elements, typed so `focus` is available. */
function getOptionElements(root: HTMLElement | null): HTMLElement[] {
  return Array.from(root?.querySelectorAll<HTMLElement>(OPTION_SELECTOR) ?? []);
}

/** Dismisses the popup on any pointer press outside `root`. */
function useDismissOnOutsidePress(
  isOpen: boolean,
  root: React.RefObject<HTMLSpanElement | null>,
  onDismiss: () => void,
) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) {
        onDismiss();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen, onDismiss, root]);
}

/** Roving focus over the options: arrows wrap, Escape and Tab dismiss. */
function useOptionNavigation(
  activeIndex: number,
  optionCount: number,
  onDismiss: (restoreFocus: boolean) => void,
  root: React.RefObject<HTMLSpanElement | null>,
  setActiveIndex: (index: number) => void,
) {
  return useCallback(
    (event: React.KeyboardEvent<HTMLUListElement>) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onDismiss(true);
        return;
      }
      if (event.key === "Tab") {
        onDismiss(false);
        return;
      }
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
        return;
      }

      event.preventDefault();
      const delta = event.key === "ArrowDown" ? 1 : -1;
      const next = (activeIndex + delta + optionCount) % optionCount;
      setActiveIndex(next);
      getOptionElements(root.current)[next]?.focus();
    },
    [activeIndex, onDismiss, optionCount, root, setActiveIndex],
  );
}

/** Focuses the active option after the options are actually in the DOM. */
function useFocusOnOpen(
  isOpen: boolean,
  focusOnOpen: boolean,
  activeIndex: number,
  root: React.RefObject<HTMLSpanElement | null>,
  clear: () => void,
) {
  useEffect(() => {
    if (isOpen && focusOnOpen) {
      getOptionElements(root.current)[activeIndex]?.focus();
      clear();
    }
  }, [activeIndex, clear, focusOnOpen, isOpen, root]);
}

/** Open state, roving focus, and the handlers for the trigger and listbox. */
export function usePeriodMenu<T extends string>({
  value,
  options,
  onChange,
}: Readonly<Pick<PeriodSelectorProps<T>, "value" | "options" | "onChange">>) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [focusOnOpen, setFocusOnOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback((restoreFocus: boolean) => {
    setIsOpen(false);
    if (restoreFocus) {
      triggerRef.current?.focus();
    }
  }, []);

  /** Opens the popup, optionally moving focus onto the selected option. */
  const open = useCallback(
    (focusSelected: boolean) => {
      setActiveIndex(Math.max(options.indexOf(value), 0));
      setIsOpen(true);
      setFocusOnOpen(focusSelected);
    },
    [options, value],
  );

  const select = useCallback(
    (option: T) => {
      onChange(option);
      close(true);
    },
    [close, onChange],
  );

  /** Focuses the selected option once the options are actually in the DOM. */
  useFocusOnOpen(isOpen, focusOnOpen, activeIndex, rootRef, () => setFocusOnOpen(false));

  useDismissOnOutsidePress(isOpen, rootRef, () => setIsOpen(false));
  const handleListKeyDown = useOptionNavigation(
    activeIndex,
    options.length,
    close,
    rootRef,
    setActiveIndex,
  );

  return { isOpen, activeIndex, rootRef, triggerRef, open, close, select, handleListKeyDown };
}
