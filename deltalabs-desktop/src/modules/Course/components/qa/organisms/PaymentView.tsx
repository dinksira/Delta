/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import React from "react";
import { 
  ArrowUp, 
  Plus
} from "lucide-react";
import { Typography } from "@/components/theme";
import Image from "next/image";

/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** 
 * PaymentView Organism
 * Displays the payment management dashboard with balance and quick actions.
 */
export const PaymentView: React.FC = () => {
  return (
    <div className="flex flex-col w-full py-6">
      {/* Balance Section */}
      <div className="flex flex-col items-center gap-2 mb-8">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full overflow-hidden border border-border-subtle bg-black">
             <Image src="/biology_neural_network_hero.png" alt="User" width={24} height={24} className="object-cover" />
          </div>
          <Typography className="text-[17px] font-medium text-[#4A7280]">
            Balance
          </Typography>
        </div>
        <Typography className="text-[32px] font-black text-primary-900">
          $500.93
        </Typography>
        <div className="w-full h-[1px] bg-border-subtle/50 mt-4 max-w-[600px]" />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-4 max-w-[600px] mx-auto w-full">
        <PaymentActionButton 
          label="Send" 
          icon={<ArrowUp className="text-white" size={24} />} 
        />
        <PaymentActionButton 
          label="Request" 
          icon={<Plus className="text-white" size={24} />} 
        />
        <PaymentActionButton 
          label="Financial Service with Visa Card" 
          icon={<Typography className="text-white font-black text-[10px]">Visa</Typography>} 
        />
      </div>
    </div>
  );
};

/** Helper Component */
const PaymentActionButton: React.FC<{ label: string, icon: React.ReactNode }> = ({ label, icon }) => (
  <button className="flex items-center gap-6 p-6 rounded-2xl bg-[#C3D1D6] hover:bg-[#B5C5CC] transition-all duration-200 group active:scale-[0.98]">
    <div className="h-12 w-12 rounded-full bg-primary-900 flex items-center justify-center shrink-0 shadow-lg shadow-primary-900/20 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <Typography className="text-[18px] font-black text-primary-900">
      {label}
    </Typography>
  </button>
);

/** ################################ /COMPONENT ############################# */
