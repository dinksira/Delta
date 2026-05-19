/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import React from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight 
} from "lucide-react";
import { cx } from "@/components/theme/utils";

/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** 
 * Pagination Molecule
 * Centered horizontal row for navigating question pages.
 */
export const Pagination: React.FC = () => {
  const pages = ["1", "2", "3", "4", "...", "25"];
  const activePage = "2";

  return (
    <div className="flex items-center justify-center gap-6 py-10">
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-1 text-xs font-bold text-text-tertiary hover:text-text-primary transition-colors group">
          <ChevronsLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
          First
        </button>
        <button className="flex items-center gap-1 text-xs font-bold text-text-tertiary hover:text-text-primary transition-colors group ml-2">
          <ChevronLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back
        </button>
      </div>

      <div className="flex items-center gap-2">
        {pages.map((page, i) => {
          const isActive = page === activePage;
          const isEllipsis = page === "...";
          
          if (isEllipsis) {
            return (
              <span key={`el-${i}`} className="text-sm font-bold text-text-tertiary px-2">
                {page}
              </span>
            );
          }

          return (
            <button
              key={page}
              className={cx(
                "h-8 w-8 rounded-lg text-sm font-bold transition-all duration-200 active:scale-90",
                isActive 
                  ? "bg-text-primary text-white shadow-md shadow-black/10" 
                  : "text-text-tertiary hover:bg-surface-secondary hover:text-text-primary"
              )}
            >
              {page}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <button className="flex items-center gap-1 text-xs font-bold text-text-tertiary hover:text-text-primary transition-colors group mr-2">
          Next
          <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
        <button className="flex items-center gap-1 text-xs font-bold text-text-tertiary hover:text-text-primary transition-colors group">
          Last
          <ChevronsRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};

/** ################################ /COMPONENT ############################# */
