import React from 'react';
import Image from 'next/image';
import { Typography } from '@/components/theme';
import Rating from '@/components/atoms/Rating';
import Badge from '@/components/atoms/Badge';
import { cx } from '@/components/theme/utils';

export type RentCardVariant = 'resources' | 'on-hand' | 'history';

export interface RentCardProps {
  id: string;
  title: string;
  image: string;
  badgeText?: string;
  price: string;
  statusText: string;
  statusColor?: 'default' | 'error';
  rating: number;
  reviewCount: number;
  variant: RentCardVariant;
  onAction?: () => void;
}

export const RentCard: React.FC<RentCardProps> = ({
  title,
  image,
  badgeText,
  price,
  statusText,
  statusColor = 'default',
  rating,
  reviewCount,
  variant,
  onAction,
}) => {
  const showButton = variant !== 'history';
  const buttonLabel = variant === 'resources' ? 'Rent resource' : 'Modify';

  return (
    <div className="flex flex-col bg-white w-full max-w-[240px] group transition-all duration-300">
      {/* Image Area */}
      <div className="relative aspect-[1.1] bg-[#F1F5F9] overflow-hidden">
        {badgeText && (
          <div className="absolute top-3 left-3 z-10">
            <Badge variant="success">{badgeText}</Badge>
          </div>
        )}
        <div className="relative w-full h-full p-4 flex items-center justify-center">
          <Image
            src={image}
            alt={title}
            fill
            className="object-contain p-6 mix-blend-multiply"
          />
        </div>
      </div>

      {/* Action Button */}
      {showButton && (
        <button 
          onClick={onAction}
          className="w-full h-10 border border-[#174A5F]/20 flex items-center justify-center text-[11px] font-bold text-[#174A5F] hover:bg-[#174A5F]/5 transition-colors"
        >
          {buttonLabel}
        </button>
      )}

      {/* Info Area */}
      <div className={cx("space-y-1.5", showButton ? "pt-4" : "pt-4")}>
        <Typography className="text-sm font-bold text-[#174A5F] line-clamp-1 leading-tight">
          {title}
        </Typography>

        <Typography className="text-[13px] font-bold text-[#ef4444]">
          {price}
        </Typography>

        <Typography className={cx(
          "text-[11px] font-medium",
          statusColor === 'error' ? "text-[#ef4444]" : "text-[#64748B]"
        )}>
          {statusText}
        </Typography>

        <Rating value={rating} count={reviewCount} />
      </div>
    </div>
  );
};

export default RentCard;
