/**
 * SearchPill
 * Molecule: A reusable, high-fidelity pill-shaped search bar with an integrated filter dropdown.
 * Following Atomic Design: Molecule.
 */

import React from 'react';
import { Search } from "lucide-react";
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface SearchPillOption {
  label: string;
  value: string;
}

export interface SearchPillProps {
  /** Current value of the search input */
  value: string;
  /** Callback triggered on every keystroke */
  onChange: (value: string) => void;
  /** Currently active filter value */
  activeFilter?: string;
  /** Callback triggered when a filter option is selected */
  onFilterChange?: (value: string) => void;
  /** List of available filter options */
  filterOptions?: SearchPillOption[];
  /** Placeholder text for the input */
  placeholder?: string;
  /** Input height: `"sm"` (40px) for compact rows, `"md"` (48px) default */
  size?: "sm" | "md";
  /** Optional additional classes */
  className?: string;
}

const inputSizeClasses: Record<NonNullable<SearchPillProps["size"]>, string> = {
  sm: "h-10 text-sm",
  md: "h-12 text-base",
};

// ============================================================================
// COMPONENT
// ============================================================================

export const SearchPill: React.FC<SearchPillProps> = ({
  value,
  onChange,
  activeFilter,
  onFilterChange,
  filterOptions = [],
  placeholder = "Search...",
  size = "md",
  className
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeOption = filterOptions.find(opt => opt.value === activeFilter);

  return (
    <div className={cn("w-full max-w-2xl relative group", className)} ref={dropdownRef}>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full pl-6 pr-44 rounded-full border border-border-default bg-surface-default text-text-primary outline-none transition-all focus:border-primary-600 focus:ring-4 focus:ring-primary-600/5 placeholder:text-text-tertiary",
          inputSizeClasses[size]
        )}
      />

      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2.5 text-text-secondary">
        <Search
          size={18}
          className="cursor-pointer hover:text-primary-600 transition-colors"
        />

        <div className="w-px h-4 bg-border-default" />

        {/* Filter Toggle */}
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors hover:text-primary-600",
            isDropdownOpen && "text-primary-600 bg-surface-muted"
          )}
          aria-label="Filter"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 4.5H15M5.25 9H12.75M7.5 13.5H10.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {activeOption && (
            <span className="max-w-28 truncate text-xs font-bold whitespace-nowrap hidden sm:inline">
              {activeOption.label}
            </span>
          )}
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && filterOptions.length > 0 && (
          <div className="absolute top-full right-0 mt-2 w-48 rounded-xl border border-border-default bg-surface-default shadow-lg py-2 z-50 animate-in fade-in zoom-in duration-200">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onFilterChange?.(option.value);
                  setIsDropdownOpen(false);
                }}
                className={cn(
                  "w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-surface-muted",
                  activeFilter === option.value ? "text-primary-600 font-bold bg-primary-50/30" : "text-text-secondary"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default SearchPill;
