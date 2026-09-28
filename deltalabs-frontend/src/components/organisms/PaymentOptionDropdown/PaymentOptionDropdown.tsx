/**
 * PaymentOptionDropdown
 * Organism: a searchable popup for choosing a payment method, anchored below
 * its trigger by the surrounding relatively-positioned parent.
 *
 * @example
 * ```tsx
 * <div className="relative">
 *   <button type="button" onClick={() => setOpen(true)}>Payment Option</button>
 *   <PaymentOptionDropdown
 *     isOpen={open}
 *     onClose={() => setOpen(false)}
 *     onSelect={setOption}
 *     selectedId={option?.id}
 *   />
 * </div>
 * ```
 */

/** ################################ IMPORT ############################# */
/** React core, icons, primitives, and local contracts. */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { Popover } from "@/components/molecules/Popover";
import { SearchInput } from "@/components/theme/SearchInput";
import type { PaymentOption, PaymentOptionDropdownProps } from "./PaymentOptionDropdown.types";
import {
  checkClasses,
  emptyClasses,
  iconBadgeClasses,
  iconToneClasses,
  listClasses,
  optionClasses,
  optionIconMap,
  optionIdleClasses,
  optionNameIdleClasses,
  optionNameSelectedClasses,
  optionSelectedClasses,
  panelInnerClasses,
  panelWidthClasses,
  PAYMENT_OPTIONS,
} from "./variants";
/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */

/** One row in the listbox. */
function PaymentOptionRow({
  option,
  isSelected,
  onSelect,
}: Readonly<{
  option: PaymentOption;
  isSelected: boolean;
  onSelect: (option: PaymentOption) => void;
}>) {
  const Icon = optionIconMap[option.icon];

  return (
    <li
      role="option"
      aria-selected={isSelected}
      tabIndex={-1}
      className={cn(optionClasses, isSelected ? optionSelectedClasses : optionIdleClasses)}
      onClick={() => onSelect(option)}
    >
      <span className={cn(iconBadgeClasses, iconToneClasses[option.tone])} aria-hidden="true">
        <Icon className="size-4" />
      </span>

      <span
        className={cn(
          "flex-1 text-sm font-semibold",
          isSelected ? optionNameSelectedClasses : optionNameIdleClasses,
        )}
      >
        {option.name}
      </span>

      {isSelected ? (
        <span className={checkClasses} aria-hidden="true">
          <Check className="size-3" strokeWidth={3} />
        </span>
      ) : null}
    </li>
  );
}

/** Narrows the option list to the current search query. */
function useFilteredOptions(
  options: readonly PaymentOption[],
  searchQuery: string,
): readonly PaymentOption[] {
  return useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return query ? options.filter((option) => option.name.toLowerCase().includes(query)) : options;
  }, [options, searchQuery]);
}

/** Clears the transient search query each time the popup is reopened. */
function useResetOnOpen(isOpen: boolean, reset: () => void) {
  useEffect(() => {
    if (isOpen) {
      reset();
    }
  }, [isOpen, reset]);
}

/**
 * Arrow keys move focus between the rendered rows. Escape is deliberately not
 * handled here: the shared `Popover` already closes on Escape, and handling it
 * in both places would fire `onClose` twice for a single keypress.
 */
function usePopupNavigation(listRef: React.RefObject<HTMLUListElement | null>) {
  return useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
        return;
      }

      event.preventDefault();
      const rows = Array.from(
        listRef.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? [],
      );
      if (rows.length === 0) {
        return;
      }
      const current = rows.indexOf(document.activeElement as HTMLElement);
      const delta = event.key === "ArrowDown" ? 1 : -1;
      const next = current === -1 ? 0 : (current + delta + rows.length) % rows.length;
      rows[next]?.focus();
    },
    [listRef],
  );
}

/** The listbox body: the filtered rows, or an empty-state message. */
function PaymentOptionList({
  listRef,
  options,
  selectedId,
  onSelect,
  ariaLabel,
}: Readonly<{
  listRef: React.RefObject<HTMLUListElement | null>;
  options: readonly PaymentOption[];
  selectedId: string | undefined;
  onSelect: (option: PaymentOption) => void;
  ariaLabel: string;
}>) {
  return (
    <ul ref={listRef} role="listbox" aria-label={ariaLabel} className={listClasses}>
      {options.length > 0 ? (
        options.map((option) => (
          <PaymentOptionRow
            key={option.id}
            option={option}
            isSelected={option.id === selectedId}
            onSelect={onSelect}
          />
        ))
      ) : (
        <li className={emptyClasses}>No payment methods found</li>
      )}
    </ul>
  );
}

/** Exposes a searchable list of payment methods as a popup listbox. */
export function PaymentOptionDropdown({
  isOpen,
  onClose,
  onSelect,
  selectedId,
  ariaLabel = "Payment option",
  options = PAYMENT_OPTIONS,
  className,
}: Readonly<PaymentOptionDropdownProps>) {
  const [searchQuery, setSearchQuery] = useState("");
  const listRef = useRef<HTMLUListElement>(null);

  const filteredOptions = useFilteredOptions(options, searchQuery);
  const handleKeyDown = usePopupNavigation(listRef);
  const clearSearch = useCallback(() => setSearchQuery(""), []);
  useResetOnOpen(isOpen, clearSearch);

  return (
    <Popover
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel={ariaLabel}
      placement="left"
      className={cn(panelWidthClasses, className)}
    >
      <div className={panelInnerClasses} onKeyDown={handleKeyDown}>
        <SearchInput
          autoFocus
          aria-label={`Search ${ariaLabel.toLowerCase()}`}
          placeholder="Search payment method..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />

        <PaymentOptionList
          listRef={listRef}
          options={filteredOptions}
          selectedId={selectedId}
          onSelect={onSelect}
          ariaLabel={ariaLabel}
        />
      </div>
    </Popover>
  );
}

PaymentOptionDropdown.displayName = "PaymentOptionDropdown";
/** ################################ /COMPONENT ############################# */

/** ################################ EXPORTS ############################# */
export default PaymentOptionDropdown;
/** ################################ /EXPORTS ############################# */
