import React from 'react';
import Image from 'next/image';
import { ShoppingCart, MapPin, ChevronUp, ChevronDown } from 'lucide-react';
import { Typography } from '@/components/theme';
import Badge, { BadgeVariant } from '@/components/atoms/Badge';
import Rating from '@/components/atoms/Rating';

export interface ResourceCardProps {
  id: string;
  title: string;
  image: string;
  badgeText?: string;
  badgeVariant?: BadgeVariant;
  institutionName: string;
  institutionLogo?: string;
  price: string;
  rating: number;
  reviewCount: number;
  location: string;
  type: 'marketplace' | 'community';
  onAddToCart?: () => void;
  onShare?: () => void;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({
  title,
  image,
  badgeText,
  badgeVariant = 'success',
  institutionName,
  institutionLogo,
  price,
  rating,
  reviewCount,
  location,
  type,
  onAddToCart,
  onShare,
}) => {
  return (
    <div className="flex flex-col bg-white w-full max-w-[240px] group transition-all duration-300">
      {/* Image Area */}
      <div className="relative aspect-[1.1] bg-[#F1F5F9] overflow-hidden">
        {badgeText && (
          <div className="absolute top-3 left-3 z-10">
            <Badge variant={badgeVariant}>{badgeText}</Badge>
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

      {/* Action Area */}
      <div className="relative">
        {type === 'marketplace' ? (
          <div className="flex w-full h-11">
            <button 
              onClick={onAddToCart}
              className="flex-1 bg-[#174A5F] text-white flex items-center justify-center gap-2 hover:bg-[#133e50] transition-colors"
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="text-xs font-bold">Add To Cart</span>
            </button>
            <div className="w-10 bg-[#174A5F] border-l border-white/10 flex flex-col items-center justify-center text-white">
              <span className="text-[10px] font-bold">1</span>
              <div className="flex flex-col -gap-1">
                <ChevronUp className="h-3 w-3 cursor-pointer hover:text-secondary-500" />
                <ChevronDown className="h-3 w-3 cursor-pointer hover:text-secondary-500" />
              </div>
            </div>
          </div>
        ) : (
          <button 
            onClick={onShare}
            className="w-full h-11 border border-[#174A5F]/20 flex items-center justify-center gap-2 text-[#174A5F] hover:bg-[#174A5F]/5 transition-colors"
          >
            <span className="text-xs font-bold">Share</span>
          </button>
        )}
      </div>

      {/* Info Area */}
      <div className="pt-4 space-y-2">
        <Typography className="text-sm font-bold text-[#174A5F] line-clamp-1 leading-tight">
          {title}
        </Typography>

        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-full border border-border-default overflow-hidden flex items-center justify-center bg-white">
            {institutionLogo ? (
              <Image src={institutionLogo} alt={institutionName} width={16} height={16} />
            ) : (
              <div className="bg-primary-600 w-full h-full" />
            )}
          </div>
          <Typography className="text-[10px] font-medium text-[#64748B]">
            {institutionName}
          </Typography>
        </div>

        <Typography className="text-[13px] font-bold text-[#ef4444]">
          {price}
        </Typography>

        <Rating value={rating} count={reviewCount} />

        <div className="flex items-center gap-1.5 text-[#174A5F]">
          <MapPin className="h-3.5 w-3.5 fill-current" />
          <Typography className="text-[11px] font-bold">
            {location}
          </Typography>
        </div>
      </div>
    </div>
  );
};

export default ResourceCard;
