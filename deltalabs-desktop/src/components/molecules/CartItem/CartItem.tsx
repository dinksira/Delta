import React from 'react';
import Image from 'next/image';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Typography } from '@/components/theme';
import Rating from '@/components/atoms/Rating';

export interface CartItemProps {
  id: string;
  title: string;
  image: string;
  batteryLife?: string;
  itemsLeft?: number;
  rating: number;
  reviewCount: number;
  price: string;
  quantity: number;
  onUpdateQuantity: (id: string, newQuantity: number) => void;
  onRemove: (id: string) => void;
}

export const CartItem: React.FC<CartItemProps> = ({
  id,
  title,
  image,
  batteryLife,
  itemsLeft,
  rating,
  reviewCount,
  price,
  quantity,
  onUpdateQuantity,
  onRemove,
}) => {
  return (
    <div className="flex items-center gap-6 bg-white border border-[#174A5F]/10 rounded-[20px] p-4 pr-6 w-full shadow-sm hover:shadow-md transition-shadow">
      {/* Image Area */}
      <div className="shrink-0 w-20 h-20 bg-[#F1F5F9] rounded-xl overflow-hidden p-2 flex items-center justify-center">
        <Image 
          src={image} 
          alt={title} 
          width={64} 
          height={64} 
          className="object-contain mix-blend-multiply" 
        />
      </div>

      {/* Info Area */}
      <div className="flex-1 min-w-0 space-y-1">
        <Typography className="text-sm font-bold text-[#174A5F] truncate">
          {title}
        </Typography>
        {batteryLife && (
          <Typography className="text-[11px] font-medium text-[#64748B]">
            {batteryLife}
          </Typography>
        )}
        {itemsLeft !== undefined && (
          <Typography className="text-[11px] font-medium text-[#64748B]">
            {itemsLeft} items left
          </Typography>
        )}
        <Rating value={rating} count={reviewCount} />
      </div>

      {/* Quantity Selector Area */}
      <div className="shrink-0 flex items-center gap-4">
        <div className="flex items-center h-10 border border-[#174A5F]/10 rounded-lg overflow-hidden bg-white">
          <button 
            onClick={() => onUpdateQuantity(id, Math.max(0, quantity - 1))}
            className="w-10 h-full flex items-center justify-center text-[#174A5F] hover:bg-[#174A5F]/5 transition-colors"
          >
            <Minus className="h-4 w-4" />
          </button>
          <div className="w-10 h-full flex items-center justify-center border-x border-[#174A5F]/10">
            <Typography className="text-sm font-bold text-[#174A5F]">
              {quantity}
            </Typography>
          </div>
          <button 
            onClick={() => onUpdateQuantity(id, quantity + 1)}
            className="w-10 h-full flex items-center justify-center text-[#174A5F] hover:bg-[#174A5F]/5 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <Typography className="text-sm font-bold text-[#174A5F] min-w-[60px] text-center">
          {price}
        </Typography>

        <button 
          onClick={() => onRemove(id)}
          className="h-10 px-4 bg-[#174A5F] rounded-lg flex items-center justify-center gap-2 text-white hover:bg-[#133e50] transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          <span className="text-[11px] font-bold">Remove from Cart</span>
        </button>
      </div>
    </div>
  );
};

export default CartItem;
