import React from 'react';
import Image from 'next/image';
import { MapPin } from 'lucide-react';
import { Typography } from '@/components/theme';
import Rating from '@/components/atoms/Rating';
import { cn } from '@/lib/utils';

export type OrderStatus = 'requested' | 'rejected' | 'completed' | 'none';

export interface OrderCardProps {
  id: string;
  title: string;
  image: string;
  status?: OrderStatus;
  price?: string;
  rating?: number;
  reviewCount?: number;
  location?: string;
  institutionName?: string;
  institutionLogo?: string;
  type: 'purchase' | 'rent' | 'financial-aid';
  onShowOnMap?: () => void;
  onCancelOrder?: () => void;
  onOrderReceived?: () => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  title,
  image,
  status = 'none',
  price,
  rating,
  reviewCount,
  location,
  institutionName,
  type,
  onShowOnMap,
  onCancelOrder,
  onOrderReceived,
}) => {
  const isFinancialAid = type === 'financial-aid';

  return (
    <div className="flex flex-col bg-white w-full max-w-[240px] group transition-all duration-300">
      {/* Image Area */}
      <div className="relative aspect-[1.1] bg-[#F1F5F9] overflow-hidden">
        <div className="relative w-full h-full p-4 flex items-center justify-center">
          <Image
            src={image}
            alt={title}
            fill
            className="object-contain p-6 mix-blend-multiply"
          />
        </div>
      </div>

      {/* Status Banner (for Financial Aid) */}
      {isFinancialAid && status !== 'none' && (
        <div className={cn(
          "w-full h-8 flex items-center justify-center text-[11px] font-bold text-white uppercase tracking-wider",
          status === 'requested' ? "bg-[#F5A623]" : "bg-[#ef4444]"
        )}>
          {status}
        </div>
      )}

      {/* Info Area */}
      <div className="pt-4 space-y-3">
        <Typography className="text-sm font-bold text-[#174A5F] line-clamp-1 leading-tight">
          {title}
        </Typography>

        {isFinancialAid ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full border border-border-default overflow-hidden flex items-center justify-center bg-white">
                <div className="bg-primary-600 w-full h-full" />
              </div>
              <Typography className="text-[10px] font-medium text-[#64748B]">
                {institutionName || 'Addis ababa university'}
              </Typography>
            </div>
            {price && <Typography className="text-[13px] font-bold text-[#ef4444]">{price}</Typography>}
            {rating !== undefined && <Rating value={rating} count={reviewCount} />}
            {location && (
              <div className="flex items-center gap-1.5 text-[#174A5F]">
                <MapPin className="h-3.5 w-3.5 fill-current" />
                <Typography className="text-[11px] font-bold">{location}</Typography>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2 pt-2">
            <button 
              onClick={onShowOnMap}
              className="w-full h-9 border border-[#174A5F]/20 rounded-lg flex items-center justify-center text-[11px] font-bold text-[#174A5F] hover:bg-[#174A5F]/5 transition-colors"
            >
              Show on map
            </button>
            <button 
              onClick={onCancelOrder}
              className="w-full h-9 border border-[#174A5F]/20 rounded-lg flex items-center justify-center text-[11px] font-bold text-[#174A5F] hover:bg-[#174A5F]/5 transition-colors"
            >
              Cancel Order
            </button>
            <button 
              onClick={onOrderReceived}
              className="w-full h-9 border border-[#174A5F]/20 rounded-lg flex items-center justify-center text-[11px] font-bold text-[#174A5F] hover:bg-[#174A5F]/5 transition-colors"
            >
              Order Received
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderCard;
