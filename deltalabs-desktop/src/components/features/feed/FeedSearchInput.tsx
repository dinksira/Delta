/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import type { ChangeEventHandler, FocusEventHandler, KeyboardEventHandler } from "react";
import { SearchInput } from "@/components/theme/SearchInput";

/** ################################ /IMPORT ############################# */
/** ################################ TYPES ############################# */
/** Type definitions used in this file. */
type FeedSearchInputProps = Readonly<{
  id?: string;
  placeholder?: string;
  /** When set with toggle handlers, shows the funnel control wired to the filter panel. */
  filterControlsId?: string;
  isFilterOpen?: boolean;
  onFilterToggle?: () => void;
  /** Accessible name for the filter trigger (e.g. localized "Filters"). */
  filterAriaLabel?: string;
  value?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  onFocus?: FocusEventHandler<HTMLInputElement>;
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
}>;

/** ################################ /TYPES ############################# */
/** ################################ SUBCOMPONENTS ############################# */
/** Local subcomponents used by the main export. */
function IconFilterFunnel({ className }: Readonly<{ className?: string }>) {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 20 20"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M3.5 5.25h13M5.75 10h8.5M8 14.75h4"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** ################################ /SUBCOMPONENTS ############################# */
/** ################################ COMPONENT ############################# */
/** Feed hub: theme `SearchInput` plus optional filter funnel. */
export function FeedSearchInput({
  id = "feed-search",
  placeholder = "Search...",
  filterControlsId,
  isFilterOpen,
  onFilterToggle,
  filterAriaLabel = "Filters",
  value,
  onChange,
  onFocus,
  onKeyDown,
}: FeedSearchInputProps) {
  const showFilter = Boolean(filterControlsId && onFilterToggle);

  return (
    <SearchInput
      id={id}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      startSlot={
        showFilter ? (
          <button
            type="button"
            aria-label={filterAriaLabel}
            aria-expanded={Boolean(isFilterOpen)}
            aria-controls={filterControlsId}
            onClick={onFilterToggle}
            className="inline-flex shrink-0 items-center justify-center rounded-full p-1.5 text-slate-600 transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 dark:text-slate-300"
          >
            <IconFilterFunnel className="shrink-0" />
          </button>
        ) : undefined
      }
    />
  );
}
/** ################################ /COMPONENT ############################# */
