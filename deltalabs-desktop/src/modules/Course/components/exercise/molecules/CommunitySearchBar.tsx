/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
/** CommunitySearchBar Molecule: Rounded search input with custom stylized icon. */
import React from "react";
import { Search } from "lucide-react";
import { cx } from "@/components/theme/utils";

export interface CommunitySearchBarProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const CommunitySearchBar: React.FC<CommunitySearchBarProps> = ({
  value,
  onChange,
  placeholder = "Search",
  className,
}) => {
  return (
    <div className={cx("relative w-full max-w-[600px] mx-auto", className)}>
      <Search 
        className="absolute left-4 top-1/2 -translate-y-1/2 text-[#114B5F]/40" 
        size={20} 
      />
      <input 
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full h-12 pl-12 pr-14 rounded-xl border border-[#E2E8F0] bg-white text-[15px] placeholder:text-[#114B5F]/40 outline-none focus:border-[#114B5F]/60 transition-all shadow-sm"
      />
      
      {/* Custom Stylized Icon from Mockup */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
        <div className="w-6 h-6 flex flex-col items-center justify-center gap-[2px]">
          <div className="w-5 h-[1.5px] bg-[#114B5F]/40 rounded-full" />
          <div className="w-5 h-[1.5px] bg-[#114B5F]/40 rounded-full translate-x-1" />
          <div className="w-5 h-[1.5px] bg-[#114B5F]/40 rounded-full -translate-x-1" />
          <div className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-[#114B5F]/20" />
        </div>
      </div>
    </div>
  );
};

export default CommunitySearchBar;
/** ################################ /COMPONENT ############################# */
