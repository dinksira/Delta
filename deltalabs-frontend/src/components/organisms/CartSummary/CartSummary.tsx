import React from 'react';
import { Typography } from '@/components/theme';

export interface CartSummaryProps {
  totalQuantity: number;
  totalPrice: string;
  onContinueToPayment: () => void;
  onFindSponsor: () => void;
  onGroupPurchase: () => void;
}

export const CartSummary: React.FC<CartSummaryProps> = ({
  totalQuantity,
  totalPrice,
  onContinueToPayment,
  onFindSponsor,
  onGroupPurchase,
}) => {
  return (
    <div className="w-full max-w-[320px] space-y-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-border-default pb-4">
          <Typography className="text-[17px] font-medium text-[#64748B]">
            Product Quantity
          </Typography>
          <Typography className="text-xl font-bold text-[#174A5F]">
            {totalQuantity}
          </Typography>
        </div>

        <div className="flex items-center justify-between border-b border-border-default pb-4">
          <Typography className="text-[17px] font-medium text-[#64748B]">
            Product total
          </Typography>
          <Typography className="text-xl font-bold text-[#174A5F]">
            {totalPrice}
          </Typography>
        </div>
      </div>

      <div className="space-y-4">
        <button 
          onClick={onContinueToPayment}
          className="w-full h-14 bg-[#174A5F] text-white rounded-lg font-bold text-sm tracking-widest uppercase hover:bg-[#133e50] transition-all shadow-lg shadow-[#174A5F]/20"
        >
          Continue to Payment
        </button>

        <button 
          onClick={onFindSponsor}
          className="w-full h-14 border-2 border-[#174A5F]/20 text-[#174A5F] rounded-lg font-bold text-sm tracking-widest uppercase hover:bg-[#174A5F]/5 transition-all"
        >
          Find Sponsor
        </button>

        <button 
          onClick={onGroupPurchase}
          className="w-full h-14 border-2 border-[#174A5F]/20 text-[#174A5F] rounded-lg font-bold text-sm tracking-widest uppercase hover:bg-[#174A5F]/5 transition-all"
        >
          Group Purchase
        </button>
      </div>
    </div>
  );
};

export default CartSummary;
