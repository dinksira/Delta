/**
 * SearchFilterSortBar
 * Molecule: a single pill-shaped control bar combining a growing search input
 * with two utility actions (filter, sort) separated by hairline dividers.
 *
 * @example
 * ```tsx
 * <SearchFilterSortBar
 *   value={query}
 *   onChange={setQuery}
 *   onFilterClick={openFilters}
 *   onSortClick={cycleSort}
 *   isFilterActive={hasFilters}
 * />
 * ```
 */

/** ################################ IMPORT ############################# */
/** React core, icon set, class-merging utility, and local variant maps. */
import React from "react";
import { ArrowDownUp, Search, SlidersHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";
import { actionBaseClasses, actionStateClasses, sizeClasses } from "./variants";
import type { SearchFilterSortBarProps } from "./SearchFilterSortBar.types";
/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */

/**
 * Renders the search field plus filter and sort actions inside one rounded
 * surface, so a list view needs a single control row instead of three.
 */
export const SearchFilterSortBar: React.FC<Readonly<SearchFilterSortBarProps>> = ({
  value,
  onChange,
  onFilterClick,
  onSortClick,
  isFilterActive = false,
  isSortActive = false,
  placeholder = "Search",
  inputAriaLabel = "Search",
  filterAriaLabel = "Filter results",
  sortAriaLabel = "Sort results",
  size = "md",
  className,
}) => {
  /** Hairline rule shared by both dividers. */
  const dividerClasses = "h-5 w-px flex-shrink-0 bg-border-default";

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-md items-center rounded-full border border-border-default bg-surface-canvas px-4",
        sizeClasses[size],
        className,
      )}
      role="search"
    >
      <Search className="h-4 w-4 flex-shrink-0 text-text-secondary" aria-hidden="true" />

      <input
        type="text"
        value={value}
        placeholder={placeholder}
        aria-label={inputAriaLabel}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 bg-transparent px-3 text-sm text-text-primary outline-none placeholder:text-text-tertiary focus:outline-none"
      />

      <span className={dividerClasses} aria-hidden="true" />

      <button
        type="button"
        onClick={onFilterClick}
        aria-label={filterAriaLabel}
        aria-pressed={isFilterActive}
        className={cn(
          actionBaseClasses,
          isFilterActive ? actionStateClasses.active : actionStateClasses.idle,
        )}
      >
        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
      </button>

      <span className={dividerClasses} aria-hidden="true" />

      <button
        type="button"
        onClick={onSortClick}
        aria-label={sortAriaLabel}
        aria-pressed={isSortActive}
        className={cn(
          actionBaseClasses,
          isSortActive ? actionStateClasses.active : actionStateClasses.idle,
        )}
      >
        <ArrowDownUp className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
};

SearchFilterSortBar.displayName = "SearchFilterSortBar";
/** ################################ /COMPONENT ############################# */

/** ################################ EXPORTS ############################# */
export default SearchFilterSortBar;
/** ################################ /EXPORTS ############################# */
