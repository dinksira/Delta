/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
/** PaginationControl Molecule: Standard pagination as seen in mockups. */
import React from "react";
import { cx } from "@/components/theme/utils";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

export interface PaginationControlProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const PaginationControl: React.FC<PaginationControlProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className,
}) => {
  const pages = [1, 2, 3, 4, "...", totalPages];

  return (
    <div className={cx("flex items-center justify-center gap-2 mt-12", className)}>
      <PaginationButton onClick={() => onPageChange(1)} disabled={currentPage === 1}>
        <ChevronsLeft size={16} className="mr-1" /> First
      </PaginationButton>
      
      <PaginationButton onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
        <ChevronLeft size={16} className="mr-1" /> Back
      </PaginationButton>

      <div className="flex items-center gap-2 mx-2">
        {pages.map((p, i) => (
          <button
            key={i}
            onClick={() => typeof p === "number" && onPageChange(p)}
            className={cx(
              "w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-all",
              p === currentPage 
                ? "bg-[#114B5F] text-white shadow-md" 
                : "text-[#64748B] hover:bg-[#E2E8F0]/50"
            )}
          >
            {p}
          </button>
        ))}
      </div>

      <PaginationButton onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
        Next <ChevronRight size={16} className="ml-1" />
      </PaginationButton>

      <PaginationButton onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages}>
        Last <ChevronsRight size={16} className="ml-1" />
      </PaginationButton>
    </div>
  );
};

const PaginationButton: React.FC<{ 
  children: React.ReactNode; 
  onClick: () => void; 
  disabled?: boolean;
}> = ({ children, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="h-10 px-4 rounded-lg border border-[#E2E8F0] flex items-center text-[13px] font-bold text-[#64748B] hover:bg-[#E2E8F0]/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
  >
    {children}
  </button>
);

export default PaginationControl;
/** ################################ /COMPONENT ############################# */
