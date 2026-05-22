"use client";

import React, { useState } from "react";
import { Search, Check, CreditCard, Landmark, Wallet } from "lucide-react";
import { Typography } from "@/components/theme";
import { cx } from "@/components/theme/utils";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface PaymentOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
}

export interface PaymentOptionDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (option: PaymentOption) => void;
  selectedId?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const PAYMENT_OPTIONS: PaymentOption[] = [
  { id: "stripe", name: "Stripe / Card", icon: <CreditCard className="h-4 w-4" />, color: "bg-blue-500" },
  { id: "paypal", name: "PayPal", icon: <Wallet className="h-4 w-4" />, color: "bg-indigo-600" },
  { id: "bank", name: "Bank Transfer", icon: <Landmark className="h-4 w-4" />, color: "bg-emerald-600" },
];

// ============================================================================
// COMPONENT: PaymentOptionDropdown
// ============================================================================

/**
 * PaymentOptionDropdown - Organism
 * 
 * A high-fidelity dropdown for selecting payment methods.
 * Features search filtering and branded icons.
 */
export const PaymentOptionDropdown: React.FC<PaymentOptionDropdownProps> = ({
  isOpen,
  onClose,
  onSelect,
  selectedId,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen) return null;

  const filteredOptions = PAYMENT_OPTIONS.filter((opt) =>
    opt.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Invisible Backdrop for closing */}
      <div 
        className="fixed inset-0 z-[80] bg-transparent" 
        onClick={onClose}
      />
      
      <div 
        className="absolute top-[calc(100%+8px)] left-0 z-[90] w-full bg-white rounded-[24px] shadow-[0_20px_50px_rgba(23,74,95,0.15)] border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 space-y-4">
          {/* SEARCH HEADER */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text"
              autoFocus
              placeholder="Search payment method..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 border-none text-[13px] outline-none focus:ring-2 focus:ring-[#1D4A44]/10 transition-all"
            />
          </div>

          {/* OPTIONS LIST */}
          <div className="space-y-1 max-h-[240px] overflow-y-auto custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div 
                  key={option.id}
                  onClick={() => {
                    onSelect(option);
                    onClose();
                  }}
                  className={cx(
                    "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all group",
                    selectedId === option.id 
                      ? "bg-[#1D4A44]/5" 
                      : "hover:bg-slate-50"
                  )}
                >
                  <div className={cx(
                    "w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105",
                    option.color
                  )}>
                    {option.icon}
                  </div>
                  
                  <Typography className={cx(
                    "text-[13px] font-bold flex-1 transition-colors",
                    selectedId === option.id ? "text-[#1D4A44]" : "text-[#174A5F]/70"
                  )}>
                    {option.name}
                  </Typography>

                  {selectedId === option.id && (
                    <div className="w-5 h-5 rounded-full bg-[#1D4A44] flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="py-8 text-center">
                <Typography className="text-[12px] text-slate-400">No payment methods found</Typography>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PaymentOptionDropdown;
