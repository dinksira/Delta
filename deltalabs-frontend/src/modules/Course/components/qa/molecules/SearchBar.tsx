/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import React from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { cx } from "@/components/theme/utils";

/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** 
 * SearchBar Molecule
 * Contains a search input and a filter button.
 */
export const SearchBar: React.FC = () => {
  return (
    <div className="flex items-center justify-center gap-3 w-full py-6">
      <div className="relative w-full max-w-[400px]">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
        <input 
          type="text" 
          placeholder="Search"
          className="w-full h-11 pl-11 pr-4 rounded-xl border border-border-subtle bg-surface-secondary text-[14px] text-text-primary placeholder:text-text-tertiary outline-none focus:border-primary-600/50 transition-all"
        />
      </div>
      <button className="flex h-11 w-11 items-center justify-center rounded-xl border border-border-subtle bg-surface-secondary text-text-secondary hover:bg-surface-muted transition-colors active:scale-95">
        <SlidersHorizontal className="h-5 w-5" />
      </button>
    </div>
  );
};

/** ################################ /COMPONENT ############################# */
