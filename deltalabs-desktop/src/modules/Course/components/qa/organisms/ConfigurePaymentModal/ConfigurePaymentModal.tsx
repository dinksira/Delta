/** ################################ IMPORT ############################# */
import React, { useState } from "react";
import { Paperclip, ChevronDown } from "lucide-react";
import { Modal } from "@/components/atoms/Modal/Modal";
import { Typography, Button } from "@/components/theme";
import { cx } from "@/components/theme/utils";

/** ################################ /IMPORT ############################# */

/** ################################ TYPES & INTERFACES ############################# */

export interface PaymentConfig {
  amount: string;
  requirement: string;
  documentName: string;
  paymentType: string;
}

export interface ConfigurePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (config: PaymentConfig) => void;
}

/** ################################ /TYPES & INTERFACES ############################# */

/** ################################ COMPONENT ############################# */

/**
 * ConfigurePaymentModal
 * High-fidelity modal for configuring payment details for a paid question.
 */
export const ConfigurePaymentModal: React.FC<ConfigurePaymentModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [amount, setAmount] = useState("");
  const [requirement, setRequirement] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [paymentType, setPaymentType] = useState("Selected Option");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleConfirm = () => {
    onConfirm({ amount, requirement, documentName, paymentType });
    onClose();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Configure Payment"
      className="w-full max-w-[600px]"
    >
      <div className="space-y-6 pt-4">
        {/* Amount Field */}
        <div className="space-y-2">
          <label className="text-[14px] font-medium text-text-tertiary block">Amount</label>
          <div className="relative">
            <input 
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full h-12 border border-border-subtle rounded-xl px-4 text-[14px] outline-none focus:border-primary-900/40 transition-all"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[14px] text-text-tertiary/60">
              1100 birr
            </span>
          </div>
        </div>

        {/* Payment Requirement Field */}
        <div className="space-y-2">
          <label className="text-[14px] font-medium text-text-tertiary block">Payment Requirement</label>
          <input 
            type="text"
            value={requirement}
            onChange={(e) => setRequirement(e.target.value)}
            className="w-full h-12 border border-border-subtle rounded-xl px-4 text-[14px] outline-none focus:border-primary-900/40 transition-all"
          />
        </div>

        {/* Payment Requirement doc Field */}
        <div className="space-y-2">
          <label className="text-[14px] font-medium text-text-tertiary block">Payment Requirement doc</label>
          <div className="relative">
            <input 
              type="text"
              value={documentName}
              readOnly
              placeholder="add document"
              className="w-full h-12 border border-border-subtle rounded-xl px-4 text-[14px] outline-none bg-white cursor-pointer"
            />
            <Paperclip className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-tertiary/60" />
          </div>
        </div>

        {/* Payment Selection Dropdown */}
        <div className="space-y-2 relative">
          <label className="text-[14px] font-medium text-text-tertiary block">Payment</label>
          <div 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={cx(
              "w-full h-12 border rounded-xl px-4 flex items-center justify-between bg-white cursor-pointer transition-all",
              isDropdownOpen ? "border-primary-900" : "border-border-subtle"
            )}
          >
            <span className="text-[14px] text-text-tertiary">
              {paymentType}
            </span>
            <ChevronDown className={cx("h-5 w-5 text-text-tertiary transition-transform", isDropdownOpen && "rotate-180")} />
          </div>

          {isDropdownOpen && (
            <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-border-subtle rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div 
                onClick={() => { setPaymentType("On hold"); setIsDropdownOpen(false); }}
                className="px-4 py-3 text-[14px] text-text-tertiary hover:bg-surface-secondary hover:text-primary-900 cursor-pointer transition-colors"
              >
                On hold
              </div>
              <div 
                onClick={() => { setPaymentType("On Promise"); setIsDropdownOpen(false); }}
                className="px-4 py-3 text-[14px] text-text-tertiary hover:bg-surface-secondary hover:text-primary-900 cursor-pointer transition-colors"
              >
                On Promise
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-6">
          <Button 
            onClick={handleConfirm}
            className="h-11 px-10 rounded-xl !bg-primary-900 !text-white font-bold text-[14px] shadow-lg shadow-primary-900/10 transition-all active:scale-95"
          >
            Continue
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfigurePaymentModal;
/** ################################ /COMPONENT ############################# */
