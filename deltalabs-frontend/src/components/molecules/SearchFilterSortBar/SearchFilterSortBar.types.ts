/**
 * SearchFilterSortBar.types
 * Prop and variant types for the `SearchFilterSortBar` molecule.
 *
 * @example
 * ```tsx
 * const [query, setQuery] = useState("");
 * <SearchFilterSortBar value={query} onChange={setQuery} onFilterClick={open} onSortClick={sort} />
 * ```
 */

/** Control density. `sm` is a 40px bar, `md` is the 48px default. */
export type SearchFilterSortBarSize = "sm" | "md";

/** Public props for `SearchFilterSortBar`. */
export interface SearchFilterSortBarProps {
  /** Current value of the search input. */
  value: string;
  /** Callback fired on every keystroke. */
  onChange: (value: string) => void;
  /** Callback fired when the filter action button is pressed. */
  onFilterClick: () => void;
  /** Callback fired when the sort action button is pressed. */
  onSortClick: () => void;
  /** Whether a filter is currently applied — tints the filter action. */
  isFilterActive?: boolean;
  /** Whether a sort is currently applied — tints the sort action. */
  isSortActive?: boolean;
  /** Input placeholder text. */
  placeholder?: string;
  /** Accessible label for the search input. */
  inputAriaLabel?: string;
  /** Accessible label for the filter action button. */
  filterAriaLabel?: string;
  /** Accessible label for the sort action button. */
  sortAriaLabel?: string;
  /** Control density. Defaults to `md`. */
  size?: SearchFilterSortBarSize;
  /** Extra classes merged onto the bar root. */
  className?: string;
}
