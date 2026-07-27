/** ################################ IMPORT ############################# */
import React, { useState } from "react";
import { CreditCard, Landmark, Smartphone } from "lucide-react";
import { Modal } from "@/components/atoms/Modal/Modal";
import { Typography, Button } from "@/components/theme";
import { cx } from "@/components/theme/utils";

/** ################################ /IMPORT ############################# */

/** ################################ TYPES & INTERFACES ############################# */

export interface PaymentMethod {
  id: string;
  name: string;
  accountInfo: string;
  icon: React.ReactNode;
}

export interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (method: PaymentMethod) => void;
}

/** ################################ /TYPES & INTERFACES ############################# */

/** ################################ CONSTANTS ############################# */

const METHODS: { id: string; name: string; icon: React.ReactNode; placeholder: string }[] = [
  { id: "credit", name: "Credit", icon: <CreditCard className="h-5 w-5" />, placeholder: "Enter card details (e.g. Card Number, Expiry)" },
  { id: "paypal", name: "PayPal", icon: <Smartphone className="h-5 w-5" />, placeholder: "Enter PayPal email address" },
  { id: "bank", name: "Bank Transfer", icon: <Landmark className="h-5 w-5" />, placeholder: "Enter bank account name and number" },
];

/** ################################ /CONSTANTS ############################# */

/** ################################ COMPONENT ############################# */

/**
 * PaymentMethodModal
 * A compact "mini" modal for selecting payment methods and entering detailed info.
 */
export const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({ isOpen, onClose, onSelect }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({
    cardNumber: "", expiry: "", cvv: "", holderName: "",
    paypalEmail: "", paypalName: "",
    bankHolder: "", bankAccount: "", bankName: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSelect = () => {
    const method = METHODS.find(m => m.id === selectedId);
    if (method) {
      // Collect only relevant data based on selectedId
      let accountInfo = "";
      if (selectedId === "credit") {
        accountInfo = `Card: ${formData.cardNumber} (Exp: ${formData.expiry})`;
      } else if (selectedId === "paypal") {
        accountInfo = `PayPal: ${formData.paypalEmail}`;
      } else if (selectedId === "bank") {
        accountInfo = `Bank: ${formData.bankName} - ${formData.bankAccount}`;
      }

      onSelect({
        id: method.id,
        name: method.name,
        accountInfo,
        icon: method.icon
      });
      onClose();
    }
  };

  const isFormValid = () => {
    if (!selectedId) return false;
    if (selectedId === "credit") return !!(formData.cardNumber && formData.expiry && formData.cvv && formData.holderName);
    if (selectedId === "paypal") return !!(formData.paypalEmail && formData.paypalName);
    if (selectedId === "bank") return !!(formData.bankHolder && formData.bankAccount && formData.bankName);
    return false;
  };

  const renderFields = () => {
    switch (selectedId) {
      case "credit":
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-text-primary/60">Card Number</label>
              <input 
                value={formData.cardNumber}
                onChange={(e) => handleInputChange("cardNumber", e.target.value)}
                placeholder="0000 0000 0000 0000"
                className="w-full h-11 px-4 rounded-xl border border-border-subtle text-[14px] outline-none focus:border-primary-900/40"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-text-primary/60">Expiry Date</label>
                <input 
                  value={formData.expiry}
                  onChange={(e) => handleInputChange("expiry", e.target.value)}
                  placeholder="MM/YY"
                  className="w-full h-11 px-4 rounded-xl border border-border-subtle text-[14px] outline-none focus:border-primary-900/40"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-text-primary/60">CVV</label>
                <input 
                  value={formData.cvv}
                  onChange={(e) => handleInputChange("cvv", e.target.value)}
                  placeholder="123"
                  className="w-full h-11 px-4 rounded-xl border border-border-subtle text-[14px] outline-none focus:border-primary-900/40"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-text-primary/60">Card Holder Name</label>
              <input 
                value={formData.holderName}
                onChange={(e) => handleInputChange("holderName", e.target.value)}
                placeholder="John Doe"
                className="w-full h-11 px-4 rounded-xl border border-border-subtle text-[14px] outline-none focus:border-primary-900/40"
              />
            </div>
          </div>
        );
      case "paypal":
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-text-primary/60">PayPal Email</label>
              <input 
                value={formData.paypalEmail}
                onChange={(e) => handleInputChange("paypalEmail", e.target.value)}
                placeholder="email@example.com"
                className="w-full h-11 px-4 rounded-xl border border-border-subtle text-[14px] outline-none focus:border-primary-900/40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-text-primary/60">Full Name</label>
              <input 
                value={formData.paypalName}
                onChange={(e) => handleInputChange("paypalName", e.target.value)}
                placeholder="John Doe"
                className="w-full h-11 px-4 rounded-xl border border-border-subtle text-[14px] outline-none focus:border-primary-900/40"
              />
            </div>
          </div>
        );
      case "bank":
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-text-primary/60">Account Holder Name</label>
              <input 
                value={formData.bankHolder}
                onChange={(e) => handleInputChange("bankHolder", e.target.value)}
                placeholder="John Doe"
                className="w-full h-11 px-4 rounded-xl border border-border-subtle text-[14px] outline-none focus:border-primary-900/40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-text-primary/60">Account Number</label>
              <input 
                value={formData.bankAccount}
                onChange={(e) => handleInputChange("bankAccount", e.target.value)}
                placeholder="1234567890"
                className="w-full h-11 px-4 rounded-xl border border-border-subtle text-[14px] outline-none focus:border-primary-900/40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-bold text-text-primary/60">Bank Name</label>
              <input 
                value={formData.bankName}
                onChange={(e) => handleInputChange("bankName", e.target.value)}
                placeholder="e.g. Bank of Abyssinia"
                className="w-full h-11 px-4 rounded-xl border border-border-subtle text-[14px] outline-none focus:border-primary-900/40"
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Payment Methods"
      className="w-full max-w-[450px]"
    >
      <div className="space-y-6 pt-2">
        <Typography className="text-[14px] text-text-tertiary">
          Select a method and provide the necessary payment details below.
        </Typography>

        <div className="grid grid-cols-3 gap-3">
          {METHODS.map((method) => (
            <div 
              key={method.id}
              onClick={() => setSelectedId(method.id)}
              className={cx(
                "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all",
                selectedId === method.id ? "border-primary-900 bg-primary-900/5" : "border-border-subtle hover:border-primary-900/30"
              )}
            >
              <div className={cx(
                "p-2 rounded-lg",
                selectedId === method.id ? "bg-primary-900 text-white" : "bg-surface-secondary text-primary-900/60"
              )}>
                {method.icon}
              </div>
              <Typography className={cx("text-[13px] font-bold text-center", selectedId === method.id ? "text-primary-900" : "text-text-primary")}>
                {method.name}
              </Typography>
            </div>
          ))}
        </div>

        {/* Details Fields */}
        {renderFields()}

        <div className="pt-2">
          <Button 
            disabled={!isFormValid()}
            onClick={handleSelect}
            className={cx(
              "w-full h-12 rounded-xl font-bold text-[16px] shadow-lg transition-all",
              isFormValid() ? "!bg-primary-900 !text-white shadow-primary-900/20" : "opacity-50 grayscale"
            )}
          >
            Confirm & Continue
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PaymentMethodModal;
/** ################################ /COMPONENT ############################# */
